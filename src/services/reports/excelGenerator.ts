import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { AnalyticsReportData, GoalSavingsHistoryReportData } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string): string {
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

async function writeAndShare(wb: XLSX.WorkBook, fileName: string, title: string): Promise<void> {
  const wbout: string = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const filePath = `${RNFS.CachesDirectoryPath}/${fileName}.xlsx`;
  await RNFS.writeFile(filePath, wbout, 'base64');
  await Share.open({
    url: `file://${filePath}`,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    title,
    failOnCancel: false,
  });
}

// ─── Analytics Excel Export ──────────────────────────────────────────────────

export async function exportAnalyticsExcel(data: AnalyticsReportData): Promise<void> {
  const wb = XLSX.utils.book_new();

  // Sheet 1 – Summary
  const summaryRows = [
    ['FinVista Analytics Report'],
    ['Generated At', data.generatedAt],
    [],
    ['Metric', 'Value'],
    ['Total Saved', fmt(data.totalSaved, data.currency)],
    ['Total Deposits', fmt(data.totalDeposits, data.currency)],
    ['Total Withdrawals', fmt(data.totalWithdrawals, data.currency)],
    ['Deposit Entries', data.depositCount],
    ['Avg per Deposit', fmt(data.avgPerDeposit, data.currency)],
    ['Total Goals', data.goals.length],
    ['Favourite Goals', data.favoriteCount],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);

  // Column widths
  wsSummary['!cols'] = [{ wch: 24 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Sheet 2 – Goal Breakdown
  const goalHeader = ['Goal Name', 'Target Amount', 'Saved Amount', 'Progress %', 'Deadline'];
  const goalRows = data.goals.map(g => [
    g.name,
    fmt(g.targetAmount, g.currency),
    fmt(g.saved, g.currency),
    `${Math.round(g.progress)}%`,
    g.deadline,
  ]);
  const wsGoals = XLSX.utils.aoa_to_sheet([goalHeader, ...goalRows]);
  wsGoals['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsGoals, 'Goals');

  await writeAndShare(wb, `FinVista_Analytics_${Date.now()}`, 'FinVista Analytics Report');
}

// ─── Goal Savings History Excel Export ───────────────────────────────────────

export async function exportGoalSavingsHistoryExcel(data: GoalSavingsHistoryReportData): Promise<void> {
  const wb = XLSX.utils.book_new();

  const header = ['Date', 'Type', 'Amount', 'Notes'];
  const rows = data.entries.map(e => [
    e.date,
    e.type === 'deposit' ? 'Deposit' : 'Withdrawal',
    fmt(Math.abs(e.amount), e.currency),
    e.note ?? '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Savings History');

  const safeName = data.goalName.replace(/[^a-z0-9]/gi, '_');
  await writeAndShare(
    wb,
    `FinVista_${safeName}_Savings_${Date.now()}`,
    `${data.goalName} — Savings History`,
  );
}
