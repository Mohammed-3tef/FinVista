import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function Button({ label, onPress, variant = 'primary', size = 'md', disabled, loading, style }: Props) {
  const bg = {
    primary: COLORS.accent,
    outline: 'transparent',
    danger: COLORS.danger,
    ghost: 'transparent',
  }[variant];

  const tc = {
    primary: COLORS.primary,
    outline: COLORS.accent,
    danger: '#fff',
    ghost: COLORS.accent,
  }[variant];

  const border = variant === 'outline' ? COLORS.accent : 'transparent';
  const pad = { sm: SPACING.sm, md: SPACING.md, lg: SPACING.lg }[size];
  const fs = { sm: FONT_SIZE.sm, md: FONT_SIZE.md, lg: FONT_SIZE.lg }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor: border, paddingVertical: pad / 1.5, paddingHorizontal: pad * 1.5, opacity: disabled ? 0.5 : 1 },
        variant !== 'ghost' && styles.border,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={tc} size="small" />
      ) : (
        <Text style={[styles.label, { color: tc, fontSize: fs }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  border: { borderWidth: 1.5 },
  label: { fontWeight: '700', letterSpacing: 0.3 },
});
