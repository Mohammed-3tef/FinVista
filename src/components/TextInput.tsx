import React from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  required?: boolean;
}

export default function TextInput({ label, error, hint, prefix, suffix, required, style, ...props }: Props) {
  const { theme, isDark } = useTheme();

  const borderColor = error
    ? COLORS.danger
    : isDark ? '#243460' : '#E8EDF8';

  return (
    <View style={styles.container}>
      {/* Label row */}
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        {required && <Text style={styles.required}> *</Text>}
      </View>

      {/* Input */}
      <View style={[
        styles.inputRow,
        { backgroundColor: theme.inputBg, borderColor },
        error && styles.inputRowError,
      ]}>
        {prefix && <Text style={[styles.prefix, { color: COLORS.accent }]}>{prefix}</Text>}
        <RNTextInput
          {...props}
          style={[styles.input, { color: theme.text, textAlign: props.textAlign }, style]}
          placeholderTextColor={theme.textMuted}
        />
        {suffix && <Text style={[styles.suffix, { color: theme.textMuted }]}>{suffix}</Text>}
      </View>

      {/* Error or hint */}
      {error ? (
        <View style={styles.messageRow}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  required: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.danger },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
  },
  inputRowError: { borderWidth: 2 },
  prefix: { fontSize: FONT_SIZE.md, fontWeight: '700', marginRight: 6 },
  suffix: { fontSize: FONT_SIZE.sm, marginLeft: 6 },
  input: { flex: 1, fontSize: FONT_SIZE.md, paddingVertical: SPACING.sm + 4 },
  messageRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 },
  errorIcon: { fontSize: 11, color: COLORS.danger },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZE.xs, flex: 1 },
  hint: { fontSize: FONT_SIZE.xs, marginTop: 5 },
});