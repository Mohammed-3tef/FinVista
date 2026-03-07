/**
 * SmsContext.tsx
 * Manages:
 *  - SMS keyword settings (deposit & withdrawal keywords)
 *  - Allocation priority selection
 *  - SMS transaction history
 *  - Processing incoming/scanned SMS messages
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId, SavingsEntry } from '../utils/calculations';
import {
  AllocationPriority,
  DEFAULT_ALLOCATION_PRIORITY,
  DEFAULT_DEPOSIT_KEYWORDS,
  DEFAULT_WITHDRAWAL_KEYWORDS,
  DEFAULT_POLL_INTERVAL,
  GoalAllocation,
  PollInterval,
  SmsKeywords,
  SmsTransaction,
} from '../constants/types';
import {
  requestSmsPermission,
  checkSmsPermission,
  SmsPermissionStatus,
  readInboxSms,
  parseSms,
  markAsProcessed,
  unmarkAsProcessed,
  isAlreadyProcessed,
  loadSmsTransactions,
  saveSmsTransaction,
  deleteSmsTransaction,
  clearSmsTransactions,
  loadBlockList,
  saveBlockList,
  isSenderBlocked,
} from '../services/smsService';
import { allocateToGoals } from '../utils/allocationEngine';
import { checkAndFireMilestones } from '../services/notifications';
import { useGoals } from './GoalsContext';
import BackgroundFetch from 'react-native-background-fetch';

// ─── Background Fetch helper ───────────────────────────────────────────────────
/** ms → minutes, clamped to WorkManager’s 15-min minimum for killed-app execution */
function msToFetchMinutes(ms: number): number {
  return Math.max(15, Math.round(ms / 60_000));
}

