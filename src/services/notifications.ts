import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, TriggerType, RepeatFrequency } from '@notifee/react-native';
import type { TimestampTrigger } from '@notifee/react-native';
import { Language } from '../constants/strings';

export interface ReminderSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
}

const REMINDER_KEY = 'finvista_reminders';

export async function getReminderSettings(): Promise<ReminderSettings> {
  const val = await AsyncStorage.getItem(REMINDER_KEY);
  if (val) return JSON.parse(val);
  return { enabled: true, frequency: 'daily' };
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
}

const enMessages = [
  'Save today, relax tomorrow ✨ Every small effort counts towards your bigger dreams.',
  "You're getting closer to your goal 💪 Keep going and don't let anything stop you.",
  'Small steps lead to big wins 🏆 Every bit you save brings you closer to success.',
  'Consistency is key 🔑 Stick to your plan even when it feels hard.',
  'Every penny counts 💰 What you save today builds your future tomorrow.',
  'Keep pushing, you got this 🚀 Remember, slow progress is still progress.',
  'Your future self will thank you 🙏 Every effort you make now is worth it later.',
  'Stay focused, stay strong 💼 Challenges come and go, but your dedication lasts.'
];

const arMessages = [
  'حوش النهارده وارتاح بكرة ✨ كل جنيه تحوشه النهارده هيفرق معاك بكرة.',
  'قربت توصل لهدفك 💪 خلي عزيمتك قوية وماسيبش حاجة توقفك.',
  'خطوات صغيرة بتعمل فرق كبير 🏆 كل مرة تحوش فيها حاجة صغيرة بتقربك من حلمك.',
  'الاستمرار هو السر 🔑 حتى لو حاسس بصعوبة، كمّل على الخطة بتاعتك.',
  'كل جنيه ليه قيمته 💰 اللي بتحوشه النهارده هو اللي هيخليك مرتاح بكرة.',
  'كمّل، انت قدها 🚀 حتى لو التقدم بطيء، كل خطوة محسوبة.',
  'مستقبلك هيشكرك 🙏 كل مجهود بتعمله دلوقتي هينفعك بعدين.',
  'ركز وكون ثابت 💼 المشاكل بتيجي وتروح، لكن عزيمتك بتفضل.'
];

export function getMotivationalMessage(goalName: string, _language: Language): string {
  const messages = arMessages;
  const msg = messages[Math.floor(Math.random() * messages.length)];
  return msg.replace('[Goal]', goalName);
}

// ─── Reminder Scheduling ──────────────────────────────────────────────────────

const REMINDER_CHANNEL_ID      = 'finvista_reminders';
const REMINDER_NOTIFICATION_ID = 'finvista_reminder';

/**
 * Schedule (or reschedule) a recurring motivational reminder.
 * - daily   → fires every day at 9 AM
 * - weekly  → fires every week at 9 AM
 * - monthly → fires once in 30 days at 9 AM (rescheduled on next app open)
 * Call this whenever settings change or the app starts with reminders enabled.
 */
export async function scheduleReminder(
  settings: ReminderSettings,
  language: Language,
): Promise<void> {
  // Always cancel any previously scheduled reminder first
  await notifee.cancelNotification(REMINDER_NOTIFICATION_ID);

  if (!settings.enabled) return;

  const channelId = await notifee.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: 'FinVista Reminders',
    sound: 'default',
    importance: AndroidImportance.HIGH
  });

  // Target: 9:00 AM — move to tomorrow if today's 9 AM has already passed
  const now = new Date();
  const triggerDate = new Date();
  triggerDate.setHours(9, 0, 0, 0);
  if (triggerDate <= now) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  // For monthly: jump 30 days ahead instead of just tomorrow
  if (settings.frequency === 'monthly') {
    triggerDate.setDate(now.getDate() + 30);
    triggerDate.setHours(9, 0, 0, 0);
  }

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: triggerDate.getTime(),
    // Monthly has no native repeat — it fires once and gets rescheduled on next app open
    repeatFrequency:
      settings.frequency === 'daily'
        ? RepeatFrequency.DAILY
        : settings.frequency === 'weekly'
        ? RepeatFrequency.WEEKLY
        : undefined,
  };

  await notifee.createTriggerNotification(
    {
      id: REMINDER_NOTIFICATION_ID,
      title: language === 'ar' ? 'تذكير FinVista 💰' : 'FinVista Reminder 💰',
      body: getMotivationalMessage('', language),
      android: {
        channelId,
        pressAction: { id: 'default' },
        sound: 'default',
      },
      ios: { sound: 'default' },
    },
    trigger,
  );
}

/** Cancel any scheduled reminder notification. */
export async function cancelReminder(): Promise<void> {
  await notifee.cancelNotification(REMINDER_NOTIFICATION_ID);
}

const GOAL_MILESTONES_KEY   = '@finvista_goal_milestones';
const MILESTONE_CHANNEL_ID  = 'finvista_milestones';
export const MILESTONE_THRESHOLDS = [25, 50, 75, 100] as const;

async function loadGoalMilestones(): Promise<Record<string, number[]>> {
  const raw = await AsyncStorage.getItem(GOAL_MILESTONES_KEY);
  return raw ? JSON.parse(raw) : {};
}

/** Remove persisted milestone data for a deleted goal */
export async function clearGoalMilestones(goalId: string): Promise<void> {
  const data = await loadGoalMilestones();
  delete data[goalId];
  await AsyncStorage.setItem(GOAL_MILESTONES_KEY, JSON.stringify(data));
}

/**
 * Given the old and new total saved for a goal, fires a notification for every
 * milestone threshold (25 / 50 / 75 / 100 %) that is newly crossed.
 * Each milestone is stored so it is only ever sent once per goal.
 */
export async function checkAndFireMilestones(
  goalId: string,
  goalName: string,
  oldTotal: number,
  newTotal: number,
  targetAmount: number,
): Promise<void> {
  if (targetAmount <= 0) return;

  const oldPct = (oldTotal / targetAmount) * 100;
  const newPct = (newTotal / targetAmount) * 100;

  // Milestones crossed in this update
  const justCrossed = MILESTONE_THRESHOLDS.filter(m => oldPct < m && newPct >= m);
  if (!justCrossed.length) return;

  const data = await loadGoalMilestones();
  const sent = new Set<number>(data[goalId] ?? []);
  const toFire = justCrossed.filter(m => !sent.has(m));
  if (!toFire.length) return;

  // Only notify for the highest milestone reached in this update
  const highest = Math.max(...toFire);

  await notifee.createChannel({
    id: MILESTONE_CHANNEL_ID,
    name: 'Goal Milestones',
    importance: AndroidImportance.HIGH,
    sound: 'reminder_sound',
  });

  const isComplete = highest === 100;
  await notifee.displayNotification({
    title: isComplete
      ? `🎉 Goal Complete - ${goalName}`
      : `🏆 ${highest}% Reached - ${goalName}`,
    body: isComplete
      ? `Congratulations! You've fully funded your "${goalName}" goal!`
      : `You're ${highest}% of the way to your "${goalName}" goal. Keep it up!`,
    android: {
      channelId: MILESTONE_CHANNEL_ID,
      pressAction: { id: 'default' },
      sound: 'reminder_sound',
    },
    ios: { sound: 'default' },
  });

  // Mark ALL skipped lower milestones as sent too, so they never fire retroactively
  for (const m of toFire) sent.add(m);

  data[goalId] = Array.from(sent);
  await AsyncStorage.setItem(GOAL_MILESTONES_KEY, JSON.stringify(data));
}
