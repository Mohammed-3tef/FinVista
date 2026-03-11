import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useGoals } from '../contexts/GoalsContext';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import IconPicker from '../components/IconPicker';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { resolveIcon } from '../constants/icons';

interface Props {
  navigation: any;
  route: any;
}

export default function GoalFormScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { goals, addGoal, updateGoal } = useGoals();

  const editGoal = route.params?.goalId ? goals.find(g => g.id === route.params.goalId) : null;

  const [name, setName] = useState(editGoal?.name || '');
  const [target, setTarget] = useState(editGoal?.targetAmount?.toString() || '');
  const [startDate, setStartDate] = useState(editGoal?.startDate ? editGoal.startDate.substring(0, 10) : new Date().toISOString().substring(0, 10));
  const [deadline, setDeadline] = useState(editGoal?.deadline ? editGoal.deadline.substring(0, 10) : '');
  const [icon, setIcon] = useState(editGoal?.icon || 'faBullseye');
  const [notes, setNotes] = useState(editGoal?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isValidDate = (s: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [y, m, d] = s.split('-').map(Number);
    if (y < 1900 || y > 2100) return false;
    if (m < 1 || m > 12) return false;
    // Verify no roll-over (e.g. Feb 30, Apr 31)
    const dt = new Date(s);
    return (
      !isNaN(dt.getTime()) &&
      dt.getFullYear() === y &&
      dt.getMonth() + 1 === m &&
      dt.getDate() === d
    );
  };

  const buildErrors = (fields: { name: string; target: string; startDate: string; deadline: string }) => {
    const e: Record<string, string> = {};

    if (!fields.name.trim())
      e.name = t.required;
    else if (fields.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters';
    else if (fields.name.trim().length > 50)
      e.name = 'Name must be 50 characters or less';

    if (!fields.target.trim())
      e.target = t.required;
    else if (isNaN(Number(fields.target)) || Number(fields.target) <= 0)
      e.target = t.invalidAmount;
    else if (Number(fields.target) > 999_999_999)
      e.target = 'Amount is too large';

    if (!fields.startDate)
      e.startDate = t.required;
    else if (!isValidDate(fields.startDate))
      e.startDate = fields.startDate.length === 10
        ? 'Invalid date (check month 1-12, day 1-31)'
        : 'Use format YYYY-MM-DD';

    if (!fields.deadline)
      e.deadline = t.required;
    else if (!isValidDate(fields.deadline))
      e.deadline = fields.deadline.length === 10
        ? 'Invalid date (check month 1-12, day 1-31)'
        : 'Use format YYYY-MM-DD';
    else if (isValidDate(fields.startDate) && new Date(fields.deadline) <= new Date(fields.startDate))
      e.deadline = t.deadlineAfterStart;

    return e;
  };

  const handleChange = (field: 'name' | 'target' | 'startDate' | 'deadline', value: string) => {
    const setters = { name: setName, target: setTarget, startDate: setStartDate, deadline: setDeadline };
    setters[field](value);
    if (touched[field]) {
      const updated = { name, target, startDate, deadline, [field]: value };
      const newErrors = buildErrors(updated);
      setErrors(prev => ({
        ...prev,
        [field]: newErrors[field] || '',
        ...(field === 'startDate' ? { deadline: newErrors.deadline || '' } : {}),
      }));
    }
  };

  const handleBlur = (field: 'name' | 'target' | 'startDate' | 'deadline') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const newErrors = buildErrors({ name, target, startDate, deadline });
    setErrors(prev => ({ ...prev, [field]: newErrors[field] || '' }));
  };

  const handleSave = () => {
    setTouched({ name: true, target: true, startDate: true, deadline: true });
    const newErrors = buildErrors({ name, target, startDate, deadline });
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    const data = {
      name: name.trim(),
      targetAmount: Number(target),
      startDate: new Date(startDate).toISOString(),
      deadline: new Date(deadline).toISOString(),
      icon,
      notes: notes.trim() || undefined,
    };
    if (editGoal) {
      updateGoal(editGoal.id, data);
    } else {
      addGoal(data);
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>

        {/* Header */}
        <View style={[styles.header, isRTL && styles.rtl]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
            <FontAwesomeIcon icon={isRTL ? resolveIcon('faArrowRight') : resolveIcon('faArrowLeft')} size={15} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{editGoal ? t.editGoal : t.addGoal}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>

          {/* Icon preview banner */}
          <View style={[styles.iconBanner, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: COLORS.accent + '15' }]}>
            <View style={styles.iconBannerPreview}>
              <FontAwesomeIcon icon={resolveIcon(icon)} size={40} color={COLORS.accent} />
            </View>
            <Text style={[styles.iconBannerName, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {name || 'New Goal'}
            </Text>
          </View>

          <IconPicker
            label={t.goalIcon}
            value={icon}
            onChange={setIcon}
          />

          <TextInput
            label={t.goalName}
            value={name}
            onChangeText={v => handleChange('name', v.replace(/[^\s\S]/g, ''))}
            onBlur={() => handleBlur('name')}
            placeholder="e.g. New Car, Vacation..."
            error={errors.name}
            hint={!errors.name && name.trim().length > 0 ? `${name.trim().length}/50` : undefined}
            maxLength={50}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TextInput
            label={t.targetAmount}
            value={target}
            onChangeText={v => handleChange('target', v.replace(/[^0-9.]/g, ''))}
            onBlur={() => handleBlur('target')}
            keyboardType="numeric"
            placeholder="0.00"
            prefix={t.currency}
            error={errors.target}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TextInput
            label={t.startDate}
            value={startDate}
            onChangeText={v => handleChange('startDate', v)}
            onBlur={() => handleBlur('startDate')}
            placeholder="YYYY-MM-DD"
            error={errors.startDate}
            hint={!errors.startDate ? 'Format: YYYY-MM-DD' : undefined}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TextInput
            label={t.deadline}
            value={deadline}
            onChangeText={v => handleChange('deadline', v)}
            onBlur={() => handleBlur('deadline')}
            placeholder="YYYY-MM-DD"
            error={errors.deadline}
            hint={!errors.deadline ? 'Format: YYYY-MM-DD' : undefined}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TextInput
            label={t.goalNotes}
            value={notes}
            onChangeText={v => setNotes(v.length <= 500 ? v : notes)}
            placeholder={t.goalNotesPlaceholder}
            multiline
            numberOfLines={4}
            maxLength={500}
            hint={notes.length > 0 ? `${notes.length}/500` : undefined}
            textAlign={isRTL ? 'right' : 'left'}
          />

          <Button label={t.save} onPress={handleSave} style={{ marginTop: SPACING.md }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  rtl: { flexDirection: 'row-reverse' },
  backBtn: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20 },
  title: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  form: { padding: SPACING.lg },
  iconBanner: {
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  iconBannerPreview: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBannerName: { flex: 1, fontSize: FONT_SIZE.xl, fontWeight: '800' },
});