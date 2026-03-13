/**
 * PinPad.tsx
 * Renders a 4-dot indicator and a 3×4 numeric keypad.
 * Pure presentation: calls onChange on every keystroke;
 * the parent decides when the PIN is complete.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { faDeleteLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';

const PIN_LENGTH = 6;

/** The 12 key cells in order; empty string = spacer cell. */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;
type Key = (typeof KEYS)[number];

interface Props {
  value: string;
  onChange: (pin: string) => void;
  /** Resolved theme object from ThemeContext. */
  theme: {
    card: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
  };
}

export default function PinPad({ value, onChange, theme }: Props) {
  const press = (key: Key) => {
    if (key === 'del') {
      onChange(value.slice(0, -1));
    } else if (key !== '' && value.length < PIN_LENGTH) {
      onChange(value + key);
    }
  };

  return (
    <View style={styles.wrap}>
      {/* ── Indicator dots ── */}
      <View style={styles.dots} accessibilityLabel={`PIN entered: ${value.length} of ${PIN_LENGTH} digits`}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < value.length ? COLORS.accent : 'transparent',
                borderColor:
                  i < value.length ? COLORS.accent : theme.cardBorder,
              },
            ]}
          />
        ))}
      </View>

      {/* ── Keypad grid ── */}
      <View style={styles.grid}>
        {KEYS.map((key, i) => {
          if (key === '') {
            return <View key={i} style={styles.cell} />;
          }
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.key,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}
              onPress={() => press(key)}
              activeOpacity={0.55}
              accessibilityLabel={key === 'del' ? 'Delete' : key}
              accessibilityRole="button">
              {key === 'del' ? (
                <FontAwesomeIcon
                  icon={faDeleteLeft}
                  size={22}
                  color={theme.textSecondary}
                />
              ) : (
                <Text style={[styles.keyTxt, { color: theme.text }]}>{key}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: SPACING.xl },
  dots: { flexDirection: 'row', gap: 20 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 288,
    gap: SPACING.sm,
  },
  cell: { width: 88, height: 88 },
  key: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyTxt: { fontSize: FONT_SIZE.xxl, fontWeight: '600' },
});
