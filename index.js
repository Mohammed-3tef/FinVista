/**
 * Haweshly - Financial Goals Tracker
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// ── Notifee: handle notification events when the app is killed ────────────────
import notifee from '@notifee/react-native';
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // Placeholder – add press/dismiss handling here if needed in future
  void type;
  void detail;
});

// ── BackgroundFetch: headless SMS task (runs even when app is killed) ─────────
// Must be registered before AppRegistry.registerComponent.
import BackgroundFetch from 'react-native-background-fetch';
import { runSmsBgCheck } from './src/tasks/smsBackgroundTask';

const smsHeadlessTask = async (event) => {
  const taskId = event?.taskId ?? 'com.transistorsoft.fetch';
  try {
    await runSmsBgCheck();
  } catch (e) {
    console.warn('[Haweshly BG] SMS check error:', e);
  } finally {
    BackgroundFetch.finish(taskId);
  }
};

BackgroundFetch.registerHeadlessTask(smsHeadlessTask);

// ── Headless JS task triggered by native SmsBroadcastReceiver ─────────────────
// Runs when Android delivers SMS_RECEIVED or BOOT_COMPLETED to SmsBroadcastReceiver
// while the app is completely killed.
AppRegistry.registerHeadlessTask('SmsCheckTask', () => async () => {
  try {
    await runSmsBgCheck();
  } catch (e) {
    console.warn('[Haweshly BG] SmsCheckTask error:', e);
  }
});

AppRegistry.registerComponent(appName, () => App);
