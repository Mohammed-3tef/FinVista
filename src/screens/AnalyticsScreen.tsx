import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useGoals } from '../contexts/GoalsContext';
import { getTotalSaved, getProgress, formatCurrency } from '../utils/calculations';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import ExportBottomSheet, { ExportOption } from '../components/ExportBottomSheet';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faFilePdf,
  faFileExcel,
  faFileCsv,
  faChartBar,
  faCalendarDays,
} from '@fortawesome/free-solid-svg-icons';
import { resolveIcon } from '../constants/icons';
import { exportAnalyticsPDF } from '../services/reports/pdfGenerator';
import { exportAnalyticsExcel } from '../services/reports/excelGenerator';
import { exportAnalyticsCsv } from '../services/reports/csvGenerator';
import { AnalyticsReportData } from '../services/reports/types';

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { goals, entries } = useGoals();

  const [showExport, setShowExport] = useState(false);
  const [loadingExportId, setLoadingExportId] = useState<string | null>(null);

  const totalSavedAll = goals.reduce((sum, g) => sum + getTotalSaved(entries, g.id), 0);
  const totalDeposits = entries.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawals = entries.filter(e => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const depositCount = entries.filter(e => e.amount > 0).length;
  const avgPerEntry = depositCount > 0 ? totalDeposits / depositCount : 0;
  const favoriteCount = goals.filter(g => g.isFavorite).length;

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

  // ─── Export helpers ───────────────────────────────────────────────────────

  const buildReportData = useCallback((): AnalyticsReportData => ({
    generatedAt: new Date().toLocaleString('en-US'),
    totalSaved: totalSavedAll,
    totalDeposits,
    totalWithdrawals,
    depositCount,
    avgPerDeposit: avgPerEntry,
    favoriteCount,
    currency: t.currency,
    goals: goalStats.map(s => ({
      name: s.goal.name,
      targetAmount: s.goal.targetAmount,
      saved: s.saved,
      progress: s.progress,
      deadline: (s.goal as any).deadline ?? '',
      currency: t.currency,
    })),
  }), [totalSavedAll, totalDeposits, totalWithdrawals, depositCount, avgPerEntry, favoriteCount, t.currency, goalStats]);

  const runExport = useCallback(
    async (id: string, fn: (data: AnalyticsReportData) => Promise<void>) => {
      setLoadingExportId(id);
      try {
        await fn(buildReportData());
      } catch (err: any) {
        if (err?.message !== 'User did not share') {
          Alert.alert('Export Failed', err?.message ?? 'Something went wrong.');
        }
      } finally {
        setLoadingExportId(null);
        setShowExport(false);
      }
    },
    [buildReportData],
  );

  const exportOptions: ExportOption[] = [
    {
      id: 'pdf',
      label: 'Export PDF',
      subtitle: 'Full analytics report as a styled PDF',
      icon: faFilePdf,
      iconColor: COLORS.danger,
      onPress: () => runExport('pdf', exportAnalyticsPDF),
    },
    {
      id: 'excel',
      label: 'Export Excel',
      subtitle: 'Summary & goal breakdown spreadsheet (.xlsx)',
      icon: faFileExcel,
      iconColor: COLORS.success,
      onPress: () => runExport('excel', exportAnalyticsExcel),
    },
    {
      id: 'csv',
      label: 'Export CSV',
      subtitle: 'Comma-separated values for any tool',
      icon: faFileCsv,
      iconColor: COLORS.accent,
      onPress: () => runExport('csv', exportAnalyticsCsv),
    },
    {
      id: 'compare',
      label: 'Compare Months',
      subtitle: 'Side-by-side monthly savings comparison',
      icon: faChartBar,
      iconColor: COLORS.info,
      onPress: () => Alert.alert('Coming Soon', 'Monthly comparison will be available in the next update.'),
    },
    {
      id: 'daterange',
      label: 'Custom Date Range',
      subtitle: 'Export data for a specific period',
      icon: faCalendarDays,
      iconColor: COLORS.warning,
      onPress: () => Alert.alert('Coming Soon', 'Custom date range export will be available soon.'),
    },
  ];

  const statCards = [
    { label: t.totalSaved, value: formatCurrency(totalSavedAll, t.currency), icon: 'faMoneyBillWave', color: COLORS.success },
    { label: t.totalGoals, value: goals.length.toString(), icon: 'faBullseye', color: COLORS.info },
    { label: t.totalDeposits, value: formatCurrency(totalDeposits, t.currency), icon: 'faArrowDown', color: COLORS.success },
    { label: t.totalWithdrawals, value: formatCurrency(totalWithdrawals, t.currency), icon: 'faArrowUp', color: COLORS.danger },
    { label: t.depositEntries, value: depositCount.toString(), icon: 'faListCheck', color: COLORS.accent },
    { label: t.avgPerDeposit, value: formatCurrency(avgPerEntry, t.currency), icon: 'faCalculator', color: COLORS.warning },
    { label: t.favoriteGoals, value: favoriteCount.toString(), icon: 'faStar', color: COLORS.accent },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, isRTL && styles.rtlRow]}>
        <Text style={[styles.title, { color: theme.text }]}>{t.analyticsTitle}</Text>
        <TouchableOpacity
          style={[styles.exportBtn, { backgroundColor: COLORS.accent }]}
          onPress={() => setShowExport(true)} activeOpacity={0.8}
        >
          <FontAwesomeIcon icon={resolveIcon('faArrowUpFromBracket')} size={FONT_SIZE.md} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Stat Grid */}
        <View style={styles.grid}>
          {statCards.map((s, i) => (
            <Card key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '22' }]}>
                <FontAwesomeIcon icon={resolveIcon(s.icon)} size={22} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
            </Card>
          ))}

          {/* Most Progress */}
          {mostProgress && (
            <Card style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: COLORS.accent + '22' }]}>
                <Text style={[styles.highlightPct, { color: COLORS.accent }]}>{Math.round(mostProgress.progress)}%</Text>
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{mostProgress.goal.name}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t.mostProgress}</Text>
            </Card>
          )}
        </View>

        {/* Goal Breakdown */}
        {goalStats.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t.goalBreakdown}</Text>
            {goalStats.map(({ goal, saved, progress, depositCount, withdrawalCount, depositsTotal, withdrawalsTotal }) => (
              <Card key={goal.id} style={styles.breakdownCard}>
                <View style={[styles.row, isRTL ? styles.rtl : styles.ltr, { marginBottom: SPACING.sm }]}>
                  <View style={[styles.breakdownIconWrap, { backgroundColor: COLORS.info + '18' }]}>
                    <FontAwesomeIcon icon={resolveIcon((goal as any).icon || 'faBullseye')} size={16} color={COLORS.info} />
                  </View>
                  <Text style={[styles.breakdownName, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                    {goal.name}
                  </Text>
                  <Text style={[styles.breakdownSaved, { color: saved >= 0 ? COLORS.success : COLORS.danger }]}>
                    {saved >= 0 ? '+' : '-'}{formatCurrency(Math.abs(saved), t.currency)}
                  </Text>
                </View>
                <ProgressBar progress={progress} height={7} />
                <View style={[styles.row, isRTL ? styles.rtl : styles.ltr, { marginTop: SPACING.sm }]}>
                  <Text style={[styles.breakdownMeta, { color: COLORS.success }]}>
                    <FontAwesomeIcon icon={resolveIcon('faArrowDown')} size={8} color={COLORS.success} />
                    { ' ' + depositCount } (+{formatCurrency(depositsTotal, t.currency)})</Text>
                  <Text style={[styles.breakdownMeta, { color: COLORS.danger }]}>
                    <FontAwesomeIcon icon={resolveIcon('faArrowUp')} size={8} color={COLORS.danger} />
                    { ' ' + withdrawalCount } (-{formatCurrency(withdrawalsTotal, t.currency)})
                  </Text>
                </View>
              </Card>
            ))}
          </>
        )}

        {goals.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              <FontAwesomeIcon icon={resolveIcon('faFaceSadTear')} size={48} color={theme.textMuted} />
            </Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t.noData}</Text>
          </View>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      <ExportBottomSheet
        visible={showExport}
        title="Export Report"
        options={exportOptions}
        loadingId={loadingExportId}
        onClose={() => setShowExport(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  rtlRow: { flexDirection: 'row-reverse' },
  ltrRow: { flexDirection: 'row', textAlign: 'right' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  exportBtn: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
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
  ltr: { flexDirection: 'row', textAlign: 'right' },
  highlightText: { flex: 1, marginLeft: SPACING.sm },
  highlightLabel: { fontSize: FONT_SIZE.xs },
  highlightName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  highlightPct: { fontSize: FONT_SIZE.md, fontWeight: '800', padding: 8 },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800', marginBottom: SPACING.md },
  breakdownCard: { marginBottom: SPACING.sm },
  breakdownIconWrap: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginHorizontal: SPACING.xs },
  breakdownName: { fontSize: FONT_SIZE.md, fontWeight: '700', flex: 1 },
  breakdownSaved: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  breakdownMeta: { fontSize: FONT_SIZE.xs },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
});