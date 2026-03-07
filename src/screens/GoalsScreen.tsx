import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar,
  TextInput, Modal, TouchableWithoutFeedback, Pressable, RefreshControl,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSearch, faSlidersH, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { CATEGORIES } from '../constants/strings';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useGoals } from '../contexts/GoalsContext';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants/theme';
import { getTotalSaved, getProgress, getDaysLeft } from '../utils/calculations';
import GoalCard from '../components/GoalCard';
import { resolveIcon } from '../constants/icons';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

type StatusFilter = 'all' | 'active' | 'completed';
type SortOption = 'nameAZ' | 'nameZA' | 'progressHigh' | 'progressLow' | 'deadline' | 'amountHigh';

export default function GoalsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { goals, entries, toggleFavorite, reload } = useGoals();

  const { refreshProps } = usePullToRefresh(
    useCallback(async () => { await reload(); }, [reload]),
    COLORS.accent,
    theme.card,
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('nameAZ');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Pending state while modal is open
  const [pendingStatus, setPendingStatus] = useState<StatusFilter>('all');
  const [pendingSort, setPendingSort] = useState<SortOption>('nameAZ');
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  const openFilter = () => {
    setPendingStatus(statusFilter);
    setPendingSort(sortOption);
    setPendingCategory(categoryFilter);
    setFilterVisible(true);
  };

  const applyFilter = () => {
    setStatusFilter(pendingStatus);
    setSortOption(pendingSort);
    setCategoryFilter(pendingCategory);
    setFilterVisible(false);
  };

  const resetFilter = () => {
    setPendingStatus('all');
    setPendingSort('nameAZ');
    setPendingCategory(null);
  };

  const isFiltered = statusFilter !== 'all' || sortOption !== 'nameAZ' || categoryFilter !== null;

  const filteredGoals = useMemo(() => {
    let result = [...goals];

    // Search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(g => g.name.toLowerCase().includes(q));
    }

    // Category filter
    if (categoryFilter !== null) {
      const cat = CATEGORIES.find(c => c.label === categoryFilter);
      if (cat) {
        result = result.filter(g => cat.icons.includes((g as any).icon ?? ''));
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(g => {
        const total = getTotalSaved(entries, g.id);
        const progress = getProgress(total, g.targetAmount);
        if (statusFilter === 'completed') return progress >= 100;
        if (statusFilter === 'active') return progress < 100;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'nameAZ': return a.name.localeCompare(b.name);
        case 'nameZA': return b.name.localeCompare(a.name);
        case 'progressHigh': {
          const pa = getProgress(getTotalSaved(entries, a.id), a.targetAmount);
          const pb = getProgress(getTotalSaved(entries, b.id), b.targetAmount);
          return pb - pa;
        }
        case 'progressLow': {
          const pa = getProgress(getTotalSaved(entries, a.id), a.targetAmount);
          const pb = getProgress(getTotalSaved(entries, b.id), b.targetAmount);
          return pa - pb;
        }
        case 'deadline': return getDaysLeft(a.deadline) - getDaysLeft(b.deadline);
        case 'amountHigh': return b.targetAmount - a.targetAmount;
        default: return 0;
      }
    });

    return result;
  }, [goals, entries, searchQuery, statusFilter, sortOption, categoryFilter]);

  const statusOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t.allGoals },
    { key: 'active', label: t.activeGoals2 },
    { key: 'completed', label: t.completedGoals2 },
  ];

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'nameAZ', label: t.sortNameAZ },
    { key: 'nameZA', label: t.sortNameZA },
    { key: 'progressHigh', label: t.sortProgressHigh },
    { key: 'progressLow', label: t.sortProgressLow },
    { key: 'deadline', label: t.sortDeadline },
    { key: 'amountHigh', label: t.sortAmountHigh },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* ── Header ── */}
      <View style={[styles.header, isRTL && styles.rtl]}>
        <Text style={[styles.title, { color: theme.text }]}>{t.goals}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('GoalForm')}
          style={[styles.addBtn, { backgroundColor: COLORS.accent }]}
        >
          <Text style={styles.addBtnTxt}>+ {t.addGoal}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search Bar + Filter Button ── */}
      <View style={[styles.searchRow, isRTL && styles.rtl]}>
        <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <FontAwesomeIcon icon={faSearch} size={14} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }, isRTL && styles.rtlText]}
            placeholder={t.searchGoals}
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            textAlign={isRTL ? 'right' : 'left'}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesomeIcon icon={faTimes} size={13} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={openFilter}
          style={[
            styles.filterBtn,
            { backgroundColor: isFiltered ? COLORS.accent : theme.card, borderColor: isFiltered ? COLORS.accent : theme.cardBorder },
          ]}
        >
          <FontAwesomeIcon icon={faSlidersH} size={16} color={isFiltered ? COLORS.primary : theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Goals List ── */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl {...refreshProps} />}
      >
        {goals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              <FontAwesomeIcon icon={resolveIcon('faBullseye')} size={64} color={theme.textMuted} />
            </Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t.noGoals}</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>{t.noGoalsDesc}</Text>
          </View>
        ) : filteredGoals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              <FontAwesomeIcon icon={resolveIcon('faSearch')} size={64} color={COLORS.accent} />
            </Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t.noResults}</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>{t.noResultsDesc}</Text>
          </View>
        ) : (
          filteredGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
              onToggleFavorite={() => toggleFavorite(goal.id)}
            />
          ))
        )}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* ── Filter Modal ── */}
      <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modalRoot}>
          {/* Dismissible backdrop */}
          <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          {/* Sheet pinned to bottom */}
          <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, isRTL && styles.rtl]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t.filterGoals}</Text>
            <TouchableOpacity onPress={() => setFilterVisible(false)}>
              <FontAwesomeIcon icon={resolveIcon('faXmark')} size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Status Filter */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t.statusFilter}</Text>
          <View style={[styles.optionRow, isRTL && styles.rtl]}>
            {statusOptions.map(opt => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setPendingStatus(opt.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: pendingStatus === opt.key ? COLORS.accent + '22' : theme.inputBg,
                    borderColor: pendingStatus === opt.key ? COLORS.accent : theme.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.chipTxt, { color: pendingStatus === opt.key ? COLORS.accent : theme.textSecondary }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category Filter */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
            style={{ marginBottom: SPACING.lg }}
          >
            <TouchableOpacity
              onPress={() => setPendingCategory(null)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: pendingCategory === null ? COLORS.accent + '22' : theme.inputBg,
                  borderColor: pendingCategory === null ? COLORS.accent : theme.cardBorder,
                },
              ]}
            >
              <Text style={[styles.categoryChipTxt, { color: pendingCategory === null ? COLORS.accent : theme.textSecondary }]}>
                All
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.label}
                onPress={() => setPendingCategory(cat.label)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: pendingCategory === cat.label ? COLORS.accent + '22' : theme.inputBg,
                    borderColor: pendingCategory === cat.label ? COLORS.accent : theme.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.categoryChipTxt, { color: pendingCategory === cat.label ? COLORS.accent : theme.textSecondary }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort By */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t.sortBy}</Text>
          <View style={styles.sortList}>
            {sortOptions.map(opt => (
              <Pressable
                key={opt.key}
                onPress={() => setPendingSort(opt.key)}
                style={({ pressed }) => [
                  styles.sortRow,
                  { borderColor: theme.cardBorder, opacity: pressed ? 0.7 : 1 },
                  isRTL && styles.rtl,
                ]}
              >
                <Text style={[styles.sortLabel, { color: pendingSort === opt.key ? COLORS.accent : theme.text }]}>
                  {opt.label}
                </Text>
                {pendingSort === opt.key && (
                  <FontAwesomeIcon icon={faCheck} size={14} color={COLORS.accent} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={[styles.modalActions, isRTL && styles.rtl]}>
            <TouchableOpacity
              onPress={resetFilter}
              style={[styles.resetBtn, { borderColor: theme.cardBorder }]}
            >
              <Text style={[styles.resetBtnTxt, { color: theme.textSecondary }]}>{t.resetFilter}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={applyFilter}
              style={[styles.applyBtn, { backgroundColor: COLORS.accent }]}
            >
              <Text style={styles.applyBtnTxt}>{t.applyFilter}</Text>
            </TouchableOpacity>
          </View>
          </View>{/* modalSheet */}
        </View>{/* modalRoot */}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
  },
  rtl: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  addBtn: { paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: 999 },
  addBtnTxt: { color: COLORS.primary, fontSize: FONT_SIZE.sm, fontWeight: '700' },

  // Search row
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm,
  },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.lg, borderWidth: 1,
    paddingHorizontal: SPACING.md, height: 44,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, paddingVertical: 0 },
  filterBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // List
  content: { paddingHorizontal: SPACING.lg },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', marginBottom: SPACING.sm },
  emptyDesc: { fontSize: FONT_SIZE.md, textAlign: 'center' },

  // Modal
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  sectionLabel: {
    fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: SPACING.sm,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1.5,
  },
  chipTxt: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  sortList: { marginBottom: SPACING.lg },
  sortRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortLabel: { fontSize: FONT_SIZE.md },
  categoryScroll: { paddingBottom: 4, gap: SPACING.xs },
  categoryChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1.5, marginRight: SPACING.xs,
  },
  categoryChipTxt: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  modalActions: {
    flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm,
  },
  resetBtn: {
    flex: 1, height: 48, borderRadius: RADIUS.lg, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  resetBtnTxt: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  applyBtn: {
    flex: 2, height: 48, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  applyBtnTxt: { color: COLORS.primary, fontSize: FONT_SIZE.md, fontWeight: '700' },
});
