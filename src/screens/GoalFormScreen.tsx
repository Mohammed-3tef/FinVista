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
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

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
  const [icon, setIcon] = useState(editGoal?.icon || '🎯');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t.required;
    if (!target || isNaN(Number(target)) || Number(target) <= 0) e.target = t.invalidAmount;
    if (!startDate) e.startDate = t.invalidDate;
    if (!deadline) e.deadline = t.invalidDate;
    if (startDate && deadline && new Date(deadline) <= new Date(startDate)) e.deadline = t.deadlineAfterStart;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = {
      name: name.trim(),
      targetAmount: Number(target),
      startDate: new Date(startDate).toISOString(),
      deadline: new Date(deadline).toISOString(),
      icon,
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
            <FontAwesomeIcon icon={isRTL ? faArrowRight : faArrowLeft} size={15} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{editGoal ? t.editGoal : t.addGoal}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>

          {/* Icon preview banner */}
          <View style={[styles.iconBanner, { backgroundColor: COLORS.accent + '15' }]}>
            <Text style={styles.iconBannerEmoji}>{icon}</Text>
            <Text style={[styles.iconBannerName, { color: theme.text }]} numberOfLines={1}>
              {name || 'New Goal'}
            </Text>
          </View>

          <IconPicker
            label="Goal Icon"
            value={icon}
            onChange={setIcon}
            isRTL={isRTL}
          />

          <TextInput
            label={t.goalName}
            value={name}
            onChangeText={setName}
            placeholder="e.g. New Car, Vacation..."
            error={errors.name}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TextInput
            label={t.targetAmount}
            value={target}
            onChangeText={setTarget}
            keyboardType="numeric"
            placeholder="0.00"
            prefix={t.currency}
            error={errors.target}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TextInput
            label={t.startDate}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            error={errors.startDate}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TextInput
            label={t.deadline}
            value={deadline}
            onChangeText={setDeadline}
            placeholder="YYYY-MM-DD"
            error={errors.deadline}
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  iconBannerEmoji: { fontSize: 48 },
  iconBannerName: { flex: 1, fontSize: FONT_SIZE.xl, fontWeight: '800' },
});