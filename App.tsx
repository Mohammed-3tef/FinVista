/**
 * FinVista - Financial Goals & Savings Tracker
 */

import React, { useState } from 'react';
import { View, Modal, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { GoalsProvider } from './src/contexts/GoalsContext';
import { BadgesProvider } from './src/contexts/BadgesContext';
import { SmsProvider } from './src/contexts/SmsContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import LockScreen from './src/components/LockScreen';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { resolveIcon } from './src/constants/icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from './src/constants/theme';

/**
 * AuthGate renders the LockScreen until the user has an active session.
 * It must live inside AuthProvider so it can consume the auth context.
 * It blocks AppNavigator (and therefore the entire app) until authenticated,
 * preventing any navigation bypass.
 */
function AuthGate() {
  const { isLoading, isAuthenticated, hasSeenOnboarding, pendingLockReason, confirmExpiredLock, resetActivity } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();

  // Wait for AsyncStorage reads on cold start
  if (isLoading) return null;

  // First launch: show Onboarding (AppNavigator routes to it internally).
  // Skip auth entirely — LockScreen (PIN setup) appears after onboarding.
  if (!hasSeenOnboarding) return <AppNavigator />;

  // Onboarding done but session locked — show LockScreen
  if (!isAuthenticated) return <LockScreen />;

  return (
    <>
      {/* Main app — disable touches while the expired modal is open */}
      <View
        style={{ flex: 1 }}
        onTouchStart={pendingLockReason ? undefined : resetActivity}
        pointerEvents={pendingLockReason ? 'none' : 'auto'}>
        <AppNavigator />
      </View>

      {/* Session-expired modal — shown over the current screen, BEFORE lock screen */}
      <Modal
        visible={!!pendingLockReason}
        transparent
        animationType="fade"
        onRequestClose={confirmExpiredLock}>
        <View style={gateStyles.overlay}>
          <View style={[gateStyles.card, { backgroundColor: theme.card }]}>
            <FontAwesomeIcon
              icon={resolveIcon('faCircleExclamation')}
              size={32}
              color={COLORS.accent}
            />
            <Text style={[gateStyles.title, { color: theme.text }]}>
              {t.sessionExpiredTitle}
            </Text>
            <Text style={[gateStyles.msg, { color: theme.textSecondary }]}>
              {t.sessionExpiredMsg}
            </Text>
            <TouchableOpacity
              style={[gateStyles.btn, { backgroundColor: COLORS.accent }]}
              onPress={confirmExpiredLock}
              activeOpacity={0.8}>
              <Text style={gateStyles.btnTxt}>{t.ok}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const gateStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  card: {
    width: '100%',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  msg: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  btn: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl * 1.5,
  },
  btnTxt: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <GoalsProvider>
            {/* BadgesProvider must be inside GoalsProvider (watches goals & entries) */}
            <BadgesProvider>
              {/* SmsProvider must be inside GoalsProvider (uses useGoals) */}
              <SmsProvider>
                <AuthGate />
              </SmsProvider>
            </BadgesProvider>
          </GoalsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
