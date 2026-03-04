import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  style?: any;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, style }) => {
  const { colors } = useApp();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          shadowColor: colors.shadow,
        },
        style,
      ]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    gap: SPACING.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: FONT_SIZE.xl,
  },
  value: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
});
