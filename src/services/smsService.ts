/**
 * smsService.ts
 * Handles SMS reading, parsing, deduplication and amount extraction.
 * Uses react-native-get-sms-android for both inbox scanning and
 * background polling (react-native-sms-listener is a dead stub and unused).
 */

import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SmsKeywords, SmsTransaction } from '../constants/types';

// ─── Storage Keys ────────────────────────────────────────────────────────────
const SMS_TRANSACTIONS_KEY = '@haweshly_sms_transactions';
const SMS_PROCESSED_IDS_KEY = '@haweshly_processed_sms';
const SMS_BLOCK_LIST_KEY    = '@haweshly_sms_blocklist';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface RawSms {
  _id: string;
  address: string;
  body: string;
  date: number;
  date_sent: number;
  read: number;
  type: number;
}

export interface ParsedSms {
  fingerprint: string;
  sender: string;
  smsDate: number;
  type: 'deposit' | 'withdrawal';
  amount: number;
  rawMessage: string;
}

// ─── Permission ───────────────────────────────────────────────────────────────
export type SmsPermissionStatus = 'granted' | 'denied' | 'never_ask_again';

export async function requestSmsPermission(): Promise<SmsPermissionStatus> {
  if (Platform.OS !== 'android') return 'denied';
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission',
        message: 'Haweshly needs access to your SMS to auto-detect bank transactions.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'never_ask_again';
    return 'denied';
  } catch {
    return 'denied';
  }
}

/** Check the current READ_SMS permission status without showing a prompt. */
export async function checkSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
  } catch {
    return false;
  }
}

// ─── Fingerprint ─────────────────────────────────────────────────────────────
/** Creates a stable unique key for a message to prevent duplicate processing. */
export function buildFingerprint(address: string, date: number, body: string): string {
  return `${address}_${date}_${body.slice(0, 20).replace(/\s/g, '')}`;
}

// ─── Amount Extraction ───────────────────────────────────────────────────────
/**
 * Extracts a numeric amount from an SMS body.
 * Handles formats like:
 *   EGP 1,200.00  |  1200.50 EGP  |  $500  |  Rs.500  |  INR1000  |  plain 1500
 */
export function extractAmount(body: string): number | null {
  const patterns = [
    // Currency symbol/code before amount: EGP1,200.50 | $500 | Rs.300
    /(?:EGP|USD|SAR|AED|INR|GBP|EUR|Rs\.?|\$|€|£)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // Amount before currency code: 1200.50 EGP
    /([\d,]+(?:\.\d{1,2})?)\s*(?:EGP|USD|SAR|AED|INR|GBP|EUR)/i,
    // "amount" or "amt" keyword: Amount: 1500 | Amt 3000.00
    /(?:amount|amt)[:\s]+(?:EGP|USD|SAR|AED|INR|Rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    // standalone number fallback (first large number)
    /\b(\d{3,}(?:\.\d{1,2})?)\b/,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      const raw = match[1].replace(/,/g, '');
      const value = parseFloat(raw);
      if (!isNaN(value) && value > 0) return value;
    }
  }
  return null;
}

// ─── Transaction Type Detection ───────────────────────────────────────────────
export function detectTransactionType(
  body: string,
  keywords: SmsKeywords,
): 'deposit' | 'withdrawal' | null {
  const lower = body.toLowerCase();

  // Check withdrawal first (more specific)
  for (const kw of keywords.withdrawal) {
    if (lower.includes(kw.toLowerCase())) return 'withdrawal';
  }
  for (const kw of keywords.deposit) {
    if (lower.includes(kw.toLowerCase())) return 'deposit';
  }
  return null;
}

