import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useGoals } from '../contexts/GoalsContext';
import { formatCurrency } from '../utils/calculations';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import Card from '../components/Card';
import IconButton from '../components/IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { resolveIcon } from '../constants/icons';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

// ─── helpers ─────────────────────────────────────────────────────────────────

function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

function toStartOfDay(s: string): Date {
  const d = new Date(s);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toEndOfDay(s: string): Date {
  const d = new Date(s);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RecentActivityScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const { goals, entries, reload } = useGoals();

  const { refreshProps } = usePullToRefresh(
    useCallback(async () => { await reload(); }, [reload]),
    COLORS.accent,
    theme.card,
  );

  // ── Filter state ────────────────────────────────────────────────────────
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | 'all'>('all');
  const [fromError, setFromError]   = useState('');
  const [toError, setToError]       = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Applied filter mirrors the input fields only when user taps Apply
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo]     = useState('');
  const [appliedGoalId, setAppliedGoalId] = useState<string | 'all'>('all');

  // ── Sorted entries (newest first) ───────────────────────────────────────
  const allEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries],
  );

  // ── Apply filter ────────────────────────────────────────────────────────
  const handleApply = () => {
    let hasError = false;
    if (fromDate && !isValidDateStr(fromDate)) {
      setFromError('Use format YYYY-MM-DD');
      hasError = true;
    } else {
      setFromError('');
    }
    if (toDate && !isValidDateStr(toDate)) {
      setToError('Use format YYYY-MM-DD');
      hasError = true;
    } else {
      setToError('');
    }
    if (fromDate && toDate && isValidDateStr(fromDate) && isValidDateStr(toDate)) {
      if (toStartOfDay(fromDate) > toStartOfDay(toDate)) {
        setToError(t.invalidDate);
        hasError = true;
      }
    }
    if (hasError) return;
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    setAppliedGoalId(selectedGoalId);
    setFilterOpen(false);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setFromError('');
    setToError('');
    setSelectedGoalId('all');
    setAppliedFrom('');
    setAppliedTo('');
    setAppliedGoalId('all');
    setFilterOpen(false);
  };

  // ── Filtered entries ─────────────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      const entryDate = new Date(entry.date);

      if (appliedFrom && isValidDateStr(appliedFrom)) {
        if (entryDate < toStartOfDay(appliedFrom)) return false;
      }
      if (appliedTo && isValidDateStr(appliedTo)) {
        if (entryDate > toEndOfDay(appliedTo)) return false;
      }
      if (appliedGoalId !== 'all' && entry.goalId !== appliedGoalId) return false;
      return true;
    });
  }, [allEntries, appliedFrom, appliedTo, appliedGoalId]);

  const isFiltered = appliedFrom || appliedTo || appliedGoalId !== 'all';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* ── Header ── */}
      <View style={[styles.header, isRTL && styles.rtl]}>
        <IconButton
          icon={isRTL ? 'faChevronRight' : 'faChevronLeft'}
          onPress={() => navigation.goBack()}
          color={theme.text}
          backgroundColor={theme.card}
        />
        <Text style={[styles.headerTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
          {t.allActivity}
        </Text>
        <TouchableOpacity
          onPress={() => setFilterOpen(v => !v)}
          style={[
            styles.filterBtn,
            { backgroundColor: isFiltered ? COLORS.accent + '22' : theme.card },
          ]}
        >
          <FontAwesomeIcon icon={resolveIcon('faSearch')} size={14} color={isFiltered ? COLORS.accent : theme.textSecondary}
          />
          {isFiltered && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* ── Filter panel ── */}
      {filterOpen && (
        <View style={[styles.filterPanel, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.filterTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t.filterByDate}</Text>

          {/* From / To date inputs */}
          <View style={[styles.dateRow, isRTL && styles.rtl]}>
            <View style={styles.dateField}>
              <Text style={[styles.dateLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t.fromDate}</Text>
              <View
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: fromError ? COLORS.danger : theme.cardBorder,
                  },
                ]}
              >
                <TextInput
                  style={[styles.dateInputTxt, { color: theme.text }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textMuted}
                  value={fromDate}
                  onChangeText={v => { setFromDate(v); setFromError(''); }}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>
              {!!fromError && <Text style={styles.errorTxt}>{fromError}</Text>}
            </View>

            <View style={styles.dateSep}>
              <FontAwesomeIcon icon={isRTL ? resolveIcon('faArrowLeft') : resolveIcon('faArrowRight')} size={12} color={theme.textMuted} />
            </View>

            <View style={styles.dateField}>
              <Text style={[styles.dateLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t.toDate}</Text>
              <View
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: toError ? COLORS.danger : theme.cardBorder,
                  },
                ]}
              >
                <TextInput
                  style={[styles.dateInputTxt, { color: theme.text }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textMuted}
                  value={toDate}
                  onChangeText={v => { setToDate(v); setToError(''); }}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>
              {!!toError && <Text style={styles.errorTxt}>{toError}</Text>}
            </View>
          </View>

          {/* Goal filter chips */}
          <Text style={[styles.dateLabel, { color: theme.textSecondary, marginTop: SPACING.sm, textAlign: isRTL ? 'right' : 'left' }]}>
            {t.goals}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chipsRow, isRTL && styles.rowReverse ]}
          >
            {[{ id: 'all' as const, name: t.allGoalsFilter }, ...goals].map(g => {
              const active = selectedGoalId === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setSelectedGoalId(g.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? COLORS.accent : theme.inputBg,
                      borderColor: active ? COLORS.accent : theme.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.chipTxt, { color: active ? COLORS.primary : theme.textSecondary }]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Actions */}
          <View style={[styles.filterActions, isRTL && styles.rtl]}>
            <TouchableOpacity
              onPress={handleReset}
              style={[styles.filterActionBtn, { borderColor: theme.cardBorder, backgroundColor: theme.inputBg }]}
            >
              <Text style={[styles.filterActionTxt, { color: theme.textSecondary }]}>{t.resetFilter}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              style={[styles.filterActionBtn, { backgroundColor: COLORS.accent, borderColor: COLORS.accent }]}
            >
              <Text style={[styles.filterActionTxt, { color: COLORS.primary }, styles.filterApplyTxt]}>{t.applyFilter}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Active filter summary chips ── */}
      {isFiltered && !filterOpen && (
        <View style={[styles.activeBadgesRow, isRTL && styles.rtl]}>
          {appliedFrom && (
            <View style={[styles.activeBadge, { backgroundColor: COLORS.accent + '18', borderColor: COLORS.accent + '44' }]}>
              <Text style={[styles.activeBadgeTxt, { color: COLORS.accent }]}>
                {t.fromDate}: {appliedFrom}
              </Text>
            </View>
          )}
          {appliedTo && (
            <View style={[styles.activeBadge, { backgroundColor: COLORS.accent + '18', borderColor: COLORS.accent + '44' }]}>
              <Text style={[styles.activeBadgeTxt, { color: COLORS.accent }]}>
                {t.toDate}: {appliedTo}
              </Text>
            </View>
          )}
          {appliedGoalId !== 'all' && (
            <View style={[styles.activeBadge, { backgroundColor: COLORS.info + '18', borderColor: COLORS.info + '44' }]}>
              <Text style={[styles.activeBadgeTxt, { color: COLORS.info }]}>
                {goals.find(g => g.id === appliedGoalId)?.name ?? ''}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.activeBadgeTxt, { color: COLORS.danger, marginLeft: SPACING.xs }]}>
              {t.resetFilter}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl {...refreshProps} />}
      >
        {filteredEntries.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FontAwesomeIcon icon={resolveIcon('faClock')} size={40} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {isFiltered ? t.noActivityInRange : t.noActivity}
            </Text>
          </Card>
        ) : (
          <Card noPadding>
            {filteredEntries.map((entry, idx) => {
              const goal = goals.find(g => g.id === entry.goalId);
              const isWithdrawal = entry.amount < 0;
              const entryColor = isWithdrawal ? COLORS.danger : COLORS.success;
              const entryIcon  = isWithdrawal ? 'faArrowTrendDown' : 'faArrowTrendUp';
              return (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => navigation.navigate('GoalDetail', { goalId: entry.goalId })}
                  activeOpacity={0.75}
                  style={[
                    styles.row,
                    isRTL && styles.rtl,
                    idx < filteredEntries.length - 1 && styles.rowBorder,
                    idx < filteredEntries.length - 1 && { borderBottomColor: theme.cardBorder },
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: entryColor + '22' }]}>
                    <FontAwesomeIcon icon={resolveIcon(entryIcon)} size={18} color={entryColor} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text
                      style={[styles.rowGoal, { color: theme.text }, isRTL ? styles.txtRight : styles.txtLeft]}
                      numberOfLines={1}
                    >
                      {goal?.name ?? '—'}
                    </Text>
                    <Text style={[styles.rowDate, { color: theme.textSecondary }, isRTL ? styles.txtRight : styles.txtLeft]}>
                      {new Date(entry.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.rowAmount, { color: entryColor }]}>
                    {isWithdrawal ? '-' : '+'}{formatCurrency(Math.abs(entry.amount), t.currency)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Card>
        )}

        {/* Results count */}
        {filteredEntries.length > 0 && (
          <Text style={[styles.resultCount, { color: theme.textMuted }]}>
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, paddingTop: StatusBar.currentHeight },
  rtl:         { flexDirection: 'row-reverse' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  filterBtn: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 6, right: 6,
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },

  // ── Filter panel
  filterPanel: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  filterTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  dateRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dateField: { flex: 1 },
  dateLabel: { fontSize: FONT_SIZE.xs, marginBottom: 4, fontWeight: '600' },
  dateSep:  { paddingTop: 22, alignItems: 'center' },
  dateInput: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
  },
  dateInputTxt: { fontSize: FONT_SIZE.sm },
  errorTxt: { fontSize: FONT_SIZE.xs, color: COLORS.danger, marginTop: 2 },

  chipsRow: { alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.xs },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipTxt: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  filterActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  filterActionBtn: {
    flex: 1, height: 40,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  filterActionTxt: { fontSize: FONT_SIZE.sm },

  // ── Active filter badges
  activeBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  activeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  activeBadgeTxt: { fontSize: FONT_SIZE.xs, fontWeight: '600' },

  // ── List
  listContent: { paddingHorizontal: SPACING.lg },
  emptyCard:   { alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.xl * 1.5 },
  emptyTitle:  { fontSize: FONT_SIZE.md, fontWeight: '600', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  rowInfo:   { flex: 1 },
  rowGoal:   { fontSize: FONT_SIZE.md, fontWeight: '600' },
  rowDate:   { fontSize: FONT_SIZE.xs, marginTop: 2 },
  rowAmount: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  filterApplyTxt: { fontWeight: '800' },
  rowReverse:  { flexDirection: 'row-reverse' },
  rowBorder:   { borderBottomWidth: 1 },
  txtRight:    { textAlign: 'right' as const },
  txtLeft:     { textAlign: 'left' as const },
  resultCount: {
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.md,
  },
});
