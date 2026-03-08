/**
 * LockScreen.tsx
 *
 * Full-screen authentication wall shown by AuthGate whenever the session is
 * invalid or the app returns from background after the 5-minute timeout.
 *
 * Flow:
 *  First launch (no PIN set)
 *    → setup  → confirm  → unlock
 *
 *  Normal launch (PIN set, biometric available)
 *    → biometric  ──success──►  unlock
 *                 ──failure──►  pin  ──correct──►  unlock
 *
 *  Normal launch (PIN set, no biometric)
 *    → pin  ──correct──►  unlock
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useAuth } from '../contexts/AuthContext';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { useTheme } from '../contexts/ThemeContext';
import PinPad from './PinPad';
import { resolveIcon } from '../constants/icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';

const PIN_LENGTH = 6;

type LockMode = 'loading' | 'biometric' | 'pin' | 'setup' | 'confirm';

export default function LockScreen() {
  const { hasPinSet, setupPin, verifyPin, unlock, isBiometricEnabled } = useAuth();
  const { isAvailable, isChecking, biometricType, authenticate } =
    useBiometricAuth();
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();

  const [mode, setMode] = useState<LockMode>('loading');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * tempPin holds the first entry during the PIN setup flow.
   * A ref avoids stale-closure issues inside callbacks.
   */
  const tempPinRef = useRef('');

  /**
   * modeRef mirrors mode so async callbacks see the latest value
   * without being listed as dependencies (preventing re-trigger loops).
   */
  const modeRef = useRef<LockMode>('loading');
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ── Shake animation for wrong PIN ─────────────────────────────────────────
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // ── Biometric trigger ─────────────────────────────────────────────────────
  const triggerBiometric = useCallback(async () => {
    setError('');
    const result = await authenticate('Unlock FinVista');
    // Guard: user may have tapped "Use PIN" while the prompt was open
    if (modeRef.current !== 'biometric') return;
    if (result.success) {
      await unlock();
    } else {
      setMode('pin');
    }
  }, [authenticate, unlock]);

  // ── Initialise mode once biometric check completes ────────────────────────
  useEffect(() => {
    if (isChecking) return;

    if (!hasPinSet) {
      setMode('setup');
    } else if (isAvailable && isBiometricEnabled) {
      setMode('biometric');
      triggerBiometric();
    } else {
      setMode('pin');
    }
    // triggerBiometric is stable; isChecking flip is the correct trigger here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking]);

  // ── Handle PIN completion ─────────────────────────────────────────────────
  const handlePinComplete = useCallback(
    async (completedPin: string) => {
      const currentMode = modeRef.current;

      if (currentMode === 'setup') {
        // Save as the first entry and move to confirmation step
        tempPinRef.current = completedPin;
        setPin('');
        setMode('confirm');
        return;
      }

      if (currentMode === 'confirm') {
        if (completedPin !== tempPinRef.current) {
          shake();
          setError(t.pinMismatch);
          setPin('');
          tempPinRef.current = '';
          setMode('setup');
          return;
        }
        setIsProcessing(true);
        await setupPin(completedPin);
        setIsProcessing(false);
        await unlock();
        return;
      }

      if (currentMode === 'pin') {
        setIsProcessing(true);
        const ok = await verifyPin(completedPin);
        setIsProcessing(false);
        if (ok) {
          await unlock();
        } else {
          shake();
          setError(t.incorrectPIN);
          setPin('');
        }
      }
    },
    [shake, setupPin, verifyPin, unlock, t],
  );

  // Auto-submit when the PIN reaches full length
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handlePinComplete(pin);
    }
  }, [pin, handlePinComplete]);

  // ── Derived UI text ───────────────────────────────────────────────────────
  const { titleText, subtitleText } = useMemo(() => {
    switch (mode) {
      case 'setup':
        return {
          titleText: t.createPIN,
          subtitleText: t.createPINSubtitle,
        };
      case 'confirm':
        return {
          titleText: t.confirmPIN,
          subtitleText: t.confirmPINSubtitle,
        };
      case 'pin':
        return {
          titleText: t.enterPIN,
          subtitleText: t.enterPINSubtitle,
        };
      default:
        return {
          titleText: t.welcomeBack,
          subtitleText: biometricType === 'FaceID' ? t.unlockWithFaceID : t.unlockWithFingerprint,
        };
    }
  }, [mode, biometricType, t]);

  // Biometric icon: Face ID → faFaceSmile, fingerprint / generic → faFingerprint
  const biometricIconDef =
    biometricType === 'FaceID' ? resolveIcon('faFaceSmile') : resolveIcon('faFingerprint');

  // ── Loading state (waiting for biometric hardware check) ──────────────────
  if (mode === 'loading') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.bg}
        />
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View style={styles.inner}>
        {/* ── App logo ── */}
        <View>
            <Image
                source={require('../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png')}
                style={styles.brandLogo}
                resizeMode="contain"
            />
        </View>

        <Text style={[styles.appName, { color: theme.text }]}>FinVista</Text>

        {/* ── Title / subtitle / error ── */}
        <Animated.View
          style={[
            styles.textWrap,
            { transform: [{ translateX: shakeAnim }] },
          ]}>
          <Text style={[styles.title, { color: theme.text }]}>{titleText}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitleText}
          </Text>
          {!!error && <Text style={styles.error}>{error}</Text>}
        </Animated.View>

        {/* ── Authentication area ── */}
        {mode === 'biometric' ? (
          <View style={styles.biometricArea}>
            {/* Tap-to-authenticate button */}
            <TouchableOpacity
              style={[
                styles.bioBtn,
                {
                  backgroundColor: COLORS.accent + '1A',
                  borderColor: COLORS.accent + '66',
                },
              ]}
              onPress={triggerBiometric}
              activeOpacity={0.7}
              accessibilityLabel="Authenticate with biometrics"
              accessibilityRole="button">
              <FontAwesomeIcon
                icon={biometricIconDef}
                size={52}
                color={COLORS.accent}
              />
            </TouchableOpacity>

            {/* Fallback to PIN */}
            <TouchableOpacity
              style={styles.fallback}
              onPress={() => {
                setError('');
                setMode('pin');
              }}>
              <Text style={[styles.fallbackTxt, { color: theme.textSecondary }]}>
                {t.usePINInstead}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pinArea}>
            {isProcessing ? (
              <ActivityIndicator
                size="large"
                color={COLORS.accent}
                style={styles.spinner}
              />
            ) : (
              <PinPad value={pin} onChange={setPin} theme={theme} />
            )}

            {/* Switch back to biometrics if available */}
            {mode === 'pin' && isAvailable && isBiometricEnabled && !isProcessing && (
              <TouchableOpacity
                style={styles.fallback}
                onPress={() => {
                  setPin('');
                  setError('');
                  setMode('biometric');
                  triggerBiometric();
                }}>
                <Text
                  style={[styles.fallbackTxt, { color: theme.textSecondary }]}>
                  {biometricType === 'FaceID' ? t.useFaceIDInstead : t.useFingerprintInstead}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  brandLogo: { width: 75, height: 75, borderRadius: FONT_SIZE.xxl },
  appName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  textWrap: {
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  error: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  biometricArea: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  bioBtn: {
    width: 104,
    height: 104,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  fallbackTxt: {
    fontSize: FONT_SIZE.sm,
    textDecorationLine: 'underline',
  },
  spinner: {
    marginVertical: SPACING.xl,
  },
  pinArea: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  // legacy stubs – kept so any external reference won’t break
  expiredBanner: {},
  expiredText: {},
  expiredTitle: {},
  expiredMsg: {},
});
