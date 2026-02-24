import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

type ThemeMode = 'light' | 'dark';
interface ThemeContextType {
  isDark: boolean;
  theme: typeof COLORS.light;
  colors: typeof COLORS;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  useEffect(() => {
    AsyncStorage.getItem('theme').then(val => {
      if (val === 'light' || val === 'dark') setMode(val);
    });
  }, []);
  const toggleTheme = async () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    await AsyncStorage.setItem('theme', next);
  };
  const isDark = mode === 'dark';
  return (
    <ThemeContext.Provider value={{ isDark, theme: isDark ? COLORS.dark : COLORS.light, colors: COLORS, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
