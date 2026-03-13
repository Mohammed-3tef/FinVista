/**
 * AuthContext.tsx
 *
 * Manages:
 *  - PIN storage (via react-native-keychain – OS-encrypted, never plain-text in AsyncStorage)
 *  - Session validity (5-minute inactivity timeout)
 *  - AppState monitoring to detect background → foreground transitions
 *
 * Locking rules:
 *  1. Cold start (app killed / exited)  → ALWAYS locked, regardless of time.
 *  2. App backgrounded ≥ 5 min          → locked when returning to foreground.
 *  3. App in foreground for ≥ 5 min     → locked by inactivity timer (polled every 15 s).
 *  4. Any user touch resets the 5-min inactivity clock via resetActivity().
 *
 * Security notes:
 *  - The PIN is stored exclusively in the platform Keychain (Android Keystore /
 *    iOS Keychain), not in AsyncStorage.
 *  - No session token is ever persisted to AsyncStorage – a cold start is always locked.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

// ─── Constants ────────────────────────────────────────────────────────────────

const PIN_SERVICE = 'com.haweshly.pin';
const HAS_PIN_KEY = '@haweshly_has_pin';

/**
 * Persisted key written when the app goes to background so that, if the OS
 * later kills the process while it is backgrounded, the next cold start can
 * still detect "was backgrounded for a long time" (though cold starts always
 * lock anyway; this key is cleaned up on startup to prevent stale data).
 */
const BACKGROUNDED_AT_KEY = '@haweshly_backgrounded_at';
const BIOMETRIC_ENABLED_KEY = '@haweshly_biometric_enabled';
const ONBOARDING_KEY = 'hasSeenOnboarding';

/** Window of inactivity (background or foreground) before the session expires. */
export const SESSION_TIMEOUT_MS = 1 * 60 * 1000; // 1 minute 

