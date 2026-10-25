import React, { useState } from 'react';
import { UdhaarAccount, UdhaarTransaction } from '../../types';
import { formatPaise } from '../../utils/currency';
import { formatDateIST, getTodayIST } from '../../utils/date';
import { X, Printer, Share2, Check, Download } from 'lucide-react';

interface Props {
  account: UdhaarAccount | null;
  transactions: UdhaarTransaction[];
  groupName: string;
  onClose: () => void;
}

export const UdhaarStatementModal: React.FC<Props> = ({
  account,
  transactions,
  groupName,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!account) return null;

  // Calculate totals
  let totalGave = 0;
  let totalGot = 0;

  // Chronological sort
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  let runningBalance = account.opening_balance_paise;

  const ledgerRows = sorted.map((tx) => {
    if (tx.transaction_type === 'gave') {
      totalGave += tx.amount_paise;
      runningBalance += tx.amount_paise;
    } else {
      totalGot += tx.amount_paise;
      runningBalance -= tx.amount_paise;
    }

    return {
      tx,
      balanceAfter: runningBalance,
    };
  });

  const netBalance = account.opening_balance_paise + totalGave - totalGot;

  const handlePrint = () => {
    window.print();
  };

  const handleShareSummary = () => {
    const text = `Dear ${account.name},\nThis is a friendly statement from ${groupName} (FamilyKhata):\n- Total Given: ${formatPaise(
      totalGave
    )}\n- Total Received: ${formatPaise(totalGot)}\n- Current Outstanding: ${formatPaise(
      netBalance
    )} (${netBalance > 0 ? "You'll Pay" : "You'll Receive"})\n\nGenerated on: ${getTodayIST()}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 print:shadow-none print:border-none print:max-h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              📄
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Khata Statement: {account.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official credit &amp; debit ledger statement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Statement Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1" id="printable-statement">
          {/* Header Banner */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-xl font-extrabold text-blue-700 dark:text-blue-400">
                {groupName} · FamilyKhata
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Statement Date: {formatDateIST(getTodayIST())}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-semibold">Account of</span>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">{account.name}</div>
              <div className="text-xs text-slate-500 font-mono">{account.phone || 'No phone recorded'}</div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Total Gave (Lent)
              </span>
              <span className="text-base font-bold font-mono-numbers text-rose-600 dark:text-rose-400">
                {formatPaise(totalGave)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Total Got (Received)
              </span>
              <span className="text-base font-bold font-mono-numbers text-emerald-600 dark:text-emerald-400">
                {formatPaise(totalGot)}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                netBalance > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : netBalance < 0
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <span className="text-[11px] font-medium block">
                {netBalance > 0 ? "You'll Get" : netBalance < 0 ? "You'll Give" : 'Settled Balance'}
              </span>
              <span className="text-base font-bold font-mono-numbers">
                {formatPaise(Math.abs(netBalance))}
              </span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 px-2 font-semibold">Date</th>
                  <th className="py-2 px-2 font-semibold">Description / Mode</th>
                  <th className="py-2 px-2 font-semibold text-right text-rose-600 dark:text-rose-400">
                    You Gave (₹)
                  </th>
                  <th className="py-2 px-2 font-semibold text-right text-emerald-600 dark:text-emerald-400">
                    You Got (₹)
                  </th>
                  <th className="py-2 px-2 font-semibold text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {account.opening_balance_paise !== 0 && (
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td className="py-2 px-2 text-slate-500 font-mono">
                      {formatDateIST(account.created_at)}
                    </td>
                    <td className="py-2 px-2 italic text-slate-600 dark:text-slate-400">
                      Opening Balance
                    </td>
                    <td className="py-2 px-2 text-right font-mono-numbers">
                      {account.opening_balance_paise > 0
                        ? formatPaise(account.opening_balance_paise)
                        : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono-numbers">
                      {account.opening_balance_paise < 0
                        ? formatPaise(Math.abs(account.opening_balance_paise))
                        : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono-numbers font-bold">
                      {formatPaise(account.opening_balance_paise)}
                    </td>
                  </tr>
                )}

                {ledgerRows.map(({ tx, balanceAfter }) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-2 text-slate-600 dark:text-slate-400 font-mono">
                      {formatDateIST(tx.transaction_date)}
                    </td>
                    <td className="py-2 px-2">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {tx.description || (tx.transaction_type === 'gave' ? 'Money Given' : 'Money Received')}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">
                        {tx.payment_mode}
                        {tx.due_date && ` · Due: ${formatDateIST(tx.due_date)}`}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono-numbers font-semibold text-rose-600 dark:text-rose-400">
                      {tx.transaction_type === 'gave' ? formatPaise(tx.amount_paise) : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono-numbers font-semibold text-emerald-600 dark:text-emerald-400">
                      {tx.transaction_type === 'got' ? formatPaise(tx.amount_paise) : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono-numbers font-bold text-slate-900 dark:text-slate-100">
                      {formatPaise(balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 print:hidden">
          <button
            onClick={handleShareSummary}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Summary Copied!' : 'Copy Summary Text'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
