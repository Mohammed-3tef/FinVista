import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Spacing, Radius, Typography, Colors } from '../constants/theme';
import { getTodayString } from '../utils/goalUtils';

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const isValidDateString = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
};

const isPositiveNumber = (s: string) =>
  s.trim() !== '' && !isNaN(Number(s)) && Number(s) > 0;

// ─── Component ────────────────────────────────────────────────────────────────

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ visible, onClose }) => {
  const { colors, t, addGoal, isRTL } = useApp();

  const today = getTodayString();
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const nextYearStr = nextYear.toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [targetDate, setTargetDate] = useState(nextYearStr);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Track which fields have been touched so errors only show after interaction
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (field: string) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const validate = (fields = { name, targetAmount, startDate, targetDate }) => {
    const e: Record<string, string> = {};

    if (!fields.name.trim())
      e.name = t.required;
    else if (fields.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters';
    else if (fields.name.trim().length > 50)
      e.name = 'Name must be 50 characters or less';

    if (!fields.targetAmount.trim())
      e.targetAmount = t.required;
    else if (!isPositiveNumber(fields.targetAmount))
      e.targetAmount = t.invalidAmount;
    else if (Number(fields.targetAmount) < 1)
      e.targetAmount = 'Amount must be at least 1';
    else if (Number(fields.targetAmount) > 999_999_999)
      e.targetAmount = 'Amount is too large';

    if (!fields.startDate)
      e.startDate = t.required;
    else if (!isValidDateString(fields.startDate))
      e.startDate = 'Use format YYYY-MM-DD';

    if (!fields.targetDate)
      e.targetDate = t.required;
    else if (!isValidDateString(fields.targetDate))
      e.targetDate = 'Use format YYYY-MM-DD';
    else if (isValidDateString(fields.startDate) && new Date(fields.targetDate) <= new Date(fields.startDate))
      e.targetDate = t.invalidDate;

    return e;
  };

  // Live-validate a single field after it's been touched
  const handleChange = (field: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      name: setName,
      targetAmount: setTargetAmount,
      startDate: setStartDate,
      targetDate: setTargetDate,
    };
    setters[field](value);

    if (touched[field]) {
      const updated = { name, targetAmount, startDate, targetDate, [field]: value };
      const newErrors = validate(updated);
      setErrors(prev => ({
        ...prev,
        [field]: newErrors[field] || '',
        // Re-check targetDate when startDate changes
        ...(field === 'startDate' ? { targetDate: newErrors.targetDate || '' } : {}),
      }));
    }
  };

  const handleCreate = () => {
    // Touch all fields so all errors show
    setTouched({ name: true, targetAmount: true, startDate: true, targetDate: true });
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    addGoal({
      name: name.trim(),
      targetAmount: Number(targetAmount),
      startDate,
      targetDate,
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setName('');
    setTargetAmount('');
    setStartDate(today);
    setTargetDate(nextYearStr);
    setErrors({});
    setTouched({});
    onClose();
  };

  const err = (field: string) => (touched[field] ? errors[field] : undefined);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.title, { color: colors.text }]}>{t.addGoal}</Text>
              <TouchableOpacity onPress={resetAndClose} style={[styles.closeBtn, { backgroundColor: colors.border }]}>
                <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Goal Name */}
              <Field label={t.goalName} error={err('name')} colors={colors} isRTL={isRTL} required>
                <TextInput
                  style={[styles.input, {
                    color: colors.text,
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: err('name') ? Colors.light.error : colors.border,
                    textAlign: isRTL ? 'right' : 'left',
                  }]}
                  placeholder={t.goalNamePlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  value={name}
                  onChangeText={v => handleChange('name', v)}
                  onBlur={() => touch('name')}
                  maxLength={50}
                  returnKeyType="next"
                />
                {!err('name') && name.trim().length > 0 && (
                  <Text style={[styles.charCount, { color: colors.textTertiary }]}>
                    {name.trim().length}/50
                  </Text>
                )}
              </Field>

              {/* Target Amount */}
              <Field label={t.targetAmount} error={err('targetAmount')} colors={colors} isRTL={isRTL} required>
                <TextInput
                  style={[styles.input, {
                    color: colors.text,
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: err('targetAmount') ? Colors.light.error : colors.border,
                    textAlign: isRTL ? 'right' : 'left',
                  }]}
                  placeholder={t.amountPlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  value={targetAmount}
                  onChangeText={v => handleChange('targetAmount', v.replace(/[^0-9.]/g, ''))}
                  onBlur={() => touch('targetAmount')}
                  keyboardType="numeric"
                  returnKeyType="next"
                />
              </Field>

              {/* Start Date */}
              <Field label={t.startDate} error={err('startDate')} colors={colors} isRTL={isRTL} required>
                <TextInput
                  style={[styles.input, {
                    color: colors.text,
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: err('startDate') ? Colors.light.error : colors.border,
                    textAlign: isRTL ? 'right' : 'left',
                  }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  value={startDate}
                  onChangeText={v => handleChange('startDate', v)}
                  onBlur={() => touch('startDate')}
                  returnKeyType="next"
                />
              </Field>

              {/* Target Date */}
              <Field label={t.targetDate} error={err('targetDate')} colors={colors} isRTL={isRTL} required>
                <TextInput
                  style={[styles.input, {
                    color: colors.text,
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: err('targetDate') ? Colors.light.error : colors.border,
                    textAlign: isRTL ? 'right' : 'left',
                  }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  value={targetDate}
                  onChangeText={v => handleChange('targetDate', v)}
                  onBlur={() => touch('targetDate')}
                  returnKeyType="done"
                />
              </Field>

            </ScrollView>

            <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity onPress={resetAndClose} style={[styles.cancelBtn, { backgroundColor: colors.border }]}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={[styles.createBtn, { backgroundColor: Colors.primary }]}>
                <Text style={styles.createText}>{t.create}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, children, error, colors, isRTL, required }: any) => (
  <View style={styles.fieldContainer}>
    <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {required && <Text style={styles.requiredStar}> *</Text>}
    </View>
    {children}
    {error ? (
      <View style={[styles.errorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={styles.errorIcon}>⚠</Text>
        <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{error}</Text>
      </View>
    ) : null}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  keyboardView: { justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '90%',
  },
  header: { justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, fontWeight: '600' },
  fieldContainer: { marginBottom: Spacing.md },
  labelRow: { alignItems: 'center', marginBottom: Spacing.xs },
  label: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },
  requiredStar: { fontSize: Typography.fontSizes.sm, fontWeight: '700', color: Colors.light.error },
  input: { borderRadius: Radius.md, borderWidth: 1.5, padding: Spacing.md, fontSize: Typography.fontSizes.md },
  errorRow: { alignItems: 'center', marginTop: 5, gap: 4 },
  errorIcon: { fontSize: 11, color: Colors.light.error },
  errorText: { color: Colors.light.error, fontSize: Typography.fontSizes.xs, flex: 1 },
  charCount: { fontSize: Typography.fontSizes.xs, textAlign: 'right', marginTop: 4 },
  actions: { gap: Spacing.sm, marginTop: Spacing.lg },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  cancelText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold },
  createBtn: { flex: 2, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  createText: { color: '#fff', fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
});