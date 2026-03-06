import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useGoals } from '../contexts/GoalsContext';
import { Goal, getTotalSaved, getProgress, getDaysLeft, formatCurrency } from '../utils/calculations';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { resolveIcon } from '../constants/icons';
import Card from './Card';
import ProgressBar from './ProgressBar';

interface Props {
  goal: Goal;
  onPress: () => void;
  onToggleFavorite?: () => void;
}

export default function GoalCard({ goal, onPress, onToggleFavorite }: Props) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { entries } = useGoals();

  const totalSaved = getTotalSaved(entries, goal.id);
  const progress = getProgress(totalSaved, goal.targetAmount);
  const remaining = Math.max(0, goal.targetAmount - totalSaved);
  const daysLeft = getDaysLeft(goal.deadline);

  const color = progress >= 100 ? COLORS.success : progress >= 60 ? COLORS.accent : COLORS.info;
  const iconName = goal.icon || 'faBullseye';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={styles.card}>
        <View style={[styles.header, isRTL && styles.rtl]}>
          <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
            <FontAwesomeIcon icon={resolveIcon(iconName)} size={20} color={color} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.name, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {goal.name}
            </Text>
            <Text style={[styles.target, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t.of} {formatCurrency(goal.targetAmount, t.currency)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.badgeTxt, { color }]}>{Math.round(progress)}%</Text>
          </View>
          {onToggleFavorite !== undefined && (
            <TouchableOpacity
              onPress={onToggleFavorite}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: isRTL ? 0 : SPACING.sm, marginRight: isRTL ? SPACING.sm : 0 }}
            >
              <FontAwesomeIcon icon={resolveIcon('faStar')} size={18} color={goal.isFavorite ? COLORS.accent : theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.progressSection}>
          <ProgressBar progress={progress} height={8} />
        </View>

        <View style={[styles.statsRow, isRTL ? styles.rtl : styles.ltr]}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t.saved}</Text>
            <Text style={[styles.statValue, { color: totalSaved < 0 ? COLORS.danger : COLORS.success }]}>
              {totalSaved < 0 ? '-' : ''}{formatCurrency(Math.abs(totalSaved), t.currency)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t.remaining}</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(remaining, t.currency)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t.daysLeft}</Text>
            <Text style={[styles.statValue, { color: daysLeft < 7 ? COLORS.danger : theme.text }]}>{daysLeft}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  rtl: { flexDirection: 'row-reverse' },
  ltr: { flexDirection: 'row' },
  iconWrap: { width: 45, height: 45, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, marginHorizontal: SPACING.sm },
  name: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  target: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  badge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeTxt: { fontSize: FONT_SIZE.sm, fontWeight: '800' },
  progressSection: { marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: FONT_SIZE.xs, marginBottom: 2 },
  statValue: { fontSize: FONT_SIZE.md, fontWeight: '700', textAlign: 'center' },
  divider: { width: 1, marginHorizontal: SPACING.xs, backgroundColor: '#243460', height: '100%' },
});