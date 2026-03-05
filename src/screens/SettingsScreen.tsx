import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput as RNTextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Linking,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSms } from '../contexts/SmsContext';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { ALLOCATION_PRIORITY_OPTIONS, POLL_INTERVAL_OPTIONS } from '../constants/types';
import {
  getReminderSettings,
  saveReminderSettings,
  scheduleReminder,
  cancelReminder,
  ReminderSettings,
  getMotivationalMessage,
} from '../services/notifications';
import Card from '../components/Card';
import UserNameModal from '../components/UserNameModal';
import {strings} from '../constants/strings';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { resolveIcon } from '../constants/icons';

export const USER_NAME_KEY = '@finvista_user_name';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, language, isRTL, setLanguage } = useLanguage();
  const {
    keywords,
    addKeyword,
    updateKeyword,
    deleteKeyword,
    resetKeywords,
    priority,
    setPriority,
    pollInterval,
    setPollInterval,
    transactions,
    clearHistory,
    blockList,
    removeFromBlockList,
    hasPermission,
    requestPermission,
    scanInbox,
    isScanning,
    lastCheckedAt,
  } = useSms();

  const [reminders, setReminders] = useState<ReminderSettings>({
    enabled: true,
    frequency: 'daily',
  });
  const [notifPermission, setNotifPermission] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [userName, setUserName] = useState('');
  const [nameModalVisible, setNameModalVisible] = useState(false);

  // Keyword editor state
  const [newDepositKw, setNewDepositKw] = useState('');
  const [newWithdrawalKw, setNewWithdrawalKw] = useState('');
  const [editingKw, setEditingKw] = useState<{
    kind: 'deposit' | 'withdrawal';
    oldWord: string;
    newWord: string;
  } | null>(null);

  // Modal visibility
  const [pollModalVisible, setPollModalVisible] = useState(false);
  const [kwModalKind, setKwModalKind] = useState<'deposit' | 'withdrawal' | null>(null);

  useEffect(() => {
    getReminderSettings().then(s => {
      setReminders(s);
      // Reschedule on mount in case a previous trigger expired (e.g. monthly)
      notifee.getNotificationSettings().then(ns => {
        const granted = ns.authorizationStatus >= 1;
        setNotifPermission(granted);
        if (granted && s.enabled) scheduleReminder(s, language);
      });
    });
    AsyncStorage.getItem(USER_NAME_KEY).then(val => {
      if (val) setUserName(val);
    });
    // Check current notification permission state
    notifee.getNotificationSettings().then(s => {
      setNotifPermission(s.authorizationStatus >= 1);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveName = async (name: string) => {
    setUserName(name);
    await AsyncStorage.setItem(USER_NAME_KEY, name);
    setNameModalVisible(false);
  };

  // ── Keyword helpers ────────────────────────────────────────────────────────
  const handleAddKeyword = async (kind: 'deposit' | 'withdrawal') => {
    const word = kind === 'deposit' ? newDepositKw.trim() : newWithdrawalKw.trim();
    if (!word) return;
    await addKeyword(kind, word);
    if (kind === 'deposit') setNewDepositKw('');
    else setNewWithdrawalKw('');
  };

  const handleEditKeyword = (kind: 'deposit' | 'withdrawal', oldWord: string) => {
    setEditingKw({ kind, oldWord, newWord: oldWord });
  };

  const handleSaveEdit = async () => {
    if (!editingKw) return;
    await updateKeyword(editingKw.kind, editingKw.oldWord, editingKw.newWord);
    setEditingKw(null);
  };

  const handleDeleteKeyword = (kind: 'deposit' | 'withdrawal', word: string) => {
    Alert.alert(
      'Delete Keyword',
      `Remove "${word}" from ${kind} keywords?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteKeyword(kind, word) },
      ],
    );
  };

  const handleResetKeywords = (kind: 'deposit' | 'withdrawal') => {
    Alert.alert(
      'Reset Keywords',
      `Reset all ${kind} keywords to defaults?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetKeywords(kind) },
      ],
    );
  };

  // ── SMS Permission ────────────────────────────────────────────────────────
  const handleSmsPermissionPress = async () => {
    if (hasPermission) return;
    const status = await requestPermission();
    if (status === 'never_ask_again') {
      Alert.alert(
        'Permission Permanently Denied',
        'SMS permission was permanently denied. Please open App Settings and enable it under Permissions → SMS.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
    } else if (status === 'denied') {
      Alert.alert(
        'Permission Denied',
        'SMS permission is required to auto-detect bank transactions. Tap "Tap to Allow" to try again.',
      );
    }
  };

  // ── SMS Scan ───────────────────────────────────────────────────────────────
  const handleScanInbox = async () => {
    let granted = hasPermission;
    if (!granted) {
      const status = await requestPermission();
      granted = status === 'granted';
      if (!granted) {
        if (status === 'never_ask_again') {
          Alert.alert(
            'Permission Permanently Denied',
            'SMS permission was permanently denied. Please open App Settings and enable it under Permissions → SMS.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
        } else {
          Alert.alert('Permission Denied', 'SMS permission is required to scan bank messages.');
        }
        return;
      }
    }
    const { processed, skipped } = await scanInbox();
    Alert.alert(
      'Scan Complete ✅',
      `Processed: ${processed} transaction(s)\nAlready seen / non-bank: ${skipped}`,
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'This will clear all processed SMS transaction records. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearHistory },
      ],
    );
  };

  const updateReminders = async (updates: Partial<ReminderSettings>) => {
    const next = { ...reminders, ...updates };
    setReminders(next);
    await saveReminderSettings(next);
    // Apply scheduling change immediately
    if (next.enabled && notifPermission) {
      await scheduleReminder(next, language);
    } else {
      await cancelReminder();
    }
  };

  const handlePermissionSwitch = async (enable: boolean) => {
    if (enable) {
      // Request permission from the OS
      const result = await notifee.requestPermission();
      const granted = result.authorizationStatus >= 1;
      setNotifPermission(granted);
      if (!granted) {
        Alert.alert(
          language === 'ar' ? 'تنبيه' : 'Permission Denied',
          language === 'ar'
            ? 'يرجى السماح بالإشعارات من إعدادات الجهاز'
            : 'Please enable notifications from your device settings.',
        );
      }
    } else {
      // Can't revoke programmatically — open system settings
      await notifee.openNotificationSettings();
      // Re-check permission after user returns from settings
      const result = await notifee.getNotificationSettings();
      setNotifPermission(result.authorizationStatus >= 1);
    }
  };

  const handleTestNotification = async () => {
    // Check permission first — don't request, the switch handles that
    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus < 1) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Permission Required',
        language === 'ar'
          ? 'يرجى تفعيل إذن الإشعارات عبر المفتاح أعلاه أولاً'
          : 'Please enable notification permission using the switch above first.',
      );
      return;
    }
    setIsTesting(true);
    try {

      const channelId = await notifee.createChannel({
        id: 'finvista_reminders',
        name: 'FinVista Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      const message = getMotivationalMessage('your goal', language);

      await notifee.displayNotification({
        title: language === 'ar' ? 'تذكير FinVista 💰' : 'FinVista Reminder 💰',
        body: message,
        android: { channelId, pressAction: { id: 'default' }, sound: 'default' },
        ios: { sound: 'default' },
      });

      Alert.alert(
        language === 'ar' ? 'تم الإرسال! ✅' : 'Sent! ✅',
        language === 'ar' ? 'تحقق من شريط الإشعارات' : 'Check your notification tray.',
      );
    } catch {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل إرسال الإشعار' : 'Failed to send test notification.',
      );
    } finally {
      setIsTesting(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
        {title.toUpperCase()}
      </Text>
      <Card noPadding>{children}</Card>
    </View>
  );

  const Row = ({
    label,
    right,
    onPress,
    noBorder,
  }: {
    label: string;
    right: React.ReactNode;
    onPress?: () => void;
    noBorder?: boolean;
  }) => (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.row,
        isRTL && styles.rtl,
        !noBorder && { borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
      ]}>
      <Text style={[styles.rowLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      {right}
    </TouchableOpacity>
  );

  const freqOptions: Array<{ key: ReminderSettings['frequency']; label: string }> = [
    { key: 'daily', label: t.daily },
    { key: 'weekly', label: t.weekly },
    { key: 'monthly', label: t.monthly },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t.settingsTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <Section title={isRTL ? 'الملف الشخصي' : 'Profile'}>
          <Row
            label={isRTL ? 'اسم المستخدم' : 'User Name'}
            noBorder
            onPress={() => setNameModalVisible(true)}
            right={
              <View style={[styles.nameRight, isRTL && styles.rtl]}>
                <Text style={[styles.nameValue, { color: theme.textMuted }]} numberOfLines={1}>
                  {userName || (isRTL ? 'اضغط للتعيين' : 'Tap to set')}
                </Text>
                <Text style={{ color: theme.textMuted, marginHorizontal: 4 }}>
                  <FontAwesomeIcon icon={resolveIcon(isRTL ? 'faChevronLeft' : 'faChevronRight')} size={8} color={theme.textMuted} />
                </Text>
              </View>
            }
          />
        </Section>

        {/* Appearance */}
        <Section title={t.appearance}>
          <Row
            label={t.darkMode}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ true: COLORS.accent, false: theme.cardBorder }}
                thumbColor="#fff"
              />
            }
          />
          <Row
            label={t.language}
            noBorder
            right={
              <View style={[styles.langRow, isRTL && styles.rtl]}>
                {(['en', 'ar'] as const).map(lang => (
                  <TouchableOpacity
                    key={lang}
                    onPress={() => setLanguage(lang)}
                    style={[
                      styles.langBtn,
                      language === lang && { backgroundColor: COLORS.accent },
                    ]}>
                    <Text
                      style={[
                        styles.langBtnTxt,
                        { color: language === lang ? COLORS.primary : theme.textSecondary },
                      ]}>
                      {lang === 'en' ? 'EN' : 'ع'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            }
          />
        </Section>

        {/* Notifications */}
        <Section title={t.notifications}>
          <Row
            label={t.remindersEnabled}
            right={
              <Switch
                value={notifPermission}
                onValueChange={handlePermissionSwitch}
                trackColor={{ true: COLORS.accent, false: theme.cardBorder }}
                thumbColor="#fff"
              />
            }
          />
          {reminders.enabled && (
            <View
              style={[
                styles.freqSection,
                { borderTopWidth: 1, borderTopColor: theme.cardBorder },
              ]}>
              <Text style={[styles.freqLabel, { color: theme.textSecondary }]}>
                {t.reminderFrequency}
              </Text>
              <View style={[styles.freqRow, isRTL && styles.rtl]}>
                {freqOptions.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => updateReminders({ frequency: opt.key })}
                    style={[
                      styles.freqBtn,
                      { borderColor: theme.cardBorder },
                      reminders.frequency === opt.key && {
                        backgroundColor: COLORS.accent,
                        borderColor: COLORS.accent,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.freqBtnTxt,
                        {
                          color:
                            reminders.frequency === opt.key
                              ? COLORS.primary
                              : theme.textSecondary,
                        },
                      ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View
            style={[styles.testSection, { borderTopWidth: 1, borderTopColor: theme.cardBorder }]}>
            <TouchableOpacity
              onPress={handleTestNotification}
              disabled={isTesting}
              style={[
                styles.testBtn,
                { borderColor: COLORS.accent, opacity: isTesting ? 0.6 : 1 },
              ]}>
              <Text style={[styles.testBtnTxt, { color: COLORS.accent }]}>
                {isTesting
                  ? language === 'ar'
                    ? 'جاري الإرسال...'
                    : 'Sending...'
                  : language === 'ar'
                  ? 'تجربة الإشعار'
                  : 'Test Notification'}
              </Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* ── Bank SMS Detection ─────────────────────────────────────── */}
        <Section title={isRTL ? 'كشف رسائل البنك' : 'Bank SMS Detection'}>
          {/* Permission Row */}
          <Row
            label={hasPermission && !isRTL ? 'SMS Permission Granted' : !hasPermission && !isRTL ? 'SMS Permission Required' : hasPermission && isRTL ? 'تم منح إذن الرسائل' : 'مطلوب إذن الرسائل'}
            onPress={hasPermission ? undefined : handleSmsPermissionPress}
            right={
              hasPermission ? (
                <Text style={{ color: COLORS.success, fontSize: FONT_SIZE.sm }}>
                  {isRTL ? 'تم منح الإذن' : 'Granted'}
                </Text>
              ) : (
                <Text style={{ color: COLORS.accent, fontSize: FONT_SIZE.sm }}>
                  {isRTL ? 'اضغط للسماح' : 'Tap to Allow'}
                </Text>
              )
            }
          />
          {/* Scan Inbox */}
          <TouchableOpacity
            onPress={handleScanInbox}
            disabled={isScanning}
            style={[
              styles.testBtn,
              {
                borderColor: COLORS.info,
                marginHorizontal: SPACING.md,
                marginVertical: SPACING.sm,
                opacity: isScanning ? 0.6 : 1,
              },
            ]}>
            {isScanning ? (
              <ActivityIndicator color={COLORS.info} />
            ) : (
              <Text style={[styles.testBtnTxt, { color: COLORS.info }]}>
                {isRTL ? 'مسح صندوق الوارد' : 'Scan Inbox for Bank SMS'}
              </Text>
            )}
          </TouchableOpacity>
          {/* Transaction count + clear */}
          <View
            style={[
              styles.row,
              { borderTopWidth: 1, borderTopColor: theme.cardBorder },
              isRTL && styles.rtl,
            ]}>
            <Text style={[styles.rowLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'المعاملات المعالجة' : 'Processed Transactions'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Text style={{ color: theme.textMuted, fontSize: FONT_SIZE.md }}>
                {transactions.length}
              </Text>
              {transactions.length > 0 && (
                <TouchableOpacity onPress={handleClearHistory}>
                  <Text style={{ color: COLORS.danger, fontSize: FONT_SIZE.sm, fontWeight: '700' }}>
                    {isRTL ? 'مسح' : 'Clear'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {/* Last checked timestamp */}
          <View
            style={[
              styles.row,
              { borderTopWidth: 1, borderTopColor: theme.cardBorder },
              isRTL && styles.rtl,
            ]}>
            <Text style={[styles.rowLabel, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'آخر فحص' : 'Last Checked'}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: FONT_SIZE.sm }}>
              {lastCheckedAt
                ? new Date(lastCheckedAt).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  })
                : isRTL ? 'لم يتم الفحص بعد' : 'Not checked yet'}
            </Text>
          </View>
        </Section>

        {/* ── Auto-Check Interval ───────────────────────────────── */}
        <Section title={isRTL ? 'الفترة التلقائية للتحقق' : 'Auto-Check Interval'}>
          <Row
            label={isRTL ? 'فترة الفحص التلقائي' : 'Check Frequency'}
            noBorder
            onPress={() => setPollModalVisible(true)}
            right={
              <View style={[styles.nameRight, isRTL && styles.rtl]}>
                <Text style={[styles.nameValue, { color: theme.textMuted }]}>
                  {POLL_INTERVAL_OPTIONS.find(o => o.value === pollInterval)?.label ?? ''}
                </Text>
                <Text style={{ color: theme.textMuted, marginHorizontal: 4 }}>
                  <FontAwesomeIcon icon={resolveIcon(isRTL ? 'faChevronLeft' : 'faChevronRight')} size={8} color={theme.textMuted} />
                </Text>
              </View>
            }
          />
        </Section>

        {/* ── Keyword Settings ───────────────────────────────── */}
        <Section title={isRTL ? 'إعدادات الكلمات الرئيسية' : 'Keyword Settings'}>
          <Row
            label={isRTL ? 'كلمات الوديعة' : 'Deposit Keywords'}
            onPress={() => { setEditingKw(null); setKwModalKind('deposit'); }}
            right={
              <View style={[styles.nameRight, isRTL && styles.rtl]}>
                <Text style={[styles.nameValue, { color: theme.textMuted }]}>{keywords.deposit.length} {isRTL ? 'كلمات' : 'words'}</Text>
                <Text style={{ color: theme.textMuted, marginHorizontal: 4 }}>
                  <FontAwesomeIcon icon={resolveIcon(isRTL ? 'faChevronLeft' : 'faChevronRight')} size={8} color={theme.textMuted} />
                </Text>
              </View>
            }
          />
          <Row
            label={isRTL ? 'كلمات السحب' : 'Withdrawal Keywords'}
            noBorder
            onPress={() => { setEditingKw(null); setKwModalKind('withdrawal'); }}
            right={
              <View style={[styles.nameRight, isRTL && styles.rtl]}>
                <Text style={[styles.nameValue, { color: theme.textMuted }]}>{keywords.withdrawal.length} {isRTL ? 'كلمات' : 'words'}</Text>
                <Text style={{ color: theme.textMuted, marginHorizontal: 4 }}>
                  <FontAwesomeIcon icon={resolveIcon(isRTL ? 'faChevronLeft' : 'faChevronRight')} size={8} color={theme.textMuted} />
                </Text>
              </View>
            }
          />
        </Section>

        {/* ── Auto Allocation Priority ───────────────────────────────── */}
        <Section title={isRTL ? 'أولوية التوزيع التلقائي' : 'Auto Allocation Priority'}>
          <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xs }}>
            <Text style={{ color: theme.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm }}>
              {isRTL ? 'اختر كيف يتم توزيع المعاملات المكتشفة على أهدافك.' : 'Choose how detected deposits & withdrawals are distributed to your goals.'}
            </Text>
          </View>
          {ALLOCATION_PRIORITY_OPTIONS.map((opt, idx) => {
            const isSelected = priority === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setPriority(opt.key)}
                style={[
                  styles.priorityRow,
                  isSelected && { backgroundColor: COLORS.accent + '18' },
                  idx < ALLOCATION_PRIORITY_OPTIONS.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.cardBorder,
                  },
                ]}>
                <View style={styles.priorityRadio}>
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: isSelected ? COLORS.accent : theme.textMuted },
                    ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: FONT_SIZE.md, fontWeight: isSelected ? '700' : '500' }}>
                    {opt.label}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 2 }}>
                    {opt.description}
                  </Text>
                </View>
                {isSelected && (
                  <Text style={{ color: COLORS.accent, fontSize: FONT_SIZE.sm, fontWeight: '700' }}>
                    <FontAwesomeIcon icon={resolveIcon('faCheck')} size={18} color={COLORS.accent} />
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </Section>

        {/* ── Blocked Senders ────────────────────────────────── */}
        <Section title={isRTL ? 'المرسلون المحظورون' : 'Blocked Senders'}>
          {blockList.length === 0 ? (
            <View style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.md }}>
              <Text style={{ color: theme.textMuted, fontSize: FONT_SIZE.sm }}>
                {isRTL ? 'لا يوجد مرسلون محظورون بعد. اضغط على "حظر المرسل" في أي معاملة SMS.' : 'No senders blocked yet. Tap “Block Sender” on any SMS transaction.'}
              </Text>
            </View>
          ) : (
            blockList.map((sender, idx) => (
              <View
                key={sender}
                style={[
                  styles.row,
                  isRTL && styles.rtl,
                  { borderBottomWidth: idx < blockList.length - 1 ? 1 : 0, borderBottomColor: theme.cardBorder },
                ]}>
                <Text style={[styles.rowLabel, { color: theme.text, flex: 1, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                  {sender}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      isRTL ? 'إلغاء حظر المرسل' : 'Unblock Sender',
                      isRTL ? `إزالة "${sender}" من قائمة الحظر؟` : `Remove "${sender}" from block list?`,
                      [
                        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                        { text: isRTL ? 'إلغاء الحظر' : 'Unblock', onPress: () => removeFromBlockList(sender) },
                      ],
                    )
                  }
                  style={{ paddingHorizontal: SPACING.sm, paddingVertical: 4 }}>
                  <Text style={{ color: COLORS.success, fontSize: FONT_SIZE.sm, fontWeight: '700' }}>
                    {isRTL ? 'إلغاء الحظر' : 'Unblock'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </Section>

        {/* About */}
        <Section title={t.about}>
          <Row label={t.appName} right={<Text style={{ color: theme.textMuted }}>FinVista</Text>} />
          <Row
            label={t.version}
            noBorder
            right={<Text style={{ color: theme.textMuted }}>{strings.versionNumber}</Text>}
          />
        </Section>

        {/* Branding */}
        <View style={styles.brand}>
          <Image
            source={require('../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={[styles.brandName, { color: theme.textMuted }]}>FinVista</Text>
          <Text style={[styles.brandTag, { color: theme.textMuted }]}>{t.tagline}</Text>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      <UserNameModal
        visible={nameModalVisible}
        currentName={userName}
        onSave={handleSaveName}
        onCancel={() => setNameModalVisible(false)}
      />

      {/* ── Poll Interval Modal ── */}
      <Modal
        visible={pollModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPollModalVisible(false)}>
        <View style={styles.modalRoot}>
          <TouchableWithoutFeedback onPress={() => setPollModalVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, isRTL && styles.rtl]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isRTL ? 'فترة الفحص التلقائي' : 'Auto-Check Interval'}
              </Text>
              <TouchableOpacity onPress={() => setPollModalVisible(false)}>
                <Text style={{ color: theme.textSecondary, fontSize: 20, lineHeight: 22 }}>
                  <FontAwesomeIcon icon={resolveIcon('faXmark')} size={18} color={theme.textSecondary} />
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.md, textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL ? ' اختر فترة أطول إذا كنت لا تتلقى رسائل بنكية بشكل متكرر.' : ' Choose a longer interval if you don\'t receive bank messages frequently.'}
            </Text>
            {POLL_INTERVAL_OPTIONS.map((opt, idx) => {
              const isSelected = pollInterval === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { setPollInterval(opt.value); setPollModalVisible(false); }}
                  style={[
                    styles.priorityRow,
                    { borderRadius: RADIUS.md },
                    isSelected && { backgroundColor: COLORS.accent + '18' },
                    idx < POLL_INTERVAL_OPTIONS.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.cardBorder,
                    },
                  ]}>
                  <View style={styles.priorityRadio}>
                    <View style={[styles.radioOuter, { borderColor: isSelected ? COLORS.accent : theme.textMuted }]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <Text style={{ flex: 1, color: theme.text, fontSize: FONT_SIZE.md, fontWeight: isSelected ? '700' : '500' }}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Text style={{ color: COLORS.accent, fontSize: FONT_SIZE.md, fontWeight: '700' }}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ── Keywords Modal (shared for deposit / withdrawal) ── */}
      <Modal
        visible={kwModalKind !== null}
        transparent
        animationType="slide"
        onRequestClose={() => { setEditingKw(null); setKwModalKind(null); }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalRoot}>
            <TouchableWithoutFeedback onPress={() => { setEditingKw(null); setKwModalKind(null); }}>
              <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
              {/* Header */}
              <View style={[styles.modalHeader, isRTL && styles.rtl]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {isRTL && kwModalKind === 'deposit' ? 'كلمات الوديعة' : isRTL && kwModalKind === 'withdrawal' ? 'كلمات السحب' : !isRTL && kwModalKind === 'deposit' ? 'Deposit Keywords' : 'Withdrawal Keywords'} 
                </Text>
                <TouchableOpacity onPress={() => { setEditingKw(null); setKwModalKind(null); }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 20, lineHeight: 22 }}>
                    <FontAwesomeIcon icon={resolveIcon('faXmark')} size={18} color={theme.textSecondary} />
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Keyword list */}
              <ScrollView
                style={{ maxHeight: 320 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                {kwModalKind && keywords[kwModalKind].map((word, idx) => (
                  <View
                    key={word}
                    style={[
                      styles.kwRow,
                      {
                        borderBottomWidth: idx < keywords[kwModalKind!].length - 1 ? StyleSheet.hairlineWidth : 0,
                        borderBottomColor: theme.cardBorder,
                      },
                    ]}>
                    {editingKw?.kind === kwModalKind && editingKw?.oldWord === word ? (
                      <RNTextInput
                        value={editingKw.newWord}
                        onChangeText={v => setEditingKw(prev => prev ? { ...prev, newWord: v } : null)}
                        autoFocus
                        style={[styles.kwInput, { color: theme.text, borderColor: theme.cardBorder, flex: 1 }]}
                        onSubmitEditing={handleSaveEdit}
                        returnKeyType="done"
                      />
                    ) : (
                      <Text style={[styles.kwChip, { color: theme.text }]}>{word}</Text>
                    )}
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: SPACING.xs }}>
                      {editingKw?.kind === kwModalKind && editingKw?.oldWord === word ? (
                        <>
                          <TouchableOpacity onPress={handleSaveEdit} style={[styles.kwBtn, { backgroundColor: COLORS.success }]}>
                            <Text style={styles.kwBtnTxt}>{t.save}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setEditingKw(null)} style={[styles.kwBtn, { backgroundColor: theme.cardBorder }]}>
                            <Text style={[styles.kwBtnTxt, { color: theme.textSecondary }]}>
                              <FontAwesomeIcon icon={resolveIcon('faXmark')} size={14} color={theme.textSecondary} />
                            </Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity
                            onPress={() => handleEditKeyword(kwModalKind!, word)}
                            style={[styles.kwBtn, { backgroundColor: COLORS.info + '22' }]}>
                            <Text style={[styles.kwBtnTxt, { color: COLORS.info }]}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteKeyword(kwModalKind!, word)}
                            style={[styles.kwBtn, { backgroundColor: COLORS.danger + '22' }]}>
                            <Text style={[styles.kwBtnTxt, { color: COLORS.danger }]}>
                              <FontAwesomeIcon icon={resolveIcon('faXmark')} size={14} color={theme.textSecondary} />
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Add new keyword */}
              <View style={[styles.kwAddRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.cardBorder, marginTop: SPACING.sm }]}>
                <RNTextInput
                  value={kwModalKind === 'deposit' ? newDepositKw : newWithdrawalKw}
                  onChangeText={v =>
                    kwModalKind === 'deposit' ? setNewDepositKw(v) : setNewWithdrawalKw(v)
                  }
                  placeholder={isRTL ? 'أدخل كلمة جديدة' : 'Enter new keyword'}
                  placeholderTextColor={theme.textMuted}
                  style={[styles.kwInput, { color: theme.text, borderColor: theme.cardBorder, flex: 1 }]}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={() => kwModalKind && handleAddKeyword(kwModalKind)}
                />
                <TouchableOpacity
                  onPress={() => kwModalKind && handleAddKeyword(kwModalKind)}
                  style={[styles.kwBtn, { backgroundColor: COLORS.accent }]}>
                  <Text style={[styles.kwBtnTxt, { color: COLORS.primary }]}>
                    {isRTL ? 'إضافة' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Reset */}
              <TouchableOpacity
                onPress={() => kwModalKind && handleResetKeywords(kwModalKind)}
                style={[styles.resetBtn, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.cardBorder }]}>
                <Text style={[styles.resetBtnTxt, { color: theme.textMuted }]}>
                  {isRTL ? 'إعادة تعيين إلى الافتراضي' : 'Reset to Default'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  content: { paddingHorizontal: SPACING.lg },
  section: { marginBottom: SPACING.md },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  rtl: { flexDirection: 'row-reverse' },
  rowLabel: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  nameRight: { flexDirection: 'row', alignItems: 'center', maxWidth: 160 },
  nameValue: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  langRow: { flexDirection: 'row', gap: SPACING.xs },
  langBtn: { paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.sm },
  langBtnTxt: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  freqSection: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  freqLabel: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm },
  freqRow: { flexDirection: 'row', gap: SPACING.sm },
  freqBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  freqBtnTxt: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  testSection: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  testBtn: { paddingVertical: 10, borderRadius: RADIUS.sm, borderWidth: 1.5, alignItems: 'center' },
  testBtnTxt: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  brand: { alignItems: 'center', paddingVertical: SPACING.xl },
  brandLogo: { width: 56, height: 56, borderRadius: 14, marginBottom: SPACING.sm },
  brandName: { fontSize: FONT_SIZE.lg, fontWeight: '800', letterSpacing: 2 },
  brandTag: { fontSize: FONT_SIZE.sm, marginTop: 4 },
  // Keyword styles
  kwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  kwChip: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  kwInput: {
    fontSize: FONT_SIZE.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  kwBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  kwBtnTxt: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#fff',
  },
  kwAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  resetBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  resetBtnTxt: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  // Priority styles
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  priorityRadio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  // Bottom-sheet modals
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
});