import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { resolveIcon } from '../constants/icons';

// ─── Storage keys ─────────────────────────────────────────────────────────────
export const PROFILE_STORAGE_KEY = '@finvista_profile';

// Also keep name in the legacy key so DashboardScreen continues to work
const LEGACY_NAME_KEY = '@finvista_user_name';

export interface UserProfile {
  name: string;
  phone: string;
  avatarEmoji: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  phone: '',
  avatarEmoji: 'faUser',
};

// A small set of avatar emojis the user can choose from
export const AVATAR_OPTIONS = [
  'faUser',  'faUserAstronaut',
  'faUserTie', 'faUserSecret', 'faUserNinja', 'faUserGraduate',
  'faUserGear', 'faUserDoctor', 'faCrown', 'faRocket',
  'faStar', 'faFire', 'faBolt',
  'faGem', 'faShieldHalved', 'faMedal'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export async function loadProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.multiSet([
    [PROFILE_STORAGE_KEY, JSON.stringify(profile)],
    // Keep legacy key in sync so DashboardScreen still picks up the name
    [LEGACY_NAME_KEY, profile.name],
  ]);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { isRTL } = useLanguage();

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isSaving, setIsSaving] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  const update = useCallback(
    <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
      setProfile(prev => ({ ...prev, [key]: value }));
      setHasChanges(true);
    },
    [],
  );

  const handleSave = async () => {
    if (!profile.name.trim()) {
      Alert.alert(
        isRTL ? 'مطلوب' : 'Required',
        isRTL ? 'يرجى إدخال اسمك.' : 'Please enter your name.',
      );
      return;
    }
    setIsSaving(true);
    try {
      await saveProfile({ ...profile, name: profile.name.trim(), phone: profile.phone.trim() });
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          {isRTL ? 'الملف الشخصي' : 'Profile'}
        </Text>
        <View style={styles.spacer36} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={() => setShowEmojiPicker(v => !v)}
            style={[styles.avatar, { backgroundColor: COLORS.accent + '22', borderColor: COLORS.accent }]}>
            <FontAwesomeIcon icon={resolveIcon(profile.avatarEmoji || 'faUser')} size={44} color={COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowEmojiPicker(v => !v)} style={styles.changeAvatarBtn}>
            <FontAwesomeIcon icon={resolveIcon('faPen')} size={12} color={COLORS.accent} />
            <Text style={[styles.changeAvatarTxt, { color: COLORS.accent }]}>
              {isRTL ? 'تغيير الصورة' : 'Change Avatar'}
            </Text>
          </TouchableOpacity>

          {/* Emoji picker grid */}
          {showEmojiPicker && (
            <View style={[styles.emojiGrid, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              {AVATAR_OPTIONS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => {
                    update('avatarEmoji', emoji);
                    setShowEmojiPicker(false);
                  }}
                  style={[
                    styles.emojiCell,
                    profile.avatarEmoji === emoji && { backgroundColor: COLORS.accent + '33' },
                  ]}>
                  <FontAwesomeIcon icon={resolveIcon(emoji)} size={26} color={COLORS.accent} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Fields ── */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Name */}
          <View style={[styles.fieldRow, { borderBottomColor: theme.cardBorder }]}>
            <View style={[styles.fieldLabel, isRTL && styles.rtl]}>
              <FontAwesomeIcon icon={resolveIcon('faUser')} size={14} color={COLORS.accent} />
              <Text style={[styles.fieldLabelTxt, { color: theme.textSecondary }]}>
                {isRTL ? 'الاسم' : 'Name'}
              </Text>
            </View>
            <RNTextInput
              value={profile.name}
              onChangeText={v => update('name', v)}
              placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                { color: theme.text },
                isRTL ? styles.inputRTL : styles.inputLTR,
              ]}
              maxLength={50}
              returnKeyType="next"
            />
          </View>

          {/* Phone */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldLabel, isRTL && styles.rtl]}>
              <FontAwesomeIcon icon={resolveIcon('faMobile')} size={14} color={COLORS.accent} />
              <Text style={[styles.fieldLabelTxt, { color: theme.textSecondary }]}>
                {isRTL ? 'رقم الهاتف' : 'Phone Number'}
              </Text>
            </View>
            <RNTextInput
              value={profile.phone}
              onChangeText={v => update('phone', v)}
              placeholder={isRTL ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              style={[
                styles.input,
                { color: theme.text },
                isRTL ? styles.inputRTL : styles.inputLTR,
              ]}
              maxLength={20}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* ── Save button ── */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || !hasChanges}
          style={[
            styles.saveBtn,
            (isSaving || !hasChanges) && styles.saveBtnDisabled,
          ]}>
          <FontAwesomeIcon icon={resolveIcon('faCheck')} size={16} color={COLORS.primary} />
          <Text style={styles.saveBtnTxt}>
            {isSaving
              ? isRTL ? 'جاري الحفظ...' : 'Saving...'
              : isRTL ? 'حفظ الملف الشخصي' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight },
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
    paddingBottom: SPACING.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 44,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.accent,
  },
  changeAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  changeAvatarTxt: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    width: '100%',
  },
  emojiCell: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCellTxt: {
    fontSize: 26,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  fieldRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  rtl: {
    flexDirection: 'row-reverse',
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  fieldLabelTxt: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: FONT_SIZE.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 0,
  },
  flex1: { flex: 1 },
  spacer36: { width: 36 },
  inputLTR: { textAlign: 'left' as const },
  inputRTL: { textAlign: 'right' as const },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  saveBtnTxt: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
