/**
 * useBiometricAuth.ts
 * Low-level hook that wraps react-native-biometrics.
 * Checks hardware availability once on mount and exposes a stable
 * authenticate() function that can be called at any time.
 */

import { useState, useEffect, useCallback } from 'react';
import ReactNativeBiometrics from 'react-native-biometrics';

export type BiometricType = 'TouchID' | 'FaceID' | 'Biometrics' | null;

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export interface UseBiometricAuth {
  /** True once the hardware check has completed and biometrics are available. */
  isAvailable: boolean;
  /** True while the initial hardware availability check is in progress. */
  isChecking: boolean;
  /** The kind of biometric sensor found, or null if unavailable. */
  biometricType: BiometricType;
  /** Show the OS biometric prompt. Resolves when the prompt closes. */
  authenticate: (promptMessage: string) => Promise<BiometricAuthResult>;
}

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: false });

export function useBiometricAuth(): UseBiometricAuth {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [biometricType, setBiometricType] = useState<BiometricType>(null);

  useEffect(() => {
    rnBiometrics
      .isSensorAvailable()
      .then(({ available, biometryType }) => {
        setIsAvailable(available);
        if (available && biometryType) {
          setBiometricType(biometryType as BiometricType);
        }
      })
      .catch(() => {
        setIsAvailable(false);
      })
      .finally(() => setIsChecking(false));
  }, []);

  const authenticate = useCallback(
    async (promptMessage: string): Promise<BiometricAuthResult> => {
      try {
        const { success } = await rnBiometrics.simplePrompt({ promptMessage });
        return { success };
      } catch (err: any) {
        return { success: false, error: err?.message ?? 'Authentication failed' };
      }
    },
    [],
  );

  return { isAvailable, isChecking, biometricType, authenticate };
}
