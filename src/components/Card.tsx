import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, RADIUS } from '../constants/theme';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export default function Card({ children, style, noPadding }: Props) {
  const { theme, isDark } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          shadowColor: isDark ? '#000' : '#1A2744',
        },
        noPadding ? {} : styles.padding,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  padding: {
    padding: SPACING.md,
  },
});
