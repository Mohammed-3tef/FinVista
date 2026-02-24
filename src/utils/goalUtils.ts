import { Goal, GoalStats } from '../constants/types';

export const calculateGoalStats = (goal: Goal): GoalStats => {
  const totalSaved = goal.savings.reduce((sum, s) => sum + s.amount, 0);
  const remaining = Math.max(0, goal.targetAmount - totalSaved);
  const percentage = Math.min(100, (totalSaved / goal.targetAmount) * 100);
  const isCompleted = totalSaved >= goal.targetAmount;

  const now = new Date();
  const target = new Date(goal.targetDate);
  const start = new Date(goal.startDate);

  const daysLeft = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = totalDays - daysLeft;

  const dailyNeeded = daysLeft > 0 ? remaining / daysLeft : 0;
  const weeklyNeeded = daysLeft > 0 ? (remaining / daysLeft) * 7 : 0;
  const monthlyNeeded = daysLeft > 0 ? (remaining / daysLeft) * 30 : 0;

  // On track if we've saved at least as much as we should have by now
  const expectedByNow = (daysElapsed / totalDays) * goal.targetAmount;
  const isOnTrack = isCompleted || totalSaved >= expectedByNow;

  return {
    totalSaved,
    remaining,
    percentage,
    daysLeft,
    dailyNeeded,
    weeklyNeeded,
    monthlyNeeded,
    isCompleted,
    isOnTrack,
  };
};

export const formatAmount = (amount: number, currency: string = 'EGP'): string => {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M ${currency}`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K ${currency}`;
  }
  return `${amount.toFixed(0)} ${currency}`;
};

export const formatAmountFull = (amount: number, currency: string = 'EGP'): string => {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const generateId = (): string => Date.now().toString() + Math.random().toString(36).slice(2);
