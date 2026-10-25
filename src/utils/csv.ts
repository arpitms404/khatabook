/**
 * RFC 4180 Compliant CSV Export Utility
 */

import { Expense, GroupMember } from '../types';
import { formatPaise } from './currency';
import { formatDateIST } from './date';

function escapeCsvCell(cell: string | number | undefined | null): string {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function exportExpensesToCsv(
  expenses: Expense[],
  members: GroupMember[],
  groupName: string,
  periodName: string
): void {
  const memberNameMap = new Map<string, string>();
  members.forEach((m) => {
    memberNameMap.set(m.user_id, m.profile?.full_name || 'Member');
  });

  const headers = [
    'Date (IST)',
    'Description',
    'Category',
    'Type',
    'Amount (₹)',
    'Amount (Paise)',
    'Paid By',
    'Created By',
    'Split Details',
    'Notes',
  ];

  const rows: string[] = [headers.map(escapeCsvCell).join(',')];

  let totalPaise = 0;

  expenses.forEach((expense) => {
    if (expense.deleted_at) return;
    totalPaise += expense.amount_paise;

    const paidByName = memberNameMap.get(expense.paid_by) || expense.paid_by;
    const createdByName = memberNameMap.get(expense.created_by) || expense.created_by;

    let splitSummary = 'N/A';
    if (expense.expense_type === 'shared' && expense.splits) {
      splitSummary = expense.splits
        .map((s) => `${memberNameMap.get(s.member_id) || s.member_id}: ${formatPaise(s.share_amount_paise)}`)
        .join('; ');
    }

    const row = [
      formatDateIST(expense.expense_date),
      expense.description,
      expense.category,
      expense.expense_type.toUpperCase(),
      (expense.amount_paise / 100).toFixed(2),
      expense.amount_paise,
      paidByName,
      createdByName,
      splitSummary,
      expense.notes || '',
    ];

    rows.push(row.map(escapeCsvCell).join(','));
  });

  // Summary Row
  const summaryRow = [
    'TOTAL',
    `Total Transactions: ${expenses.filter((e) => !e.deleted_at).length}`,
    '',
    '',
    (totalPaise / 100).toFixed(2),
    totalPaise,
    '',
    '',
    '',
    `Exported from ${groupName} - ${periodName}`,
  ];
  rows.push(summaryRow.map(escapeCsvCell).join(','));

  const csvContent = rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `familykhata_${groupName.toLowerCase().replace(/\s+/g, '_')}_${periodName.toLowerCase().replace(/\s+/g, '_')}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
