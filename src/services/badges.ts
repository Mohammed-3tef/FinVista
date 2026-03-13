/**
 * Haweshly Badge / Achievement System
 *
 * Defining, storing, and checking all badge definitions in one place
 * makes it trivial to add new badges — just append to BADGE_DEFINITIONS.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';

// ─── Storage key ─────────────────────────────────────────────────────────────
export const BADGES_STORAGE_KEY = '@haweshly_badges';

// ─── Badge categories ─────────────────────────────────────────────────────────
export type BadgeCategory =
  | 'savings'
  | 'goals'
  | 'streak'
  | 'transactions'
  | 'milestones';

// ─── Badge definition (static meta-data) ─────────────────────────────────────
export interface BadgeDefinition {
  id: string;
  emoji: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  category: BadgeCategory;
}

// ─── Earned badge record (stored in AsyncStorage) ────────────────────────────
export interface EarnedBadge {
  id: string;
  earnedAt: string; // ISO date string
}

// ─── All badge definitions ────────────────────────────────────────────────────
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ── Goals ──
  {
    id: 'first_goal_created',
    emoji: 'faBullseye',
    titleEn: 'First Goal Created',
    titleAr: 'أول هدف تم إنشاؤه',
    descEn: 'You created your very first savings goal!',
    descAr: 'عملت أول هدف ادخار ليك! يلا بينا نبدأ.',
    category: 'goals',
  },
  {
    id: 'first_goal_completed',
    emoji: 'faTrophy',
    titleEn: 'First Goal Completed',
    titleAr: 'أول هدف مكتمل',
    descEn: 'You completed your first savings goal. Amazing!',
    descAr: 'خلصت أول هدف! جامد أوي!',
    category: 'goals',
  },
  {
    id: 'goals_completed_3',
    emoji: 'faMedal',
    titleEn: 'Completed 3 Goals',
    titleAr: 'أكملت 3 أهداف',
    descEn: 'Three goals down - you\'re on a roll!',
    descAr: 'خلصت 3 أهداف! ماشي حلو كده.',
    category: 'goals',
  },
  {
    id: 'goals_completed_10',
    emoji: 'faMedal',
    titleEn: 'Completed 10 Goals',
    titleAr: 'أكملت 10 أهداف',
    descEn: 'Ten goals completed! You\'re a saving machine.',
    descAr: '10 أهداف خلصتهم! انت فعلاً آلة ادخار!',
    category: 'goals',
  },
  {
    id: 'goals_completed_50',
    emoji: 'faMedal',
    titleEn: 'Completed 50 Goals',
    titleAr: 'أكملت 50 هدفاً',
    descEn: '50 goals completed - legendary dedication!',
    descAr: '50 هدف! انت بطل في الادخار بجد.',
    category: 'goals',
  },
  {
    id: 'goals_completed_100',
    emoji: 'faDiamond',
    titleEn: 'Completed 100 Goals',
    titleAr: 'أكملت 100 هدف',
    descEn: '100 goals completed. You are unstoppable!',
    descAr: '100 هدف مكتمل! محدش يقدر يوقفك!',
    category: 'goals',
  },

  // ── Savings amounts ──
  {
    id: 'saved_500',
    emoji: 'faMoneyBillWave',
    titleEn: 'Saved 500 EGP',
    titleAr: 'وفّرت 500 جنيه',
    descEn: 'You\'ve crossed the 500 EGP total savings mark.',
    descAr: 'عدّيت 500 جنيه! بداية كويسة.',
    category: 'savings',
  },
  {
    id: 'saved_1000',
    emoji: 'faMoneyBillWave',
    titleEn: 'Saved 1,000 EGP',
    titleAr: 'وفّرت 1,000 جنيه',
    descEn: 'One thousand EGP saved across all goals!',
    descAr: 'ألف جنيه متوفرة! حلو أوي.',
    category: 'savings',
  },
  {
    id: 'saved_5000',
    emoji: 'faCreditCard',
    titleEn: 'Saved 5,000 EGP',
    titleAr: 'وفّرت 5,000 جنيه',
    descEn: '5,000 EGP saved! Your future self is smiling.',
    descAr: '5,000 جنيه! مستقبلك هيشكرّك بجد.',
    category: 'savings',
  },
  {
    id: 'saved_10000',
    emoji: 'faBank',
    titleEn: 'Saved 10,000 EGP',
    titleAr: 'وفّرت 10,000 جنيه',
    descEn: '10,000 EGP - you\'re stacking some serious cash!',
    descAr: '10,000 جنيه - انت بتجمع فلوس جامدة!',
    category: 'savings',
  },
  {
    id: 'saved_50000',
    emoji: 'faBank',
    titleEn: 'Saved 50,000 EGP',
    titleAr: 'وفّرت 50,000 جنيه',
    descEn: '50,000 EGP - wow, look at you saving!',
    descAr: '50,000 جنيه - شوف انت وفّرت قد ايه!',
    category: 'savings',
  },
  {
    id: 'saved_100000',
    emoji: 'faBank',
    titleEn: 'Saved 100,000 EGP',
    titleAr: 'وفّرت 100,000 جنيه',
    descEn: '100,000 EGP - crazy! You\'re crushing it!',
    descAr: '100,000 جنيه - جامد جدا! انت كسبانها صح!',
    category: 'savings',
  },

  // ── Streaks ──
  {
    id: 'streak_3',
    emoji: 'faFire',
    titleEn: '3-Day Saving Streak',
    titleAr: 'سلسلة 3 أيام متتالية',
    descEn: 'You saved money 3 days in a row. Keep it up!',
    descAr: 'وفّرت 3 أيام ورا بعض! كمل كده.',
    category: 'streak',
  },
  {
    id: 'streak_7',
    emoji: 'faBolt',
    titleEn: '7-Day Saving Streak',
    titleAr: 'سلسلة 7 أيام متتالية',
    descEn: 'A full week of saving - incredible habit!',
    descAr: 'أسبوع كامل وفّرت! كمل كده.',
    category: 'streak',
  },
  {
    id: 'streak_30',
    emoji: 'faStar',
    titleEn: '30-Day Saving Streak',
    titleAr: 'سلسلة 30 يوماً متتالياً',
    descEn: '30 days of consistent saving. You\'re a champion!',
    descAr: '30 يوم متواصلين! انت بطل في الادخار.',
    category: 'streak',
  },
  {
    id: 'streak_60',
    emoji: 'faRocket',
    titleEn: '60-Day Saving Streak',
    titleAr: 'سلسلة 60 يوماً متتالياً',
    descEn: '60 days strong - saving is your superpower!',
    descAr: '60 يوم متواصلين - الادخار قوتك الخارقة!',
    category: 'streak',
  },
  {
    id: 'streak_90',
    emoji: 'faCrown',
    titleEn: '90-Day Saving Streak',
    titleAr: 'سلسلة 90 يوماً متتالياً',
    descEn: '90 days! You have mastered the saving habit.',
    descAr: '90 يوم! بقيت خبير في الادخار بجد.',
    category: 'streak',
  },

  // ── Transactions ──
  {
    id: 'transactions_50',
    emoji: 'faChartBar',
    titleEn: 'Added 50 Transactions',
    titleAr: 'أضفت 50 معاملة',
    descEn: '50 savings entries recorded - well tracked!',
    descAr: '50 عملية مسجلة - تتبع ممتاز!',
    category: 'transactions',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function loadEarnedBadges(): Promise<EarnedBadge[]> {
  try {
    const raw = await AsyncStorage.getItem(BADGES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EarnedBadge[]) : [];
  } catch {
    return [];
  }
}

export async function saveEarnedBadges(badges: EarnedBadge[]): Promise<void> {
  await AsyncStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(badges));
}

/** Awards a badge and fires a local notification. Returns the updated list. */
export async function awardBadge(
  badgeId: string,
  existing: EarnedBadge[],
  language: 'en' | 'ar',
): Promise<EarnedBadge[]> {
  if (existing.some(b => b.id === badgeId)) return existing; // already earned

  const def = BADGE_DEFINITIONS.find(d => d.id === badgeId);
  if (!def) return existing;

  const updated: EarnedBadge[] = [
    ...existing,
    { id: badgeId, earnedAt: new Date().toISOString() },
  ];
  await saveEarnedBadges(updated);

  // Fire a local notification
  try {
    const channelId = await notifee.createChannel({
      id: 'haweshly_achievements',
      name: 'Haweshly Achievements',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    const title =
      language === 'ar'
        ? "🎉 إنجاز جديد مكتسب!"
        : "🎉 New Achievement Unlocked!";

    const body =
      language === 'ar'
        ? `لقد حصلت على شارة "${def.titleAr}".`
        : `You earned the "${def.titleEn}" badge.`;

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        pressAction: { id: 'default' },
        sound: 'default',
        smallIcon: 'ic_launcher',
      },
      ios: { sound: 'default' },
    });
  } catch {
    // Notification failure must never break the award flow
  }

  return updated;
}

