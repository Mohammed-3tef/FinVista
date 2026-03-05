import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { SPACING, RADIUS, FONT_SIZE, Colors } from '../constants/theme';
import { getTodayString } from '../utils/goalUtils';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { resolveIcon } from '../constants/icons';
import { useLanguage } from '../contexts/LanguageContext';

interface AddSavingModalProps {
  visible: boolean;
  onClose: () => void;
  goalId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidDateString = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
};

const isPositiveNumber = (s: string) =>
  s.trim() !== '' && !isNaN(Number(s)) && Number(s) > 0;

const isFutureDate = (s: string) =>
  isValidDateString(s) && new Date(s) > new Date();

// ─── Component ────────────────────────────────────────────────────────────────

export const AddSavingModal: React.FC<AddSavingModalProps> = ({ visible, onClose, goalId }) => {
  const { colors, addSaving } = useApp();
  const { t, isRTL } = useLanguage();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (field: string) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const validate = (fields = { amount, date, note }) => {
    const e: Record<string, string> = {};

    if (!fields.amount.trim())
      e.amount = t.required;
    else if (!isPositiveNumber(fields.amount))
      e.amount = t.invalidAmount;
    else if (Number(fields.amount) < 0.01)
      e.amount = 'Amount must be at least 0.01';
    else if (Number(fields.amount) > 999_999_999)
      e.amount = 'Amount is too large';

    if (!fields.date)
      e.date = t.required;
    else if (!isValidDateString(fields.date))
      e.date = 'Use format YYYY-MM-DD';
    else if (isFutureDate(fields.date))
      e.date = 'Date cannot be in the future';

    if (fields.note.length > 200)
      e.note = 'Note must be 200 characters or less';

    return e;
  };

  const handleChange = (field: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      amount: setAmount,
      date: setDate,
      note: setNote,
    };
    setters[field](value);

    if (touched[field]) {
      const updated = { amount, date, note, [field]: value };
      const newErrors = validate(updated);
      setErrors(prev => ({ ...prev, [field]: newErrors[field] || '' }));
    }
  };

  const handleAdd = () => {
    setTouched({ amount: true, date: true, note: true });
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    addSaving(goalId, Number(amount), date, note.trim() || undefined);
    reset();
    onClose();
  };

  const reset = () => {
    setAmount('');
    setDate(getTodayString());
    setNote('');
    setErrors({});
    setTouched({});
  };

  const handleClose = () => { reset(); onClose(); };

  const err = (field: string) => (touched[field] ? errors[field] : undefined);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>

            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.title, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{t.addSavings}</Text>
              <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.border }]}>
                <Text style={[styles.closeBtnText, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                  <FontAwesomeIcon icon={resolveIcon('faXmark')} size={15} color={colors.textSecondary} />
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.label, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t.amount}</Text>
              <Text style={[styles.requiredStar, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}> *</Text>
            </View>
            <TextInput
              style={[styles.input, styles.amountInput, {
                color: colors.text,
                backgroundColor: colors.surfaceSecondary,
                borderColor: err('amount') ? Colors.light.error : colors.border,
                textAlign: isRTL ? 'right' : 'left',
                borderWidth: err('amount') ? 2 : 1.5,
              }]}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              value={amount}
              onChangeText={v => handleChange('amount', v.replace(/[^0-9.]/g, ''))}
              onBlur={() => touch('amount')}
              keyboardType="numeric"
              autoFocus
              returnKeyType="next"
            />
            {err('amount') && (
              <View style={[styles.errorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.errorIcon, { textAlign: isRTL ? 'right' : 'left' }]}>
                  <FontAwesomeIcon icon={resolveIcon('faTriangleExclamation')} size={14} color={Colors.light.error} />
                </Text>
                <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{err('amount')}</Text>
              </View>
            )}

            {/* Date */}
            <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: SPACING.md }]}>
              <Text style={[styles.label, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t.date}</Text>
              <Text style={[styles.requiredStar, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}> *</Text>
            </View>
            <TextInput
              style={[styles.input, {
                color: colors.text,
                backgroundColor: colors.surfaceSecondary,
                borderColor: err('date') ? Colors.light.error : colors.border,
                textAlign: isRTL ? 'right' : 'left',
                borderWidth: err('date') ? 2 : 1.5,
              }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              value={date}
              onChangeText={v => handleChange('date', v)}
              onBlur={() => touch('date')}
              returnKeyType="next"
            />
            {err('date') && (
              <View style={[styles.errorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.errorIcon, { textAlign: isRTL ? 'right' : 'left' }]}>
                  <FontAwesomeIcon icon={resolveIcon('faTriangleExclamation')} size={14} color={Colors.light.error} />
                </Text>
                <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{err('date')}</Text>
              </View>
            )}

            {/* Note */}
            <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: SPACING.md }]}>
              <Text style={[styles.label, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t.note}</Text>
              <Text style={[styles.label, { color: colors.textTertiary, fontWeight: '400', textAlign: isRTL ? 'right' : 'left' }]}>
                {' '}({t.optional ?? 'optional'})
              </Text>
            </View>
            <TextInput
              style={[styles.input, {
                color: colors.text,
                backgroundColor: colors.surfaceSecondary,
                borderColor: err('note') ? Colors.light.error : colors.border,
                textAlign: isRTL ? 'right' : 'left',
                height: 80,
                textAlignVertical: 'top',
                paddingTop: SPACING.md,
                borderWidth: err('note') ? 2 : 1.5,
              }]}
              placeholder={t.notePlaceholder}
              placeholderTextColor={colors.textTertiary}
              value={note}
              onChangeText={v => handleChange('note', v)}
              onBlur={() => touch('note')}
              multiline
              maxLength={200}
            />
            {err('note') ? (
              <View style={[styles.errorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.errorIcon, { textAlign: isRTL ? 'right' : 'left' }]}>
                  <FontAwesomeIcon icon={resolveIcon('faTriangleExclamation')} size={14} color={Colors.light.error} />
                </Text>
                <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{err('note')}</Text>
              </View>
            ) : note.length > 150 ? (
              <Text style={[styles.charCount, { color: note.length >= 200 ? Colors.light.error : colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
                {note.length}/200
              </Text>
            ) : null}

            {/* Actions */}
            <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity onPress={handleClose} style={[styles.cancelBtn, { backgroundColor: colors.border }]}>
                <Text style={[styles.cancelText, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd} style={[styles.createBtn, { backgroundColor: Colors.primary }]}>
                <Text style={[styles.createText, { textAlign: isRTL ? 'right' : 'left' }]}>{t.save}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  keyboardView: { justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: { justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  labelRow: { alignItems: 'center', marginBottom: SPACING.xs },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  requiredStar: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: Colors.light.error },
  input: { borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZE.md },
  amountInput: { fontSize: FONT_SIZE.xxl, fontWeight: '700' },
  errorRow: { alignItems: 'center', marginTop: 5, gap: 4 },
  errorIcon: { fontSize: FONT_SIZE.xs, color: Colors.light.error },
  errorText: { color: Colors.light.error, fontSize: FONT_SIZE.xs, flex: 1 },
  charCount: { fontSize: FONT_SIZE.xs, textAlign: 'right', marginTop: 4 },
  actions: { gap: SPACING.sm, marginTop: SPACING.lg },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  cancelText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  createBtn: { flex: 2, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  createText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
});