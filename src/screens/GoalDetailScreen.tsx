import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, TextInput as RNTextInput, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useGoals } from '../contexts/GoalsContext';
import { getTotalSaved, getProgress, getDaysLeft, getMonthlySavingsNeeded, getWeeklySavingsNeeded, getDailySavingsNeeded, formatCurrency, formatDate, generateId } from '../utils/calculations';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import Button from '../components/Button';
import ConfirmModal from '../components/ConfirmModal';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faArrowRight, faTrashCan, faPenToSquare } from '@fortawesome/free-solid-svg-icons';

export default function GoalDetailScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { goals, entries, addEntry, updateEntry, deleteEntry, deleteGoal } = useGoals();

  const goal = goals.find(g => g.id === route.params.goalId);
  if (!goal) { navigation.goBack(); return null; }

  const goalEntries = entries.filter(e => e.goalId === goal.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalSaved = getTotalSaved(entries, goal.id);
  const progress = getProgress(totalSaved, goal.targetAmount);
  const remaining = Math.max(0, goal.targetAmount - totalSaved);
  const daysLeft = getDaysLeft(goal.deadline);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [showDeleteGoal, setShowDeleteGoal] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  // Validation state for the savings modal
  const [entryErrors, setEntryErrors] = useState<{ amount?: string; date?: string }>({});
  const [entryTouched, setEntryTouched] = useState<{ amount?: boolean; date?: boolean }>({});

  const isValidDate = (s: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [y, m, d] = s.split('-').map(Number);
    if (y < 1900 || y > 2100) return false;
    if (m < 1 || m > 12) return false;
    const dt = new Date(s);
    return (
      !isNaN(dt.getTime()) &&
      dt.getFullYear() === y &&
      dt.getMonth() + 1 === m &&
      dt.getDate() === d
    );
  };

  const buildEntryErrors = (fields: { amount: string; date: string }) => {
    const e: { amount?: string; date?: string } = {};

    if (!fields.amount.trim())
      e.amount = t.required;
    else if (isNaN(Number(fields.amount)) || Number(fields.amount) === 0)
      e.amount = t.invalidAmount;
    else if (Math.abs(Number(fields.amount)) > 999_999_999)
      e.amount = 'Amount is too large';
    else {
      const newAmount = Number(fields.amount);
      // Base total excludes the entry currently being edited
      const baseTotal = editingEntry
        ? totalSaved - editingEntry.amount
        : totalSaved;
      if (baseTotal + newAmount > goal.targetAmount)
        e.amount = `Exceeds goal target (${formatCurrency(goal.targetAmount, t.currency)})`;
    }

    if (!fields.date)
      e.date = t.required;
    else if (!isValidDate(fields.date))
      e.date = fields.date.length === 10
        ? 'Invalid date (check month 1-12, day 1-31)'
        : 'Use format YYYY-MM-DD';

    return e;
  };

  const handleEntryChange = (field: 'amount' | 'date', value: string) => {
    if (field === 'amount') setAmount(value);
    else setDate(value);
    if (entryTouched[field]) {
      const updated = { amount, date, [field]: value };
      const newErrors = buildEntryErrors(updated);
      setEntryErrors(prev => ({ ...prev, [field]: newErrors[field] || '' }));
    }
  };

  const handleEntryBlur = (field: 'amount' | 'date') => {
    setEntryTouched(prev => ({ ...prev, [field]: true }));
    const newErrors = buildEntryErrors({ amount, date });
    setEntryErrors(prev => ({ ...prev, [field]: newErrors[field] || '' }));
  };

  const openAdd = () => {
    setAmount('');
    setDate(new Date().toISOString().substring(0, 10));
    setEditingEntry(null);
    setEntryErrors({});
    setEntryTouched({});
    setShowAddModal(true);
  };
  const openEdit = (entry: any) => {
    setAmount(entry.amount.toString());
    setDate(entry.date.substring(0, 10));
    setEditingEntry(entry);
    setEntryErrors({});
    setEntryTouched({});
    setShowAddModal(true);
  };

  const handleSaveEntry = () => {
    setEntryTouched({ amount: true, date: true });
    const newErrors = buildEntryErrors({ amount, date });
    setEntryErrors(newErrors);
    if (newErrors.amount || newErrors.date) return;
    if (editingEntry) {
      updateEntry(editingEntry.id, { amount: Number(amount), date: new Date(date).toISOString() });
    } else {
      addEntry({ goalId: goal.id, amount: Number(amount), date: new Date(date).toISOString() });
    }
    setShowAddModal(false);
  };

  const handleDeleteGoal = () => {
    deleteGoal(goal.id);
    navigation.goBack();
  };

  const color = progress >= 100 ? COLORS.success : progress >= 60 ? COLORS.accent : COLORS.info;
  const icon = goal.icon || '🎯';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, isRTL && styles.rtl]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
            <FontAwesomeIcon icon={isRTL ? faArrowRight : faArrowLeft} size={15} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.headerCenter, isRTL && styles.rtl]}>
          <Text style={styles.headerIcon}>{icon}</Text>
          <Text style={[styles.goalName, { color: theme.text }]} numberOfLines={1}>{goal.name}</Text>
        </View>
        <View style={[styles.headerActions, isRTL && styles.rtl]}>
          <TouchableOpacity onPress={() => navigation.navigate('GoalForm', { goalId: goal.id })} style={[styles.iconBtn, { backgroundColor: COLORS.info + '22' }]}>
            <FontAwesomeIcon icon={faPenToSquare} size={16} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDeleteGoal(true)} style={[styles.iconBtn, { backgroundColor: COLORS.danger + '22' }]}>
            <FontAwesomeIcon icon={faTrashCan} size={16} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Summary Card */}
        <Card style={[styles.summaryCard, { borderColor: color + '44' }]}>
          <View style={[styles.summaryIconRow, isRTL && styles.rtl]}>
            <View style={[styles.summaryIconWrap, { backgroundColor: color + '18' }]}>
              <Text style={styles.summaryIcon}>{icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryGoalName, { color: theme.text }]} numberOfLines={1}>{goal.name}</Text>
              <Text style={[styles.targetLabel, { color: theme.textSecondary }]}>{t.of} {formatCurrency(goal.targetAmount, t.currency)}</Text>
            </View>
            <View style={[styles.progressCircle, { borderColor: color + '44', backgroundColor: color + '11' }]}>
              <Text style={[styles.progressPct, { color }]}>{Math.round(progress)}%</Text>
            </View>
          </View>
          <Text style={[styles.savedAmount, { color: totalSaved < 0 ? COLORS.danger : color, marginBottom: SPACING.sm }]}>
            {totalSaved < 0 ? '-' : ''}{formatCurrency(Math.abs(totalSaved), t.currency)}
          </Text>
          <ProgressBar progress={progress} height={10} showLabel={false} />
          <View style={[styles.statsGrid, isRTL && styles.rtl]}>
            {[
              { label: t.remaining, value: formatCurrency(remaining, t.currency), color: theme.text },
              { label: t.daysLeft, value: daysLeft.toString(), color: daysLeft < 7 ? COLORS.danger : theme.text },
            ].map((s, i) => (
              <View key={i} style={styles.gridItem}>
                <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>{s.label}</Text>
                <Text style={[styles.gridValue, { color: s.color }]}>{s.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Savings Needed */}
        {remaining > 0 && daysLeft > 0 && (
          <Card style={styles.neededCard}>
            <Text style={[styles.neededTitle, { color: theme.text }]}>📊 Savings Needed</Text>
            <View style={[styles.neededGrid, isRTL && styles.rtl]}>
              {[
                { label: t.dailySavings, value: getDailySavingsNeeded(remaining, goal.deadline) },
                { label: t.weeklySavings, value: getWeeklySavingsNeeded(remaining, goal.deadline) },
                { label: t.monthlySavings, value: getMonthlySavingsNeeded(remaining, goal.deadline) },
              ].map((item, i) => (
                <View key={i} style={[styles.neededItem, { backgroundColor: theme.inputBg }]}>
                  <Text style={[styles.neededValue, { color: COLORS.accent }]}>{formatCurrency(item.value, t.currency)}</Text>
                  <Text style={[styles.neededLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Savings History */}
        <View style={[styles.sectionHeader, isRTL && styles.rtl]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.savingsHistory}</Text>
          <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: COLORS.accent }]}>
            <Text style={styles.addBtnTxt}>+ {t.addSavings}</Text>
          </TouchableOpacity>
        </View>

        {goalEntries.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>💳</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t.noSavings}</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>{t.addFirstSaving}</Text>
          </Card>
        ) : (
          <Card noPadding>
            {goalEntries.map((entry, idx) => {
              const isWithdrawal = entry.amount < 0;
              const entryColor = isWithdrawal ? COLORS.danger : COLORS.success;
              const entryEmoji = isWithdrawal ? '📤' : '💵';
              return (
                <View key={entry.id} style={[styles.entryRow, isRTL && styles.rtl, idx < goalEntries.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder }]}>
                  <View style={[styles.entryDot, { backgroundColor: entryColor + '22' }]}>
                    <Text style={{ fontSize: 14 }}>{entryEmoji}</Text>
                  </View>
                  <View style={styles.entryInfo}>
                    <Text style={[styles.entryAmount, { color: entryColor }]}>
                      {isWithdrawal ? '-' : '+'}{formatCurrency(Math.abs(entry.amount), t.currency)}
                    </Text>
                    <Text style={[styles.entryDate, { color: theme.textSecondary }]}>{formatDate(entry.date)}</Text>
                  </View>
                  <View style={[styles.entryActions, isRTL && styles.rtl]}>
                    <TouchableOpacity onPress={() => openEdit(entry)} style={[styles.entryBtn, { backgroundColor: COLORS.info + '22' }]}>
                      <FontAwesomeIcon icon={faPenToSquare} size={12} color={theme.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDeleteEntryId(entry.id)} style={[styles.entryBtn, { backgroundColor: COLORS.danger + '22' }]}>
                      <FontAwesomeIcon icon={faTrashCan} size={12} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Add/Edit Entry Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOuter} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.bottomSheet, { backgroundColor: theme.card }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{editingEntry ? t.edit : t.addSavings}</Text>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t.amount}</Text>
                <Text style={styles.requiredStar}> *</Text>
              </View>
              <View style={[styles.inputRow, {
                backgroundColor: theme.inputBg,
                borderColor: entryErrors.amount && entryTouched.amount ? COLORS.danger : theme.cardBorder,
                borderWidth: entryErrors.amount && entryTouched.amount ? 2 : 1.5,
              }]}>
                <Text style={[styles.inputPrefix, { color: COLORS.accent }]}>{t.currency}</Text>
                <RNTextInput
                  style={[styles.sheetInput, { color: theme.text }]}
                  value={amount}
                  onChangeText={v => handleEntryChange('amount', v.replace(/[^0-9.\-]/g, ''))}
                  onBlur={() => handleEntryBlur('amount')}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={theme.textMuted}
                  textAlign={isRTL ? 'right' : 'left'}
                  autoFocus
                />
              </View>
              {entryErrors.amount && entryTouched.amount && (
                <View style={[styles.errorRow, isRTL && styles.rtl]}>
                  <Text style={styles.errorIcon}>⚠</Text>
                  <Text style={styles.errorText}>{entryErrors.amount}</Text>
                </View>
              )}
              {!entryErrors.amount && (
                <Text style={[styles.inputHint, { color: theme.textMuted }]}>Use a negative value to record a withdrawal</Text>
              )}
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t.date}</Text>
                <Text style={styles.requiredStar}> *</Text>
              </View>
              <View style={[styles.inputRow, {
                backgroundColor: theme.inputBg,
                borderColor: entryErrors.date && entryTouched.date ? COLORS.danger : theme.cardBorder,
                borderWidth: entryErrors.date && entryTouched.date ? 2 : 1.5,
              }]}>
                <RNTextInput
                  style={[styles.sheetInput, { color: theme.text }]}
                  value={date}
                  onChangeText={v => handleEntryChange('date', v)}
                  onBlur={() => handleEntryBlur('date')}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textMuted}
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>
              {entryErrors.date && entryTouched.date ? (
                <View style={[styles.errorRow, isRTL && styles.rtl]}>
                  <Text style={styles.errorIcon}>⚠</Text>
                  <Text style={styles.errorText}>{entryErrors.date}</Text>
                </View>
              ) : (
                <Text style={[styles.inputHint, { color: theme.textMuted }]}>Format: YYYY-MM-DD</Text>
              )}
            </View>

            <View style={[styles.sheetActions, isRTL && styles.rtl]}>
              <Button label={t.cancel} onPress={() => setShowAddModal(false)} variant="outline" style={{ flex: 1 }} />
              <Button label={t.save} onPress={handleSaveEntry} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={showDeleteGoal}
        title={t.confirmDelete}
        message={t.confirmDeleteMsg}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onConfirm={handleDeleteGoal}
        onCancel={() => setShowDeleteGoal(false)}
      />
      <ConfirmModal
        visible={!!deleteEntryId}
        title={t.confirmDelete}
        message={t.confirmDeleteEntry}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onConfirm={() => { deleteEntry(deleteEntryId!); setDeleteEntryId(null); }}
        onCancel={() => setDeleteEntryId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  rtl: { flexDirection: 'row-reverse' },
  backBtn: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  headerIcon: { fontSize: 20 },
  goalName: { flex: 1, fontSize: FONT_SIZE.xl, fontWeight: '800', marginHorizontal: SPACING.xs },
  headerActions: { flexDirection: 'row', gap: SPACING.sm },
  iconBtn: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: SPACING.lg },
  summaryCard: { marginBottom: SPACING.md },
  summaryIconRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  summaryIconWrap: { width: 52, height: 52, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  summaryIcon: { fontSize: 28 },
  summaryGoalName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  savedAmount: { fontSize: FONT_SIZE.xxxl, fontWeight: '800' },
  targetLabel: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  progressCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  progressPct: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', marginTop: SPACING.md, gap: SPACING.md },
  gridItem: { flex: 1, alignItems: 'center' },
  gridLabel: { fontSize: FONT_SIZE.xs, marginBottom: 2 },
  gridValue: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  neededCard: { marginBottom: SPACING.md },
  neededTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: SPACING.md },
  neededGrid: { flexDirection: 'row', gap: SPACING.sm },
  neededItem: { flex: 1, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  neededValue: { fontSize: FONT_SIZE.md, fontWeight: '800', textAlign: 'center' },
  neededLabel: { fontSize: FONT_SIZE.xs, marginTop: 2, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, marginTop: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  addBtn: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full },
  addBtnTxt: { color: COLORS.primary, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  emptyCard: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.xs },
  emptyDesc: { fontSize: FONT_SIZE.md, textAlign: 'center' },
  entryRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  entryDot: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  entryInfo: { flex: 1 },
  entryAmount: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  entryDate: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  entryActions: { flexDirection: 'row', gap: SPACING.xs },
  entryBtn: { width: 30, height: 30, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  modalOuter: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  bottomSheet: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xl },
  sheetTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', marginBottom: SPACING.lg },
  inputGroup: { marginBottom: SPACING.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  inputLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  requiredStar: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.danger },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1.5, paddingHorizontal: SPACING.md },
  inputPrefix: { fontSize: FONT_SIZE.md, fontWeight: '700', marginRight: 4 },
  sheetInput: { flex: 1, fontSize: FONT_SIZE.md, paddingVertical: SPACING.sm + 4 },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 },
  errorIcon: { fontSize: 11, color: COLORS.danger },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZE.xs, flex: 1 },
  inputHint: { fontSize: FONT_SIZE.xs, marginTop: 4 },
  sheetActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
});