import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useGoals } from '../contexts/GoalsContext';
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme';
import GoalCard from '../components/GoalCard';

export default function GoalsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { goals } = useGoals();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, isRTL && styles.rtl]}>
        <Text style={[styles.title, { color: theme.text }]}>{t.goals}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('GoalForm')} style={[styles.addBtn, { backgroundColor: COLORS.accent }]}>
          <Text style={styles.addBtnTxt}>+ {t.addGoal}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {goals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t.noGoals}</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>{t.noGoalsDesc}</Text>
          </View>
        ) : (
          goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })} />
          ))
        )}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  rtl: { flexDirection: 'row-reverse' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  addBtn: { paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: 999 },
  addBtnTxt: { color: COLORS.primary, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  content: { paddingHorizontal: SPACING.lg },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', marginBottom: SPACING.sm },
  emptyDesc: { fontSize: FONT_SIZE.md, textAlign: 'center' },
});
