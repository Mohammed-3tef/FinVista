import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useGoals } from '../contexts/GoalsContext';
import { getTotalSaved, getProgress, formatCurrency } from '../utils/calculations';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { goals, entries } = useGoals();

  const totalSavedAll = goals.reduce((sum, g) => sum + getTotalSaved(entries, g.id), 0);
  const totalDeposits = entries.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawals = entries.filter(e => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const depositCount = entries.filter(e => e.amount > 0).length;
  const avgPerEntry = depositCount > 0 ? totalDeposits / depositCount : 0;

  const goalStats = goals.map(g => {
    const goalEntries = entries.filter(e => e.goalId === g.id);
    const depositsTotal = goalEntries.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0);
    const withdrawalsTotal = goalEntries.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);
    const saved = getTotalSaved(entries, g.id);
    return {
      goal: g,
      saved,
      depositsTotal,
      withdrawalsTotal,
      progress: getProgress(saved, g.targetAmount),
      depositCount: goalEntries.filter(e => e.amount > 0).length,
      withdrawalCount: goalEntries.filter(e => e.amount < 0).length,
    };
  }).sort((a, b) => b.progress - a.progress);

  const mostProgress = goalStats[0];

  const statCards = [
    { label: t.totalSaved, value: formatCurrency(totalSavedAll, t.currency), emoji: '💰', color: COLORS.success },
    { label: t.totalGoals, value: goals.length.toString(), emoji: '🎯', color: COLORS.info },
    { label: 'Total Deposits', value: formatCurrency(totalDeposits, t.currency), emoji: '📥', color: COLORS.success },
    { label: 'Total Withdrawals', value: formatCurrency(totalWithdrawals, t.currency), emoji: '📤', color: COLORS.danger },
    { label: 'Deposit Entries', value: depositCount.toString(), emoji: '📝', color: COLORS.accent },
    { label: 'Avg per Deposit', value: formatCurrency(avgPerEntry, t.currency), emoji: '📊', color: COLORS.warning },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t.analyticsTitle}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Stat Grid */}
        <View style={styles.grid}>
          {statCards.map((s, i) => (
            <Card key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '22' }]}>
                <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Most Progress */}
        {mostProgress && (
          <Card style={styles.highlightCard}>
            <View style={[styles.row, isRTL && styles.rtl]}>
              <View style={[styles.highlightIconWrap, { backgroundColor: COLORS.accent + '22' }]}>
                <Text style={{ fontSize: 22 }}>{mostProgress.goal.icon || '🎯'}</Text>
              </View>
              <View style={[styles.highlightText, isRTL && { marginRight: SPACING.sm, marginLeft: 0 }]}>
                <Text style={[styles.highlightLabel, { color: theme.textSecondary }]}>{t.mostProgress}</Text>
                <Text style={[styles.highlightName, { color: theme.text }]}>{mostProgress.goal.name}</Text>
              </View>
              <Text style={[styles.highlightPct, { color: COLORS.accent }]}>{Math.round(mostProgress.progress)}%</Text>
            </View>
          </Card>
        )}

        {/* Goal Breakdown */}
        {goalStats.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.goalBreakdown}</Text>
            {goalStats.map(({ goal, saved, progress, depositCount, withdrawalCount, depositsTotal, withdrawalsTotal }) => (
              <Card key={goal.id} style={styles.breakdownCard}>
                <View style={[styles.row, isRTL && styles.rtl, { marginBottom: SPACING.sm }]}>
                  <View style={[styles.breakdownIconWrap, { backgroundColor: COLORS.info + '18' }]}>
                    <Text style={{ fontSize: 16 }}>{(goal as any).icon || '🎯'}</Text>
                  </View>
                  <Text style={[styles.breakdownName, { color: theme.text }]} numberOfLines={1}>{goal.name}</Text>
                  <Text style={[styles.breakdownSaved, { color: saved >= 0 ? COLORS.success : COLORS.danger }]}>
                    {saved >= 0 ? '+' : '-'}{formatCurrency(Math.abs(saved), t.currency)}
                  </Text>
                </View>
                <ProgressBar progress={progress} height={7} />
                <View style={[styles.row, isRTL && styles.rtl, { marginTop: SPACING.sm }]}>
                  <Text style={[styles.breakdownMeta, { color: COLORS.success }]}>📥 {depositCount} (+{formatCurrency(depositsTotal, t.currency)})</Text>
                  <Text style={[styles.breakdownMeta, { color: COLORS.danger }]}>📤 {withdrawalCount} (-{formatCurrency(withdrawalsTotal, t.currency)})</Text>
                </View>
              </Card>
            ))}
          </>
        )}

        {goals.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t.noData}</Text>
          </View>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  content: { paddingHorizontal: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { width: '47.5%', alignItems: 'center', paddingVertical: SPACING.md },
  statIcon: { width: 46, height: 46, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  statLabel: { fontSize: FONT_SIZE.xs, marginTop: 2, textAlign: 'center' },
  highlightCard: { marginBottom: SPACING.md },
  highlightIconWrap: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rtl: { flexDirection: 'row-reverse' },
  highlightText: { flex: 1, marginLeft: SPACING.sm },
  highlightLabel: { fontSize: FONT_SIZE.xs },
  highlightName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  highlightPct: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800', marginBottom: SPACING.md },
  breakdownCard: { marginBottom: SPACING.sm },
  breakdownIconWrap: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.xs },
  breakdownName: { fontSize: FONT_SIZE.md, fontWeight: '700', flex: 1 },
  breakdownSaved: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  breakdownMeta: { fontSize: FONT_SIZE.xs },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
});