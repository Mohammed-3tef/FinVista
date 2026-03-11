import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBadges } from '../contexts/BadgesContext';
import { BADGE_DEFINITIONS, BadgeCategory } from '../services/badges';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { resolveIcon } from '../constants/icons';

// ─── Category metadata ────────────────────────────────────────────────────────
const CATEGORY_META: Record<
  BadgeCategory,
  { labelEn: string; labelAr: string; icon: string }
> = {
  goals: { labelEn: 'Goals', labelAr: 'الأهداف', icon: 'faBullseye' },
  savings: { labelEn: 'Savings', labelAr: 'المدخرات', icon: 'faPiggyBank' },
  streak: { labelEn: 'Streaks', labelAr: 'الاستمرارية', icon: 'faFire' },
  transactions: { labelEn: 'Transactions', labelAr: 'المعاملات', icon: 'faReceipt' },
  milestones: { labelEn: 'Milestones', labelAr: 'الإنجازات', icon: 'faStar' },
};

const CATEGORIES: BadgeCategory[] = ['goals', 'savings', 'streak', 'transactions'];

// ─── Badge card ───────────────────────────────────────────────────────────────
function BadgeCard({
  emoji,
  titleEn,
  titleAr,
  descEn,
  descAr,
  earned,
  earnedAt,
  isNew,
  theme,
  isRTL,
}: {
  badgeId?: string;
  emoji: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  earned: boolean;
  earnedAt?: string;
  isNew: boolean;
  theme: any;
  isRTL: boolean;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isNew) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      { iterations: 5 },
    ).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  const shimmerStyle = {
    opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }),
  };

  const formattedDate = earnedAt
    ? new Date(earnedAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Animated.View
      style={[
        styles.badgeCard,
        {
          backgroundColor: earned
            ? theme.card
            : theme.card + 'aa',
          borderColor: earned
            ? isNew
              ? COLORS.accent
              : theme.cardBorder
            : theme.cardBorder + '66',
        },
        isNew && shimmerStyle,
      ]}>
      {/* Emoji */}
      <View
        style={[
          styles.badgeEmoji,
          {
            backgroundColor: earned
              ? COLORS.accent + '22'
              : theme.cardBorder + '55',
          },
        ]}>
        <Text style={[styles.badgeEmojiTxt, !earned && styles.lockedEmoji]}>
          {earned ? <FontAwesomeIcon icon={resolveIcon(emoji)} size={24} color={COLORS.accent} /> : <FontAwesomeIcon icon={resolveIcon('faLock')} size={16} color={theme.textMuted} />}
        </Text>
      </View>

      {/* Text */}
      <View style={[styles.badgeText, isRTL && styles.badgeTextRTL]}>
        <Text
          style={[
            styles.badgeTitle,
            { color: earned ? theme.text : theme.textMuted },
          ]}>
          {isRTL ? titleAr : titleEn}
        </Text>
        <Text style={[styles.badgeDesc, { color: theme.textSecondary }]}>
          {isRTL ? descAr : descEn}
        </Text>
        {earned && formattedDate && (
          <View style={[styles.earnedRow, isRTL && styles.earnedRowRTL]}>
            <FontAwesomeIcon icon={resolveIcon('faTrophy')} size={10} color={COLORS.accent} />
            <Text style={[styles.earnedDate, { color: COLORS.accent }]}>
              {isRTL ? `تم الفوز ${formattedDate}` : `Earned ${formattedDate}`}
            </Text>
          </View>
        )}
      </View>

      {/* NEW badge */}
      {isNew && (
        <View style={styles.newBadgePill}>
          <Text style={styles.newBadgeTxt}>{isRTL ? 'جديد!' : 'NEW!'}</Text>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AchievementsScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { isRTL } = useLanguage();
  const { earnedBadges, earnedIds, newlyUnlocked, clearNewlyUnlocked } = useBadges();

  // Clear "new" flags after a brief viewing period
  useEffect(() => {
    if (newlyUnlocked.length === 0) return;
    const t = setTimeout(clearNewlyUnlocked, 6000);
    return () => clearTimeout(t);
  }, [newlyUnlocked, clearNewlyUnlocked]);

  const totalBadges = BADGE_DEFINITIONS.length;
  const earnedCount = earnedBadges.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesomeIcon
            icon={resolveIcon(isRTL ? 'faChevronRight' : 'faChevronLeft')}
            size={18}
            color={COLORS.accent}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isRTL ? 'الإنجازات' : 'Achievements'}
        </Text>
        <View style={styles.spacer36} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Progress banner */}
        <View
          style={[
            styles.progressBanner, 
            { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: isDark ? COLORS.primary : theme.card, borderColor: COLORS.accent + '44' },
          ]}>
          <Text style={styles.progressEmoji}>
            <FontAwesomeIcon icon={resolveIcon('faTrophy')} size={28} color={COLORS.accent} />
          </Text>
          <View>
            <Text style={[styles.progressTitle, { textAlign: isRTL ? 'right' : 'left', color: theme.text }]}>
              {isRTL ? 'إنجازاتك' : 'Your Achievements'}
            </Text>
            <Text style={[styles.progressSub, { textAlign: isRTL ? 'right' : 'left', color: theme.textSecondary }]}>
              {isRTL
                ? `${earnedCount} من ${totalBadges} شارة مكتسبة`
                : `${earnedCount} / ${totalBadges} badges earned`}
            </Text>
          </View>
          <View style={[styles.progressPill, isRTL && { marginLeft: 0, marginRight: 'auto' }]}>
            <Text style={styles.progressPct}>
              {Math.round((earnedCount / totalBadges) * 100)}%
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressBarBg, { backgroundColor: theme.cardBorder }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(earnedCount / totalBadges) * 100}%` },
            ]}
          />
        </View>

        {/* Newly unlocked banner */}
        {newlyUnlocked.length > 0 && (
          <View style={[styles.newBanner, { backgroundColor: COLORS.accent + '22', borderColor: COLORS.accent }]}>
            <Text style={styles.newBannerEmoji}>🎉</Text>
            <Text style={[styles.newBannerTxt, { color: theme.text }]}>
              {isRTL
                ? `تهانيك! فتحت ${newlyUnlocked.length} شارة جديدة!`
                : `Congrats! You unlocked ${newlyUnlocked.length} new badge${newlyUnlocked.length > 1 ? 's' : ''}!`}
            </Text>
          </View>
        )}

        {/* Categories */}
        {CATEGORIES.map(cat => {
          const meta = CATEGORY_META[cat];
          const defs = BADGE_DEFINITIONS.filter(d => d.category === cat);

          return (
            <View key={cat} style={styles.section}>
              {/* Section header */}
              <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
                <FontAwesomeIcon
                  icon={resolveIcon(meta.icon)}
                  size={14}
                  color={COLORS.accent}
                />
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                  {(isRTL ? meta.labelAr : meta.labelEn).toUpperCase()}
                </Text>
              </View>

              {defs.map(def => {
                const earned = earnedIds.has(def.id);
                const earnedBadge = earnedBadges.find(b => b.id === def.id);
                const isNew = newlyUnlocked.includes(def.id);
                return (
                  <BadgeCard
                    key={def.id}
                    badgeId={def.id}
                    emoji={def.emoji}
                    titleEn={def.titleEn}
                    titleAr={def.titleAr}
                    descEn={def.descEn}
                    descAr={def.descAr}
                    earned={earned}
                    earnedAt={earnedBadge?.earnedAt}
                    isNew={isNew}
                    theme={theme}
                    isRTL={isRTL}
                  />
                );
              })}
            </View>
          );
        })}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  content: {
    padding: SPACING.md,
  },
  progressBanner: {
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  progressEmoji: {
    fontSize: 36,
    margin: SPACING.sm,
  },
  progressTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  progressSub: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  progressPill: {
    marginLeft: 'auto',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  progressPct: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: FONT_SIZE.md,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  newBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  newBannerEmoji: {
    fontSize: 22,
  },
  newBannerTxt: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  spacer36: { width: 36 },
  badgeTextRTL: { alignItems: 'flex-end' as const },
  earnedRowRTL: { flexDirection: 'row-reverse' as const },
  sectionHeaderRTL: { flexDirection: 'row-reverse' as const },
  // ── Badge card ──
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  badgeEmoji: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeEmojiTxt: {
    fontSize: 26,
  },
  lockedEmoji: {
    opacity: 0.5,
  },
  badgeText: {
    flex: 1,
    gap: 3,
  },
  badgeTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  badgeDesc: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 18,
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  earnedDate: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  newBadgePill: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    flexShrink: 0,
  },
  newBadgeTxt: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
});
