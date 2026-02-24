/**
 * smsBackgroundTask.ts
 *
 * Standalone (React-free) SMS processor used by:
 *  - react-native-background-fetch headless task (app killed)
 *  - Foreground BackgroundFetch callback (app open / backgrounded)
 *
 * Reads all persistent state directly from AsyncStorage so it works
 * even when the React component tree is not mounted.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  readInboxSmsSince,
  parseSms,
  isAlreadyProcessed,
  markAsProcessed,
  saveSmsTransaction,
  loadBlockList,
  isSenderBlocked,
} from '../services/smsService';
import { allocateToGoals } from '../utils/allocationEngine';
import { checkAndFireMilestones } from '../services/notifications';
import {
  AllocationPriority,
  DEFAULT_ALLOCATION_PRIORITY,
  DEFAULT_DEPOSIT_KEYWORDS,
  DEFAULT_WITHDRAWAL_KEYWORDS,
  GoalAllocation,
  SmsKeywords,
  SmsTransaction,
} from '../constants/types';
import { Goal, SavingsEntry, generateId } from '../utils/calculations';

// ─── Storage key constants (must match GoalsContext + SmsContext) ─────────────
const GOALS_KEY      = 'finvista_goals';
const ENTRIES_KEY    = 'finvista_entries';
const KEYWORDS_KEY   = '@finvista_sms_keywords';
const PRIORITY_KEY   = '@finvista_allocation_priority';
/** Last-checked timestamp managed exclusively by this background task */
export const BG_LAST_CHECKED_KEY = '@finvista_bg_last_checked';

// ─── Core background processor ───────────────────────────────────────────────
/**
 * Runs a full SMS inbox poll + allocation cycle without any React context.
 * Safe to call from a headless JS task, WorkManager job, or any async context.
 */
export async function runSmsBgCheck(): Promise<void> {
  const [kwRaw, prRaw, goalsRaw, entriesRaw, lastTsRaw, blockList] =
    await Promise.all([
      AsyncStorage.getItem(KEYWORDS_KEY),
      AsyncStorage.getItem(PRIORITY_KEY),
      AsyncStorage.getItem(GOALS_KEY),
      AsyncStorage.getItem(ENTRIES_KEY),
      AsyncStorage.getItem(BG_LAST_CHECKED_KEY),
      loadBlockList(),
    ]);

  const keywords: SmsKeywords = kwRaw
    ? JSON.parse(kwRaw)
    : { deposit: DEFAULT_DEPOSIT_KEYWORDS, withdrawal: DEFAULT_WITHDRAWAL_KEYWORDS };
  const priority: AllocationPriority =
    (prRaw as AllocationPriority) ?? DEFAULT_ALLOCATION_PRIORITY;
  const goals: Goal[] = goalsRaw ? JSON.parse(goalsRaw) : [];
  let entries: SavingsEntry[] = entriesRaw ? JSON.parse(entriesRaw) : [];

  // Nothing to allocate to if there are no goals
  if (!goals.length) return;

  // Only process SMS after the oldest goal was created
  const oldestGoalDate = Math.min(
    ...goals.map(g => new Date(g.createdAt).getTime()),
  );

  // Stamp before scanning so we never miss messages between runs
  const since = lastTsRaw ? Number(lastTsRaw) : oldestGoalDate;
  await AsyncStorage.setItem(BG_LAST_CHECKED_KEY, String(Date.now()));

  const smsList = (await readInboxSmsSince(since)).sort((a, b) => a.date - b.date);

  for (const raw of smsList) {
    if (raw.date < oldestGoalDate) continue;
    if (isSenderBlocked(raw.address, blockList)) continue;

    const parsed = parseSms(raw, keywords);
    if (!parsed) continue;
    if (await isAlreadyProcessed(parsed.fingerprint)) continue;

    // ── Allocation ──────────────────────────────────────────────────────────
    const allocations: GoalAllocation[] = allocateToGoals(
      goals, entries, parsed.amount, parsed.type, priority,
    );

    const txId = generateId();

    // Build new savings entries
    // alloc.amount is already correctly signed by allocateToGoals:
    //   deposit  → positive,  withdrawal → negative
    const newEntries: SavingsEntry[] = [];
    for (const alloc of allocations) {
      if (alloc.amount === 0) continue;
      newEntries.push({
        id: generateId(),
        goalId: alloc.goalId,
        amount: alloc.amount,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        smsTransactionId: txId,
      });
    }

    // Persist entries atomically
    entries = [...entries, ...newEntries];
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));

    // Persist transaction record
    const tx: SmsTransaction = {
      id: txId,
      smsFingerprint: parsed.fingerprint,
      sender: parsed.sender,
      smsDate: parsed.smsDate,
      type: parsed.type,
      amount: parsed.amount,
      rawMessage: parsed.rawMessage,
      processedAt: new Date().toISOString(),
      allocations,
    };
    await saveSmsTransaction(tx);
    await markAsProcessed(parsed.fingerprint);

    // ── Milestone notifications ─────────────────────────────────────────────
    for (const alloc of allocations) {
      if (alloc.amount === 0) continue;
      const goal = goals.find(g => g.id === alloc.goalId);
      if (!goal) continue;
      const oldTotal = entries
        .filter(e => e.goalId === alloc.goalId && e.smsTransactionId !== txId)
        .reduce((sum, e) => sum + e.amount, 0);
      await checkAndFireMilestones(
        goal.id, goal.name, oldTotal, oldTotal + alloc.amount, goal.targetAmount,
      );
    }
  }
}