async function configureBackgroundFetch(
  intervalMs: number,
  foregroundTask: () => Promise<void>,
  onComplete?: () => Promise<void>,
): Promise<void> {
  try {
    await BackgroundFetch.configure(
      {
        minimumFetchInterval: msToFetchMinutes(intervalMs),
        enableHeadless: true,       // run headless task when app is killed
        startOnBoot: true,          // reschedule after device reboot
        stopOnTerminate: false,     // keep WorkManager job alive when app killed
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
        requiresBatteryNotLow: false,
        requiresCharging: false,
        requiresDeviceIdle: false,
        requiresStorageNotLow: false,
      },
      async (taskId: string) => {
        // Foreground/background callback — app is alive, use the React path
        // (pollOnce) so GoalsContext entries stay in sync via addEntry.
        try {
          await foregroundTask();
          if (onComplete) await onComplete();
        } catch (e) {
          console.warn('[FinVista BG] fetch error:', e);
        } finally {
          BackgroundFetch.finish(taskId);
        }
      },
      (taskId: string) => {
        // Timeout handler
        console.warn('[FinVista BG] fetch timeout:', taskId);
        BackgroundFetch.finish(taskId);
      },
    );
  } catch (e) {
    console.warn('[FinVista BG] configure error:', e);
  }
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const KEYWORDS_KEY      = '@finvista_sms_keywords';
const PRIORITY_KEY      = '@finvista_allocation_priority';
const POLL_INTERVAL_KEY = '@finvista_poll_interval';
const PERMISSION_KEY    = '@finvista_sms_permission';

// ─── Context Types ────────────────────────────────────────────────────────────
export interface SmsContextType {
  // Keywords
  keywords: SmsKeywords;
  addKeyword: (kind: 'deposit' | 'withdrawal', word: string) => Promise<void>;
  updateKeyword: (kind: 'deposit' | 'withdrawal', oldWord: string, newWord: string) => Promise<void>;
  deleteKeyword: (kind: 'deposit' | 'withdrawal', word: string) => Promise<void>;
  resetKeywords: (kind: 'deposit' | 'withdrawal') => Promise<void>;

  // Priority
  priority: AllocationPriority;
  setPriority: (p: AllocationPriority) => Promise<void>;

  // Poll interval
  pollInterval: PollInterval;
  setPollInterval: (ms: PollInterval) => Promise<void>;

  // Transactions
  transactions: SmsTransaction[];
  deleteTransaction: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;

  // Block list
  blockList: string[];
  addToBlockList: (sender: string) => Promise<void>;
  removeFromBlockList: (sender: string) => Promise<void>;

  // SMS Scanning
  hasPermission: boolean;
  requestPermission: () => Promise<SmsPermissionStatus>;
  scanInbox: () => Promise<{ processed: number; skipped: number }>;
  isScanning: boolean;
  /** Unix-ms timestamp of the last automatic or manual inbox check, null if never checked */
  lastCheckedAt: number | null;
  /** Re-read transactions from storage (used by pull-to-refresh) */
  reloadTransactions: () => Promise<void>;
}

const SmsContext = createContext<SmsContextType>({} as SmsContextType);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function SmsProvider({ children }: { children: ReactNode }) {
  const { goals, entries, addEntry, deleteEntriesByTransactionId } = useGoals();

  const [keywords, setKeywords] = useState<SmsKeywords>({
    deposit: DEFAULT_DEPOSIT_KEYWORDS,
    withdrawal: DEFAULT_WITHDRAWAL_KEYWORDS,
  });
  const [priority, setPriorityState] = useState<AllocationPriority>(DEFAULT_ALLOCATION_PRIORITY);
  const [pollInterval, setPollIntervalState] = useState<PollInterval>(DEFAULT_POLL_INTERVAL);
  const [transactions, setTransactions] = useState<SmsTransaction[]>([]);
  const [blockList, setBlockListState] = useState<string[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  // Stable ref so BackgroundFetch's onComplete callback can refresh the
  // SMS transactions list after a background poll completes.
  const bgCompleteRef = useRef<(() => Promise<void>) | undefined>(undefined);
  bgCompleteRef.current = async () => {
    const freshTxs = await loadSmsTransactions();
    setTransactions(freshTxs);
    setLastCheckedAt(Date.now());
  };

  // Stable ref so configureBackgroundFetch (module-level) can call the latest
  // pollOnce as the foreground task without stale closure issues.
  const pollOnceRef = useRef<() => Promise<void>>(async () => {});

  // Always-current ref so async callbacks see latest state without stale closures
  const latestRef = useRef({ goals, entries, keywords, priority, blockList });
  useEffect(() => {
    latestRef.current = { goals, entries, keywords, priority, blockList };
  }, [goals, entries, keywords, priority, blockList]);

  // ── Load persisted data ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [kwRaw, prRaw, txRaw, bl, piRaw, permRaw] = await Promise.all([
        AsyncStorage.getItem(KEYWORDS_KEY),
        AsyncStorage.getItem(PRIORITY_KEY),
        loadSmsTransactions(),
        loadBlockList(),
        AsyncStorage.getItem(POLL_INTERVAL_KEY),
        AsyncStorage.getItem(PERMISSION_KEY),
      ]);
      if (kwRaw) setKeywords(JSON.parse(kwRaw));
      if (prRaw) setPriorityState(prRaw as AllocationPriority);
      if (piRaw) setPollIntervalState(Number(piRaw) as PollInterval);
      // Restore cached permission so the UI renders correctly immediately
      if (permRaw === 'true') setHasPermission(true);
      setTransactions(txRaw);
      setBlockListState(bl);

      // Then verify the live OS state (user may have revoked it from Settings)
      const liveGranted = await checkSmsPermission();
      setHasPermission(liveGranted);
      await AsyncStorage.setItem(PERMISSION_KEY, String(liveGranted));

      // (Re-)configure BackgroundFetch to the persisted interval.
      // foregroundTask = pollOnce (React path) so GoalsContext stays in sync.
      if (liveGranted) {
        const intervalMs = piRaw ? Number(piRaw) : DEFAULT_POLL_INTERVAL;
        await configureBackgroundFetch(
          intervalMs,
          async () => { await pollOnceRef.current(); },
          async () => { await bgCompleteRef.current?.(); },
        );
      }
    })();
  }, []);

  // ── Refresh state from AsyncStorage when app comes to foreground ────────────
  // Headless/background tasks write directly to AsyncStorage. When the user
  // opens the app, reload transactions and update lastCheckedAt from the BG key.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const freshTxs = await loadSmsTransactions();
        setTransactions(freshTxs);
        const bgKey = await AsyncStorage.getItem('@finvista_bg_last_checked');
        if (bgKey) {
          const bgTs = Number(bgKey);
          setLastCheckedAt(prev => (prev === null || bgTs > prev ? bgTs : prev));
        }
      }
    });
    return () => sub.remove();
  }, []);

  // ── Oldest goal cutoff ─────────────────────────────────────────────────────
  // Returns the Unix-ms timestamp of the earliest goal createdAt, or 0 if none.
  const getOldestGoalDate = (): number => {
    const { goals: g } = latestRef.current;
    if (!g.length) return 0;
    return Math.min(...g.map(goal => new Date(goal.createdAt).getTime()));
  };

  // ── Auto-polling (only checks SMS newer than last check) ─────────────────
  useEffect(() => {
    if (!hasPermission) return;

    const poll = async () => {
      try {
        await pollOnceRef.current();
      } catch {
        // silently swallow poll errors
      }
    };

    // Run immediately so the very first check doesn't wait a full interval
    poll();
    const id = setInterval(poll, pollInterval);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, pollInterval]);

  // ── Core: process a single parsed message ────────────────────────────────
  // `runningEntries` is the live accumulated entries for the current scan batch.
  // Each SMS in a loop passes the list updated by the previous SMS so that
  // allocateToGoals always sees the correct running balance (instead of stale
  // ReactRef values that haven't re-rendered yet).
  const processParsedMessage = useCallback(
    async (
      parsed: {
        fingerprint: string;
        sender: string;
        smsDate: number;
        type: 'deposit' | 'withdrawal';
        amount: number;
        rawMessage: string;
      },
      runningEntries: SavingsEntry[],
    ): Promise<SavingsEntry[]> => {
      const { goals: g, priority: p } = latestRef.current;

      // Allocate using the live running balance for this scan session
      const allocations: GoalAllocation[] = allocateToGoals(g, runningEntries, parsed.amount, parsed.type, p);

      // Generate the transaction ID first so entries can reference it
      const txId = generateId();

      // Build new entries locally (for the running accumulator) AND persist via addEntry
      // alloc.amount is already correctly signed by allocateToGoals:
      //   deposit  → positive (e.g. +500)
      //   withdrawal → negative (e.g. -500)
      const newLocalEntries: SavingsEntry[] = [];
      for (const alloc of allocations) {
        if (alloc.amount === 0) continue;
        const entryId = generateId();
        const entryDate = new Date().toISOString();
        newLocalEntries.push({
          id: entryId,
          goalId: alloc.goalId,
          amount: alloc.amount,
          date: entryDate,
          createdAt: entryDate,
          smsTransactionId: txId,
        });
        addEntry({
          goalId: alloc.goalId,
          amount: alloc.amount,
          date: entryDate,
          smsTransactionId: txId,
        });
      }

      // Updated accumulator for the caller
      const updatedEntries = [...runningEntries, ...newLocalEntries];

      // Fire milestone notifications for each affected goal
      for (const alloc of allocations) {
        if (alloc.amount === 0) continue;
        const goal = g.find(go => go.id === alloc.goalId);
        if (!goal) continue;
        const oldTotal = runningEntries
          .filter(en => en.goalId === alloc.goalId)
          .reduce((sum, en) => sum + en.amount, 0);
        await checkAndFireMilestones(
          goal.id,
          goal.name,
          oldTotal,
          oldTotal + alloc.amount,
          goal.targetAmount,
        );
      }

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
      setTransactions(prev => [tx, ...prev]);

      return updatedEntries;
    },
    [addEntry],
  );

  // ── Internal: poll for new SMS (auto-polling only) ─────────────────────────
  // Reads the full inbox but rely on isAlreadyProcessed for dedup — same logic
  // as scanInbox but silent (no isScanning spinner).
  const pollOnce = useCallback(async (): Promise<void> => {
    // Nothing to allocate to — skip the inbox read entirely
    if (!latestRef.current.goals.length) return;
    try {
      // Sort oldest-first so deposit SMS are processed before any later withdrawal
      // that hits the same batch — withdrawal needs a non-zero balance to deduct from.
      const smsList = (await readInboxSms(100)).sort((a, b) => a.date - b.date);
      const { keywords: kw, blockList: bl } = latestRef.current;
      const oldestGoalDate = getOldestGoalDate();
      let runningEntries: SavingsEntry[] = [...latestRef.current.entries];
      for (const raw of smsList) {
        if (oldestGoalDate > 0 && raw.date < oldestGoalDate) continue;
        if (isSenderBlocked(raw.address, bl)) continue;
        const parsed = parseSms(raw, kw);
        if (!parsed) continue;
        if (await isAlreadyProcessed(parsed.fingerprint)) continue;
        runningEntries = await processParsedMessage(parsed, runningEntries);
      }
    } finally {
      setLastCheckedAt(Date.now());
    }
  }, [processParsedMessage]);

  // Keep ref current so the polling interval always calls the latest closure.
  pollOnceRef.current = pollOnce;

  // ── Inbox Scan (manual) ───────────────────────────────────────────────────
  const scanInbox = useCallback(async (): Promise<{ processed: number; skipped: number }> => {
    // Nothing to allocate to — bail out immediately
    if (!latestRef.current.goals.length) return { processed: 0, skipped: 0 };
    setIsScanning(true);
    let processed = 0;
    let skipped = 0;
    try {
      // Sort oldest-first so deposit SMS are processed before any later withdrawal
      // that hits the same batch — withdrawal needs a non-zero balance to deduct from.
      const smsList = (await readInboxSms(100)).sort((a, b) => a.date - b.date);
      const { keywords: kw, blockList: bl } = latestRef.current;
      const oldestGoalDate = getOldestGoalDate();
      // Start with the current known entries so each SMS sees the accumulated balance
      let runningEntries: SavingsEntry[] = [...latestRef.current.entries];

      for (const raw of smsList) {
        if (oldestGoalDate > 0 && raw.date < oldestGoalDate) { skipped++; continue; }
        if (isSenderBlocked(raw.address, bl)) { skipped++; continue; }
        const parsed = parseSms(raw, kw);
        if (!parsed) { skipped++; continue; }
        if (await isAlreadyProcessed(parsed.fingerprint)) { skipped++; continue; }
        runningEntries = await processParsedMessage(parsed, runningEntries);
        processed++;
      }
    } finally {
      setIsScanning(false);
      setLastCheckedAt(Date.now());
    }
    return { processed, skipped };
  }, [processParsedMessage]);

  // ── Permission ────────────────────────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<SmsPermissionStatus> => {
    const status = await requestSmsPermission();
    const granted = status === 'granted';
    setHasPermission(granted);
    await AsyncStorage.setItem(PERMISSION_KEY, String(granted));
    if (granted) {
      await configureBackgroundFetch(
        pollInterval,
        async () => { await pollOnceRef.current(); },
        async () => { await bgCompleteRef.current?.(); },
      );
    }
    return status;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollInterval]);

  // ── Transaction delete ────────────────────────────────────────────────────
  const deleteTransaction = useCallback(async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) await unmarkAsProcessed(tx.smsFingerprint);
    await deleteSmsTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  // ── Clear history ─────────────────────────────────────────────────────────
  const clearHistory = useCallback(async () => {
    await clearSmsTransactions();
    setTransactions([]);
  }, []);

  const reloadTransactions = useCallback(async () => {
    const freshTxs = await loadSmsTransactions();
    setTransactions(freshTxs);
  }, []);

  // ── Block List CRUD ───────────────────────────────────────────────────────
  const addToBlockList = useCallback(async (sender: string) => {
    const trimmed = sender.trim();
    if (!trimmed) return;

    // 1. Find all transactions from this sender
    const senderTxs = transactions.filter(
      t => t.sender?.toLowerCase() === trimmed.toLowerCase(),
    );

    // 2. Reverse their goal entries and remove them from storage
    for (const tx of senderTxs) {
      deleteEntriesByTransactionId(tx.id);
      await deleteSmsTransaction(tx.id);
      await unmarkAsProcessed(tx.smsFingerprint);
    }
    if (senderTxs.length > 0) {
      setTransactions(prev =>
        prev.filter(t => t.sender?.toLowerCase() !== trimmed.toLowerCase()),
      );
    }

    // 3. Add sender to block list
    setBlockListState(prev => {
      if (prev.some(s => s.toLowerCase() === trimmed.toLowerCase())) return prev;
      const next = [...prev, trimmed];
      saveBlockList(next);
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, deleteEntriesByTransactionId]);

  const removeFromBlockList = useCallback(async (sender: string) => {
    setBlockListState(prev => {
      const next = prev.filter(s => s.toLowerCase() !== sender.toLowerCase());
      saveBlockList(next);
      return next;
    });
  }, []);

  // ── Keyword CRUD ──────────────────────────────────────────────────────────
  const addKeyword = useCallback(
    async (kind: 'deposit' | 'withdrawal', word: string) => {
      const trimmed = word.trim().toLowerCase();
      if (!trimmed) return;
      setKeywords(prev => {
        if (prev[kind].includes(trimmed)) return prev;
        const next = { ...prev, [kind]: [...prev[kind], trimmed] };
        AsyncStorage.setItem(KEYWORDS_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const updateKeyword = useCallback(
    async (kind: 'deposit' | 'withdrawal', oldWord: string, newWord: string) => {
      const trimmed = newWord.trim().toLowerCase();
      if (!trimmed) return;
      setKeywords(prev => {
        const next = {
          ...prev,
          [kind]: prev[kind].map(w => (w === oldWord ? trimmed : w)),
        };
        AsyncStorage.setItem(KEYWORDS_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const deleteKeyword = useCallback(
    async (kind: 'deposit' | 'withdrawal', word: string) => {
      setKeywords(prev => {
        const next = { ...prev, [kind]: prev[kind].filter(w => w !== word) };
        AsyncStorage.setItem(KEYWORDS_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const resetKeywords = useCallback(async (kind: 'deposit' | 'withdrawal') => {
    setKeywords(prev => {
      const defaults =
        kind === 'deposit' ? DEFAULT_DEPOSIT_KEYWORDS : DEFAULT_WITHDRAWAL_KEYWORDS;
      const next = { ...prev, [kind]: defaults };
      AsyncStorage.setItem(KEYWORDS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Priority CRUD ─────────────────────────────────────────────────────────
  const setPriority = useCallback(async (p: AllocationPriority) => {
    setPriorityState(p);
    await AsyncStorage.setItem(PRIORITY_KEY, p);
  }, []);

  const setPollInterval = useCallback(async (ms: PollInterval) => {
    setPollIntervalState(ms);
    await AsyncStorage.setItem(POLL_INTERVAL_KEY, String(ms));
    // Reconfigure BackgroundFetch with the new interval immediately
    await configureBackgroundFetch(
      ms,
      async () => { await pollOnceRef.current(); },
      async () => { await bgCompleteRef.current?.(); },
    );
  }, []);

  return (
    <SmsContext.Provider
      value={{
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
        deleteTransaction,
        clearHistory,
        reloadTransactions,
        blockList,
        addToBlockList,
        removeFromBlockList,
        hasPermission,
        requestPermission,
        scanInbox,
        isScanning,
        lastCheckedAt,
      }}>
      {children}
    </SmsContext.Provider>
  );
}

export const useSms = () => useContext(SmsContext);
