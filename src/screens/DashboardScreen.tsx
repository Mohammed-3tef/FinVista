import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useGoals } from '../contexts/GoalsContext';
import { getTotalSaved, getProgress, formatCurrency } from '../utils/calculations';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import Card from '../components/Card';
import GoalCard from '../components/GoalCard';
import ProgressBar from '../components/ProgressBar';
import { USER_NAME_KEY } from './SettingsScreen';

export default function DashboardScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const { goals, entries } = useGoals();
  const [userName, setUserName] = useState('');

  // Re-read name every time this tab comes into focus so it's always fresh
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(USER_NAME_KEY).then(val => {
        if (val) setUserName(val);
        else setUserName('');
      });
    }, []),
  );

  const overallSaved = goals.reduce((sum, g) => sum + getTotalSaved(entries, g.id), 0);
  const overallTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = getProgress(overallSaved, overallTarget);

  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const greeting = 'Welcome back 👋';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Header */}
      <View style={[styles.header, isRTL && styles.rtl]}>
        <View style={styles.headerText}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]} numberOfLines={1}>
            {greeting}
          </Text>
          <Text style={[styles.appName, { color: theme.text }]}>{userName ? `${userName}!` : t.appName}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: COLORS.accent + '22' }]}>
          <Text style={styles.avatarEmoji}>💰</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Hero Summary Card */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: isDark ? COLORS.primary : COLORS.light.card },
          ]}>
          <View style={styles.heroBg}>
            <View style={styles.heroBubble1} />
            <View style={styles.heroBubble2} />
          </View>
          <Text
            style={[
              styles.heroLabel,
              {
                color: !isDark
                  ? COLORS.light.textSecondary
                  : COLORS.dark.textSecondary,
              },
            ]}>
            {t.totalSaved}
          </Text>
          <Text
            style={[
              styles.heroAmount,
              { color: !isDark ? COLORS.light.text : COLORS.dark.text },
            ]}>
            {formatCurrency(overallSaved, t.currency)}
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text
                style={[
                  styles.heroStatVal,
                  { color: !isDark ? COLORS.light.text : COLORS.dark.text },
                ]}>
                {goals.length}
              </Text>
              <Text
                style={[
                  styles.heroStatLabel,
                  {
                    color: !isDark
                      ? COLORS.light.textSecondary
                      : COLORS.dark.textSecondary,
                  },
                ]}>
                {t.activeGoals}
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text
                style={[
                  styles.heroStatVal,
                  { color: !isDark ? COLORS.light.text : COLORS.dark.text },
                ]}>
                {Math.round(overallProgress)}%
              </Text>
              <Text
                style={[
                  styles.heroStatLabel,
                  {
                    color: !isDark
                      ? COLORS.light.textSecondary
                      : COLORS.dark.textSecondary,
                  },
                ]}>
                {t.overallProgress}
              </Text>
            </View>
          </View>
          <View style={styles.heroProgressWrap}>
            <ProgressBar progress={overallProgress} height={6} />
          </View>
        </View>

        {/* Goals */}
        <View style={[styles.sectionHeader, isRTL && styles.rtl]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.goals}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('GoalForm')}>
            <View style={[styles.addBtn, { backgroundColor: COLORS.accent }]}>
              <Text style={styles.addBtnTxt}>+ {t.addGoal}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t.noGoals}</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              {t.noGoalsDesc}
            </Text>
          </Card>
        ) : (
          goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
            />
          ))
        )}

        {/* Recent Activity */}
        {recentEntries.length > 0 && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, marginBottom: SPACING.md },
              ]}>
              {t.recentActivity}
            </Text>
            <Card noPadding>
              {recentEntries.map((entry, idx) => {
                const goal = goals.find(g => g.id === entry.goalId);
                return (
                  <View
                    key={entry.id}
                    style={[
                      styles.activityRow,
                      isRTL && styles.rtl,
                      idx < recentEntries.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.cardBorder,
                      },
                    ]}>
                    <View
                      style={[
                        styles.activityDot,
                        { backgroundColor: COLORS.success + '22' },
                      ]}>
                      <Text style={{ fontSize: 16 }}>{goal?.icon || '🎯'}</Text>
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={[styles.activityGoal, { color: theme.text }]}>
                        {goal?.name || '—'}
                      </Text>
                      <Text style={[styles.activityDate, { color: theme.textSecondary }]}>
                        {new Date(entry.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.activityAmount, { color: entry.amount < 0 ? COLORS.danger : COLORS.success }]}>
                      {entry.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(entry.amount), t.currency)}
                    </Text>
                  </View>
                );
              })}
            </Card>
          </>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  rtl: { flexDirection: 'row-reverse' },
  headerText: { flex: 1, marginRight: SPACING.sm },
  greeting: { fontSize: FONT_SIZE.sm },
  appName: { fontSize: FONT_SIZE.xxl, fontWeight: '800', letterSpacing: -0.5 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  content: { paddingHorizontal: SPACING.lg },
  heroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBg: { ...StyleSheet.absoluteFillObject },
  heroBubble1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(240,180,41,0.08)',
    top: -30,
    right: -20,
  },
  heroBubble2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(240,180,41,0.06)',
    bottom: -20,
    left: 20,
  },
  heroLabel: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.sm, marginBottom: 4 },
  heroAmount: {
    color: '#fff',
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  heroStats: { flexDirection: 'row', marginBottom: SPACING.md },
  heroStat: { alignItems: 'center', flex: 1 },
  heroStatVal: { color: COLORS.accent, fontSize: FONT_SIZE.xl, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.xs, marginTop: 2 },
  heroStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 4,
  },
  heroProgressWrap: { marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  addBtn: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full },
  addBtnTxt: { color: COLORS.primary, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  emptyCard: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
  emptyDesc: { fontSize: FONT_SIZE.md, textAlign: 'center', lineHeight: 22 },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  activityDot: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  activityInfo: { flex: 1 },
  activityGoal: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  activityDate: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  activityAmount: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
});