// ─── Check criteria ───────────────────────────────────────────────────────────

export interface BadgeCheckInput {
  /** All goals (completed + active) */
  totalGoals: number;
  completedGoals: number;
  /** Sum of ALL savings entries across all goals */
  totalSavedAllGoals: number;
  /** Total number of savings entries ever added */
  totalEntries: number;
  /** Sorted ISO date strings of every savings entry (oldest → newest) */
  entryDates: string[];
}

/**
 * Given current stats, returns the IDs of all badges that should now be
 * unlocked. The caller (BadgesContext) decides which are actually *new*.
 */
export function computeEligibleBadges(input: BadgeCheckInput): string[] {
  const eligible: string[] = [];

  const {
    totalGoals,
    completedGoals,
    totalSavedAllGoals,
    totalEntries,
    entryDates,
  } = input;

  // Goals
  if (totalGoals >= 1) eligible.push('first_goal_created');
  if (completedGoals >= 1) eligible.push('first_goal_completed');
  if (completedGoals >= 3) eligible.push('goals_completed_3');
  if (completedGoals >= 10) eligible.push('goals_completed_10');
  if (completedGoals >= 50) eligible.push('goals_completed_50');
  if (completedGoals >= 100) eligible.push('goals_completed_100');

  // Savings
  if (totalSavedAllGoals >= 500) eligible.push('saved_500');
  if (totalSavedAllGoals >= 1000) eligible.push('saved_1000');
  if (totalSavedAllGoals >= 5000) eligible.push('saved_5000');
  if (totalSavedAllGoals >= 10000) eligible.push('saved_10000');

  // Transactions
  if (totalEntries >= 50) eligible.push('transactions_50');

  // Streaks
  const streak = computeMaxStreak(entryDates);
  if (streak >= 3) eligible.push('streak_3');
  if (streak >= 7) eligible.push('streak_7');
  if (streak >= 30) eligible.push('streak_30');
  if (streak >= 60) eligible.push('streak_60');
  if (streak >= 90) eligible.push('streak_90');

  return eligible;
}

/**
 * Computes the longest consecutive-day saving streak from a list of
 * ISO date strings. Duplicate calendar dates count as one day.
 */
function computeMaxStreak(isoDates: string[]): number {
  if (isoDates.length === 0) return 0;

  // Deduplicate by calendar day (YYYY-MM-DD) and sort ascending
  const days = Array.from(
    new Set(isoDates.map(d => d.slice(0, 10))),
  ).sort();

  let maxStreak = 1;
  let current = 1;

  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / 86_400_000);

    if (diffDays === 1) {
      current++;
      if (current > maxStreak) maxStreak = current;
    } else {
      current = 1;
    }
  }

  return maxStreak;
}
