import React from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { resolveIcon } from '../constants/icons';
import { useLanguage } from '../contexts/LanguageContext';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  required?: boolean;
  textAlign?: 'left' | 'center' | 'right';
}

export default function TextInput({ label, error, hint, prefix, suffix, required, style, textAlign, ...props }: Props) {
  const { theme, isDark } = useTheme();
  const { isRTL } = useLanguage();

  const borderColor = error
    ? COLORS.danger
    : isDark ? '#243460' : '#E8EDF8';

  return (
    <View style={styles.container}>
      {/* Label row */}
      <View style={[styles.labelRow, {flexDirection: isRTL ? 'row-reverse' : 'row'}]}>
        <Text style={[styles.label, { color: theme.textSecondary, textAlign: textAlign }]}>{label}</Text>
        {required && <Text style={[styles.required, { textAlign: textAlign }]}> 
          <Text style={[styles.requiredStar, { textAlign: textAlign }]}> * </Text>
        </Text>}
      </View>

      {/* Input */}
      <View style={[
        styles.inputRow,
        { backgroundColor: theme.inputBg, borderColor },
        error && styles.inputRowError,
      ]}>
        {prefix && <Text style={[styles.prefix, { color: COLORS.accent, textAlign: textAlign }]}>{prefix}</Text>}
        <RNTextInput
          {...props}
          style={[styles.input, { color: theme.text, textAlign: textAlign }, style]}
          placeholderTextColor={theme.textMuted}
        />
        {suffix && <Text style={[styles.suffix, { color: theme.textMuted, textAlign: textAlign }]}>{suffix}</Text>}
      </View>

      {/* Error or hint */}
      {error ? (
        <View style={styles.messageRow}>
          <Text style={[styles.errorIcon, { textAlign: textAlign }]}>
            <FontAwesomeIcon icon={resolveIcon('faExclamationTriangle')} size={11} color={COLORS.danger} />
          </Text>
          <Text style={[styles.errorText, { textAlign: textAlign }]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.textMuted, textAlign: textAlign }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  labelRow: { marginBottom: 6 },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  required: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.danger },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
  },
  requiredStar: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.danger },
  inputRowError: { borderWidth: 2 },
  prefix: { fontSize: FONT_SIZE.md, fontWeight: '700', marginRight: 6 },
  suffix: { fontSize: FONT_SIZE.sm, marginLeft: 6 },
  input: { flex: 1, fontSize: FONT_SIZE.md, paddingVertical: SPACING.sm + 4 },
  messageRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 },
  errorIcon: { fontSize: 11, color: COLORS.danger },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZE.xs, flex: 1 },
  hint: { fontSize: FONT_SIZE.xs, marginTop: 5 },
});