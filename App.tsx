/**
 * FinVista - Financial Goals & Savings Tracker
 */

import React from 'react';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { GoalsProvider } from './src/contexts/GoalsContext';
import { SmsProvider } from './src/contexts/SmsContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <GoalsProvider>
          {/* SmsProvider must be inside GoalsProvider (uses useGoals) */}
          <SmsProvider>
            <AppNavigator />
          </SmsProvider>
        </GoalsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
