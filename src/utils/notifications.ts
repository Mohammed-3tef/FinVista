// import { Platform } from 'react-native';
import { translations, Language } from '../constants/translations';

// Note: In production, install @notifee/react-native or react-native-push-notification
// This is a stub implementation that shows the notification logic
// For actual implementation, install: npm install @notifee/react-native

let notifee: any = null;
let AndroidImportance: any = null;
let TimestampTriggerType: any = null;

try {
  const mod = require('@notifee/react-native');
  notifee = mod.default;
  AndroidImportance = mod.AndroidImportance;
  TimestampTriggerType = mod.TriggerType;
} catch {
  console.log('Notifee not available - using mock notifications');
}

export const getRandomMessage = (lang: Language, goalName: string): string => {
  const messages = translations[lang].notifMessages;
  const random = messages[Math.floor(Math.random() * messages.length)];
  return random.replace('[Goal]', goalName);
};

export const scheduleNotification = async (
  lang: Language,
  goalName: string,
  frequency: 'daily' | 'weekly' | 'monthly',
): Promise<void> => {
  if (!notifee) {
    console.log('Would schedule notification:', { lang, goalName, frequency });
    return;
  }

  try {
    await notifee.requestPermission();

    const channelId = await notifee.createChannel({
      id: 'haweshly_reminders',
      name: 'Haweshly Reminders',
      importance: AndroidImportance?.HIGH ?? 4,
    });

    const message = getRandomMessage(lang, goalName);
    const title = translations[lang].reminderTitle;

    const now = new Date();
    let triggerDate = new Date(now);

    if (frequency === 'daily') {
      triggerDate.setDate(triggerDate.getDate() + 1);
      triggerDate.setHours(9, 0, 0, 0);
    } else if (frequency === 'weekly') {
      triggerDate.setDate(triggerDate.getDate() + 7);
      triggerDate.setHours(9, 0, 0, 0);
    } else {
      triggerDate.setMonth(triggerDate.getMonth() + 1);
      triggerDate.setHours(9, 0, 0, 0);
    }

    const trigger = {
      type: TimestampTriggerType?.TIMESTAMP ?? 0,
      timestamp: triggerDate.getTime(),
      repeatFrequency:
        frequency === 'daily' ? 0 : frequency === 'weekly' ? 1 : 2,
    };

    await notifee.createTriggerNotification(
      {
        title,
        body: message,
        android: {
          channelId,
          smallIcon: 'ic_launcher',
        },
        ios: {
          sound: 'default',
        },
      },
      trigger,
    );
  } catch (e) {
    console.error('Error scheduling notification:', e);
  }
};

export const sendImmediateNotification = async (
  lang: Language,
  goalName: string,
): Promise<void> => {
  if (!notifee) {
    console.log('Would send notification:', { lang, goalName });
    return;
  }

  try {
    await notifee.requestPermission();

    const channelId = await notifee.createChannel({
      id: 'haweshly_reminders',
      name: 'Haweshly Reminders',
      importance: AndroidImportance?.HIGH ?? 4,
    });

    const message = getRandomMessage(lang, goalName);
    const title = translations[lang].reminderTitle;

    await notifee.displayNotification({
      title,
      body: message,
      android: { channelId },
    });
  } catch (e) {
    console.error('Error sending notification:', e);
  }
};

export const cancelAllNotifications = async (): Promise<void> => {
  if (!notifee) return;
  try {
    await notifee.cancelAllNotifications();
  } catch (e) {
    console.error('Error cancelling notifications:', e);
  }
};
