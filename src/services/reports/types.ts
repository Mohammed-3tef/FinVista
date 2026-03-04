// ─── Report Data Models ──────────────────────────────────────────────────────

export interface GoalReportRow {
  name: string;
  targetAmount: number;
  saved: number;
  progress: number; // 0–100
  deadline: string;
  currency: string;
}

export interface SavingsEntryRow {
  date: string;
  amount: number;
  note?: string;
  type: 'deposit' | 'withdrawal';
  currency: string;
}

export interface AnalyticsReportData {
  generatedAt: string;
  totalSaved: number;
  totalDeposits: number;
  totalWithdrawals: number;
  depositCount: number;
  avgPerDeposit: number;
  currency: string;
  goals: GoalReportRow[];
}

export interface GoalProgressReportData {
  generatedAt: string;
  goalName: string;
  targetAmount: number;
  savedAmount: number;
  progressPercent: number;
  currency: string;
}

export interface GoalSavingsHistoryReportData {
  goalName: string;
  currency: string;
  entries: SavingsEntryRow[];
}
