export interface SavingEntry {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  startDate: string;
  targetDate: string;
  savings: SavingEntry[];
  createdAt: string;
  emoji?: string;
}

export interface GoalStats {
  totalSaved: number;
  remaining: number;
  percentage: number;
  daysLeft: number;
  dailyNeeded: number;
  weeklyNeeded: number;
  monthlyNeeded: number;
  isCompleted: boolean;
  isOnTrack: boolean;
}

export type ReminderFrequency = 'daily' | 'weekly' | 'monthly';

export interface ReminderSettings {
  enabled: boolean;
  frequency: ReminderFrequency;
}

export type ThemeMode = 'light' | 'dark';
export type Language = 'en' | 'ar';

// ─── SMS / Auto-Allocation Types ────────────────────────────────────────────

export type AllocationPriority =
  | 'lowest_target_first'
  | 'highest_target_first'
  | 'oldest_goal_first'
  | 'newest_goal_first'
  | 'nearest_deadline_first';

export interface SmsKeywords {
  deposit: string[];
  withdrawal: string[];
}

export interface GoalAllocation {
  goalId: string;
  goalName: string;
  amount: number;
}

export interface SmsTransaction {
  id: string;
  /** original SMS address + date hash used for dedup */
  smsFingerprint: string;
  sender: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  rawMessage: string;
  processedAt: string;
  /** Unix ms timestamp of the original SMS (for display) */
  smsDate: number;
  allocations: GoalAllocation[];
}

export const DEFAULT_DEPOSIT_KEYWORDS: string[] = [
  'credited',
  'deposited',
  'received',
  'added',
  'credit',
  'deposit',
  'received from',
  'payment received',
  'refund',
];

export const DEFAULT_WITHDRAWAL_KEYWORDS: string[] = [
  'debited',
  'withdrawn',
  'deducted',
  'charged',
  'debit',
  'withdrawal',
  'spend',
  'spent',
  'purchase',
  'paid',
  'sent',
];

export const DEFAULT_ALLOCATION_PRIORITY: AllocationPriority = 'lowest_target_first';

// ─── SMS Poll Interval ───────────────────────────────────────────────────────

/** Interval in milliseconds between automatic inbox polls */
export type PollInterval =
  | 30_000
  | 60_000
  | 120_000
  | 300_000
  | 600_000
  | 900_000
  | 1_800_000
  | 3_600_000;

export const DEFAULT_POLL_INTERVAL: PollInterval = 60_000; // 1 min

export const POLL_INTERVAL_OPTIONS: Array<{ value: PollInterval; label: string }> = [
  { value: 30_000,     label: '30 seconds' },
  { value: 60_000,     label: '1 minute'   },
  { value: 120_000,    label: '2 minutes'  },
  { value: 300_000,    label: '5 minutes'  },
  { value: 600_000,    label: '10 minutes' },
  { value: 900_000,    label: '15 minutes' },
  { value: 1_800_000,  label: '30 minutes' },
  { value: 3_600_000,  label: '1 hour'     },
];

export const ALLOCATION_PRIORITY_OPTIONS: Array<{
  key: AllocationPriority;
  label: string;
  description: string;
}> = [
  {
    key: 'lowest_target_first',
    label: 'Lowest Target First',
    description: 'Fill the smallest goal before moving on',
  },
  {
    key: 'highest_target_first',
    label: 'Highest Target First',
    description: 'Fill the largest goal before moving on',
  },
  {
    key: 'oldest_goal_first',
    label: 'Oldest Goal First',
    description: 'Allocate to the earliest created goal',
  },
  {
    key: 'newest_goal_first',
    label: 'Newest Goal First',
    description: 'Allocate to the most recently created goal',
  },
  {
    key: 'nearest_deadline_first',
    label: 'Nearest Deadline First',
    description: 'Allocate to the goal with the closest deadline',
  },
];
