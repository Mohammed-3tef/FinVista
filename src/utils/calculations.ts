export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  startDate: string; // ISO string
  deadline: string; // ISO string
  createdAt: string;
  icon?: string; // FontAwesome icon name, e.g. 'faBullseye'
  isFavorite?: boolean;
  notes?: string;
}

export interface SavingsEntry {
  id: string;
  goalId: string;
  amount: number;
  date: string; // ISO string
  createdAt: string;
  /** ID of the SmsTransaction that created this entry (if any) */
  smsTransactionId?: string;
}

export function getTotalSaved(entries: SavingsEntry[], goalId: string): number {
  return entries
    .filter(e => e.goalId === goalId)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getProgress(totalSaved: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0;
  return Math.max(0, Math.min((totalSaved / targetAmount) * 100, 100));
}

export function getDaysLeft(deadline: string): number {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getMonthlySavingsNeeded(remaining: number, deadline: string): number {
  const days = getDaysLeft(deadline);
  const months = days / 30;
  if (months <= 0) return remaining;
  return remaining / months;
}

export function getWeeklySavingsNeeded(remaining: number, deadline: string): number {
  const days = getDaysLeft(deadline);
  const weeks = days / 7;
  if (weeks <= 0) return remaining;
  return remaining / weeks;
}

export function getDailySavingsNeeded(remaining: number, deadline: string): number {
  const days = getDaysLeft(deadline);
  if (days <= 0) return remaining;
  return remaining / days;
}

export function formatCurrency(amount: number, currency = 'EGP'): string {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