// ─── Parse SMS ────────────────────────────────────────────────────────────────
export function parseSms(
  raw: RawSms,
  keywords: SmsKeywords,
): ParsedSms | null {
  const type = detectTransactionType(raw.body, keywords);
  if (!type) return null;

  const amount = extractAmount(raw.body);
  if (!amount) return null;

  const fingerprint = buildFingerprint(raw.address, raw.date, raw.body);
  return { fingerprint, sender: raw.address, smsDate: raw.date, type, amount, rawMessage: raw.body };
}

// ─── Processed IDs (dedup) ────────────────────────────────────────────────────
export async function loadProcessedFingerprints(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(SMS_PROCESSED_IDS_KEY);
  return new Set(raw ? JSON.parse(raw) : []);
}

export async function saveProcessedFingerprints(set: Set<string>): Promise<void> {
  await AsyncStorage.setItem(SMS_PROCESSED_IDS_KEY, JSON.stringify([...set]));
}

export async function isAlreadyProcessed(fingerprint: string): Promise<boolean> {
  const set = await loadProcessedFingerprints();
  return set.has(fingerprint);
}

export async function markAsProcessed(fingerprint: string): Promise<void> {
  const set = await loadProcessedFingerprints();
  set.add(fingerprint);
  await saveProcessedFingerprints(set);
}

export async function unmarkAsProcessed(fingerprint: string): Promise<void> {
  const set = await loadProcessedFingerprints();
  set.delete(fingerprint);
  await saveProcessedFingerprints(set);
}

// ─── Transaction History ──────────────────────────────────────────────────────
export async function loadSmsTransactions(): Promise<SmsTransaction[]> {
  const raw = await AsyncStorage.getItem(SMS_TRANSACTIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveSmsTransaction(tx: SmsTransaction): Promise<void> {
  const existing = await loadSmsTransactions();
  await AsyncStorage.setItem(
    SMS_TRANSACTIONS_KEY,
    JSON.stringify([tx, ...existing]),
  );
}

export async function deleteSmsTransaction(id: string): Promise<void> {
  const existing = await loadSmsTransactions();
  await AsyncStorage.setItem(
    SMS_TRANSACTIONS_KEY,
    JSON.stringify(existing.filter(t => t.id !== id)),
  );
}

export async function clearSmsTransactions(): Promise<void> {
  await AsyncStorage.removeItem(SMS_TRANSACTIONS_KEY);
  await AsyncStorage.removeItem(SMS_PROCESSED_IDS_KEY);
}

// ─── Block List ───────────────────────────────────────────────────────────────
export async function loadBlockList(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(SMS_BLOCK_LIST_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveBlockList(list: string[]): Promise<void> {
  await AsyncStorage.setItem(SMS_BLOCK_LIST_KEY, JSON.stringify(list));
}

export function isSenderBlocked(sender: string, blockList: string[]): boolean {
  return blockList.some(b => b.toLowerCase() === sender.toLowerCase());
}

// ─── Inbox Scan ───────────────────────────────────────────────────────────────
/** Reads the last `maxCount` inbox messages. */
export function readInboxSms(maxCount = 50): Promise<RawSms[]> {
  return new Promise((resolve, reject) => {
    SmsAndroid.list(
      JSON.stringify({ box: 'inbox', maxCount }),
      (fail: string) => reject(new Error(fail)),
      (_count: number, smsList: string) => {
        try { resolve(JSON.parse(smsList) as RawSms[]); }
        catch (e) { reject(e); }
      },
    );
  });
}

/**
 * Reads inbox messages received after `minDate` (Unix ms timestamp).
 * Used for background polling to detect new transactions without a
 * native SMS broadcast listener.
 */
export function readInboxSmsSince(minDate: number): Promise<RawSms[]> {
  return new Promise((resolve, reject) => {
    SmsAndroid.list(
      JSON.stringify({ box: 'inbox', minDate, maxCount: 20 }),
      (fail: string) => reject(new Error(fail)),
      (_count: number, smsList: string) => {
        try { resolve(JSON.parse(smsList) as RawSms[]); }
        catch (e) { reject(e); }
      },
    );
  });
}