/** How often the foreground inactivity timer polls (should be << SESSION_TIMEOUT_MS). */
const INACTIVITY_POLL_MS = 15_000; // 15 seconds

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPinSet: boolean;
  isBiometricEnabled: boolean;
  /** False until the user completes the first-launch onboarding flow. */
  hasSeenOnboarding: boolean;
  /** Call from OnboardingScreen when the user taps “Get Started”. */
  completeOnboarding: () => Promise<void>;
  /**
   * Set when an automatic timeout is about to lock the session.
   * While non-null, the session is still authenticated — the app shows
   * a modal so the user can acknowledge before the lock screen appears.
   */
  pendingLockReason: 'inactivity' | 'background' | null;
  /** Call when the user dismisses the session-expired modal. Performs the actual lock. */
  confirmExpiredLock: () => void;
  unlock: () => Promise<void>;
  lock: () => void;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  /** Verify PIN, then persist and enable biometric unlock. Returns true on success. */
  enableBiometric: (pin: string) => Promise<boolean>;
  /** Disable biometric unlock (no PIN required). */
  disableBiometric: () => void;
  /**
   * Reset the inactivity clock.
   * Call this on every user touch to prevent the session from expiring while
   * the user is actively interacting (e.g. from a root onTouchStart handler).
   */
  resetActivity: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [pendingLockReason, setPendingLockReason] = useState<'inactivity' | 'background' | null>(null);

  // Ref mirror of isAuthenticated – prevents stale closures inside
  // setInterval / AppState callbacks without adding them as dependencies.
  const isAuthRef = useRef(false);
  useEffect(() => {
    isAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Epoch ms of the last user activity (touch, foreground return, or unlock).
   * Null means no active session.
   */
  const lastActiveAtRef = useRef<number | null>(null);

  // In-memory backgrounded-at timestamp (used for live hot-restarts; the
  // AsyncStorage key handles the OS-kill-while-backgrounded case).
  const backgroundedAtRef = useRef<number | null>(null);

  // ── On mount: load PIN flag only. Cold start ALWAYS starts locked. ─────────
  useEffect(() => {
    (async () => {
      try {
        // Clean up any stale keys left by older builds or the previous session.
        await AsyncStorage.multiRemove([BACKGROUNDED_AT_KEY, '@haweshly_last_auth']);
        const [hasPinStr, bioStr, onboardingStr] = await Promise.all([
          AsyncStorage.getItem(HAS_PIN_KEY),
          AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
          AsyncStorage.getItem(ONBOARDING_KEY),
        ]);
        setHasPinSet(hasPinStr === 'true');
        setIsBiometricEnabled(bioStr === 'true');
        setHasSeenOnboarding(onboardingStr === 'true');
        // isAuthenticated stays false – cold start is always locked.
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Foreground inactivity poller ──────────────────────────────────────────
  // Runs every INACTIVITY_POLL_MS while the component is mounted.
  // Locks the session if lastActiveAt is older than SESSION_TIMEOUT_MS.
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isAuthRef.current || lastActiveAtRef.current === null) return;
      const elapsed = Date.now() - lastActiveAtRef.current;
      if (elapsed >= SESSION_TIMEOUT_MS) {
        // Null out the clock so the timer won't fire again while modal is open.
        lastActiveAtRef.current = null;
        setPendingLockReason('inactivity');
      }
    }, INACTIVITY_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  // ── AppState: background timer ────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      // Going to background / losing focus
      if (prev === 'active' && (next === 'background' || next === 'inactive')) {
        const now = Date.now();
        backgroundedAtRef.current = now;
        // Persist so that if the OS kills the process, the next launch still
        // gets cleaned up (cold start always locks anyway, but this prevents
        // a stale BACKGROUNDED_AT_KEY lingering indefinitely).
        AsyncStorage.setItem(BACKGROUNDED_AT_KEY, String(now));
      }

      // Returning to foreground
      if (next === 'active') {
        const bgAt = backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        AsyncStorage.removeItem(BACKGROUNDED_AT_KEY);

        if (bgAt !== null) {
          const elapsed = Date.now() - bgAt;
          if (elapsed >= SESSION_TIMEOUT_MS) {
            // Backgrounded too long – show modal first, actual lock on OK press.
            lastActiveAtRef.current = null;
            setPendingLockReason('background');
            return;
          }
        }

        // Short background trip – refresh the inactivity clock so the user
        // doesn't get immediately locked just because they checked another app.
        if (isAuthRef.current) {
          lastActiveAtRef.current = Date.now();
        }
      }
    });

    return () => sub.remove();
  }, []);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const resetActivity = useCallback(() => {
    if (isAuthRef.current) {
      lastActiveAtRef.current = Date.now();
    }
  }, []);

  const confirmExpiredLock = useCallback(() => {
    setPendingLockReason(null);
    setIsAuthenticated(false);
  }, []);

  const unlock = useCallback(async () => {
    lastActiveAtRef.current = Date.now();
    setPendingLockReason(null);
    setIsAuthenticated(true);
  }, []);

  const lock = useCallback(() => {
    lastActiveAtRef.current = null;
    setPendingLockReason(null);
    setIsAuthenticated(false);
  }, []);

  const setupPin = useCallback(async (pin: string) => {
    await Keychain.setGenericPassword('haweshly_pin', pin, { service: PIN_SERVICE });
    await AsyncStorage.setItem(HAS_PIN_KEY, 'true');
    setHasPinSet(true);
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const creds = await Keychain.getGenericPassword({ service: PIN_SERVICE });
      if (!creds) return false;
      return creds.password === pin;
    } catch {
      return false;
    }
  }, []);

  const enableBiometric = useCallback(async (pin: string): Promise<boolean> => {
    const ok = await verifyPin(pin);
    if (!ok) return false;
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    setIsBiometricEnabled(true);
    return true;
  }, [verifyPin]);

  const disableBiometric = useCallback(() => {
    AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
    setIsBiometricEnabled(false);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        hasPinSet,
        isBiometricEnabled,
        hasSeenOnboarding,
        completeOnboarding,
        pendingLockReason,
        confirmExpiredLock,
        unlock,
        lock,
        setupPin,
        verifyPin,
        enableBiometric,
        disableBiometric,
        resetActivity,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
