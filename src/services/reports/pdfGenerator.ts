import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { AnalyticsReportData, GoalProgressReportData } from './types';
import { APP_ICON_BASE64 } from './appIconBase64';
import { strings } from '../../constants/strings';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string): string {
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

const BASE_STYLES = `
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; background: #f8faff; color: #1A2744; font-size: 13px; }
    .page { padding: 32px 36px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 2px solid #459c6b; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand img { width: 36px; height: 36px; border-radius: 8px; }
    .brand-name { font-size: 22px; font-weight: 800; color: #1A2744; letter-spacing: -0.5px; }
    .brand-name span { color: #459c6b; }
    .meta { font-size: 11px; color: #6B7A99; text-align: right; }
    h2 { font-size: 15px; font-weight: 700; color: #1A2744; margin-bottom: 14px; margin-top: 24px; }
    .stat-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
    .stat-card { flex: 1 1 calc(33% - 12px); background: #fff; border-radius: 12px; padding: 14px 16px; border: 1px solid #E8EDF8; }
    .stat-label { font-size: 10px; color: #6B7A99; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .stat-value { font-size: 16px; font-weight: 800; color: #1A2744; }
    .stat-value.green { color: #10B981; }
    .stat-value.red { color: #EF4444; }
    .stat-value.accent { color: #F0B429; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #E8EDF8; }
    thead tr { background: #1A2744; color: #fff; }
    thead th { padding: 10px 14px; font-size: 11px; font-weight: 700; text-align: left; text-transform: uppercase; letter-spacing: 0.4px; }
    tbody tr:nth-child(even) { background: #f8faff; }
    tbody td { padding: 10px 14px; font-size: 12px; border-bottom: 1px solid #E8EDF8; }
    .progress-bar-wrap { background: #E8EDF8; border-radius: 999px; height: 7px; width: 100%; }
    .progress-bar-fill { background: #F0B429; border-radius: 999px; height: 7px; }
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #E8EDF8; font-size: 10px; color: #A0AABF; text-align: center; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
    .pill-green { background: #D1FAE5; color: #065F46; }
    .pill-yellow { background: #FEF3C7; color: #92400E; }
    .pill-blue { background: #DBEAFE; color: #1E40AF; }
    .progress-summary { background: #fff; border-radius: 14px; padding: 24px; border: 1px solid #E8EDF8; text-align: center; }
    .progress-big { font-size: 48px; font-weight: 800; color: #F0B429; }
    .progress-label { font-size: 13px; color: #6B7A99; margin-top: 6px; }
    .amount-row { display: flex; justify-content: space-around; margin-top: 20px; }
    .amount-item { text-align: center; }
    .amount-value { font-size: 20px; font-weight: 800; color: #1A2744; }
    .amount-label { font-size: 11px; color: #6B7A99; margin-top: 4px; }
    .progress-bar-big-wrap { background: #E8EDF8; border-radius: 999px; height: 12px; width: 100%; margin-top: 20px; }
    .progress-bar-big-fill { border-radius: 999px; height: 12px; }
  </style>
`;

// ─── Analytics Full Report PDF ───────────────────────────────────────────────

function buildAnalyticsHtml(data: AnalyticsReportData): string {
  const goalRows = data.goals
    .map(g => {
      const pct = Math.round(g.progress);
      const pillClass = pct >= 100 ? 'pill-green' : pct >= 60 ? 'pill-yellow' : 'pill-blue';
      return `
        <tr>
          <td>${g.name}</td>
          <td>${fmt(g.targetAmount, g.currency)}</td>
          <td class="${g.saved >= 0 ? 'stat-value green' : 'stat-value red'}">${fmt(g.saved, g.currency)}</td>
          <td>
            <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
          </td>
          <td><span class="pill ${pillClass}">${pct}%</span></td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${BASE_STYLES}</head><body>
    <div class="page">
      <div class="header">
        <div class="brand">
            <img src="${APP_ICON_BASE64}" />
            <div class="brand-info">
                <p class="brand-name">Hawesh<span>ly</span></p>
                <p class="meta">${strings.en.tagline}</p>
            </div>
        </div>
      </div>

      <h2>Summary</h2>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Total Saved</div><div class="stat-value green">${fmt(data.totalSaved, data.currency)}</div></div>
        <div class="stat-card"><div class="stat-label">Total Goals</div><div class="stat-value">${data.goals.length}</div></div>
        <div class="stat-card"><div class="stat-label">Total Deposits</div><div class="stat-value green">${fmt(data.totalDeposits, data.currency)}</div></div>
        <div class="stat-card"><div class="stat-label">Total Withdrawals</div><div class="stat-value red">${fmt(data.totalWithdrawals, data.currency)}</div></div>
        <div class="stat-card"><div class="stat-label">Deposit Entries</div><div class="stat-value accent">${data.depositCount}</div></div>
        <div class="stat-card"><div class="stat-label">Avg per Deposit</div><div class="stat-value">${fmt(data.avgPerDeposit, data.currency)}</div></div>
        <div class="stat-card"><div class="stat-label">Favourite Goals</div><div class="stat-value accent">${data.favoriteCount}</div></div>
      </div>

      <h2>Goal Breakdown</h2>
      <table>
        <thead><tr><th>Goal</th><th>Target</th><th>Saved</th><th>Progress</th><th>%</th></tr></thead>
        <tbody>${goalRows}</tbody>
      </table>

      <div class="footer">Generated by ${strings.en.appName} · ${data.generatedAt}</div>
    </div>
  </body></html>`;
}

// ─── Goal Progress PDF ───────────────────────────────────────────────────────

function buildGoalProgressHtml(data: GoalProgressReportData): string {
  const pct = Math.round(data.progressPercent);
  const color = pct >= 100 ? '#10B981' : pct >= 60 ? '#F0B429' : '#3B82F6';
  const remaining = Math.max(0, data.targetAmount - data.savedAmount);

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${BASE_STYLES}</head><body>
    <div class="page">
      <div class="header">
        <div class="brand">
            <img src="${APP_ICON_BASE64}" />
            <div class="brand-info">
                <p class="brand-name">Hawesh<span>ly</span></p>
                <p class="meta">${strings.en.tagline}</p>
            </div>
        </div>
      </div>

      <h2>${data.goalName}</h2>
      <div class="progress-summary">
        <div class="progress-big" style="color:${color}">${pct}%</div>
        <div class="progress-label">of target reached</div>
        <div class="progress-bar-big-wrap">
          <div class="progress-bar-big-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="amount-row">
          <div class="amount-item">
            <div class="amount-value" style="color: #10B981">${fmt(data.savedAmount, data.currency)}</div>
            <div class="amount-label">Saved</div>
          </div>
          <div class="amount-item">
            <div class="amount-value">${fmt(data.targetAmount, data.currency)}</div>
            <div class="amount-label">Target</div>
          </div>
          <div class="amount-item">
            <div class="amount-value" style="color:#EF4444">${fmt(remaining, data.currency)}</div>
            <div class="amount-label">Remaining</div>
          </div>
        </div>
      </div>

      <div class="footer">Generated by ${strings.en.appName} · ${data.generatedAt}</div>
    </div>
  </body></html>`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function exportAnalyticsPDF(data: AnalyticsReportData): Promise<void> {
  const html = buildAnalyticsHtml(data);
  const result = await generatePDF({
    html,
    fileName: `${strings.en.appName}_Analytics_${Date.now()}`,
  });

  if (!result.filePath) throw new Error('PDF generation failed');

  await Share.open({
    url: `file://${result.filePath}`,
    type: 'application/pdf',
    title: `${strings.en.appName} Analytics Report`,
    failOnCancel: false,
  });
}

export async function exportGoalProgressPDF(data: GoalProgressReportData): Promise<void> {
  const html = buildGoalProgressHtml(data);
  const safeName = data.goalName.replace(/[^a-z0-9]/gi, '_');
  const result = await generatePDF({
    html,
    fileName: `${strings.en.appName}_Goal_${safeName}_${Date.now()}`,
  });

  if (!result.filePath) throw new Error('PDF generation failed');

  await Share.open({
    url: `file://${result.filePath}`,
    type: 'application/pdf',
    title: `${data.goalName} — Progress Report`,
    failOnCancel: false,
  });
}
