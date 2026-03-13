import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { AnalyticsReportData, GoalSavingsHistoryReportData } from './types';
import { strings } from '../../constants/strings';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(',')),
  ];
  return lines.join('\n');
}

function fmt(amount: number, currency: string): string {
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

async function writeAndShare(csv: string, fileName: string, title: string): Promise<void> {
  const filePath = `${RNFS.CachesDirectoryPath}/${fileName}.csv`;
  await RNFS.writeFile(filePath, csv, 'utf8');
  await Share.open({
    url: `file://${filePath}`,
    type: 'text/csv',
    title,
    failOnCancel: false,
  });
}

// ─── Analytics CSV Export ─────────────────────────────────────────────────────

export async function exportAnalyticsCsv(data: AnalyticsReportData): Promise<void> {
  const headers = ['Goal Name', 'Target Amount', 'Saved Amount', 'Progress %', 'Deadline'];
  const rows = data.goals.map(g => [
    g.name,
    fmt(g.targetAmount, g.currency),
    fmt(g.saved, g.currency),
    `${Math.round(g.progress)}%`,
    g.deadline,
  ]);

  // Prepend metadata rows
  const meta = [
    `${strings.en.appName} Analytics Report`,
    `Generated At,${data.generatedAt}`,
    `Total Saved,${fmt(data.totalSaved, data.currency)}`,
    `Total Deposits,${fmt(data.totalDeposits, data.currency)}`,
    `Total Withdrawals,${fmt(data.totalWithdrawals, data.currency)}`,
    `Deposit Entries,${data.depositCount}`,
    `Avg per Deposit,${fmt(data.avgPerDeposit, data.currency)}`,
    `Favourite Goals,${data.favoriteCount}`,
    '',
    'Goal Breakdown',
    buildCsv(headers, rows),
  ];

  await writeAndShare(meta.join('\n'), `${strings.en.appName}_Analytics_${Date.now()}`, `${strings.en.appName} Analytics CSV`);
}

// ─── Goal Savings History CSV Export ─────────────────────────────────────────

export async function exportGoalSavingsHistoryCsv(data: GoalSavingsHistoryReportData): Promise<void> {
  const headers = ['Date', 'Type', 'Amount', 'Notes'];
  const rows = data.entries.map(e => [
    e.date,
    e.type === 'deposit' ? 'Deposit' : 'Withdrawal',
    fmt(Math.abs(e.amount), e.currency),
    e.note ?? '',
  ]);

  const csv = buildCsv(headers, rows);
  const safeName = data.goalName.replace(/[^a-z0-9]/gi, '_');
  await writeAndShare(csv, `${strings.en.appName}_${safeName}_Savings_${Date.now()}`, `${data.goalName} — Savings CSV`);
}
