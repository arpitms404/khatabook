import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { UdhaarTransactionType, PaymentMode } from '../../types';
import { parseRupeesToPaise, formatPaise } from '../../utils/currency';
import { getTodayIST } from '../../utils/date';
import { X, ArrowDownLeft, ArrowUpRight, AlertCircle, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedAccountId?: string;
  defaultType?: UdhaarTransactionType;
}

export const AddUdhaarTransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  preselectedAccountId,
  defaultType = 'gave',
}) => {
  const { udhaarAccounts, addUdhaarTransaction } = useStore();

  const [accountId, setAccountId] = useState(preselectedAccountId || (udhaarAccounts[0]?.id || ''));
  const [transactionType, setTransactionType] = useState<UdhaarTransactionType>(defaultType);
  const [rupeesInput, setRupeesInput] = useState('');
  const [transactionDate, setTransactionDate] = useState(getTodayIST());
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const amountPaise = parseRupeesToPaise(rupeesInput);
  const isGave = transactionType === 'gave';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!accountId) {
      setErrorMsg('Please select a person or account.');
      return;
    }

    if (amountPaise <= 0) {
      setErrorMsg('Please enter an amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    const result = await addUdhaarTransaction({
      account_id: accountId,
      transaction_type: transactionType,
      amount_paise: amountPaise,
      transaction_date: transactionDate,
      due_date: dueDate ? dueDate : undefined,
      description: description.trim() || undefined,
      payment_mode: paymentMode,
    });
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to record entry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold leading-tight">Record Udhaar Entry</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Khatabook credit &amp; debit entry with running balance
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Account Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Person / Ledger Account *
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
            >
              <option value="" disabled>Choose account</option>
              {udhaarAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.account_type})
                </option>
              ))}
            </select>
          </div>

          {/* Khatabook Gave vs Got Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setTransactionType('gave')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                isGave
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>You Gave ₹ (Lent)</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('got')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                !isGave
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>You Got ₹ (Received)</span>
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Amount (INR ₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={rupeesInput}
                onChange={(e) => setRupeesInput(e.target.value)}
                required
                className={`w-full pl-8 pr-4 py-2.5 rounded-xl border font-mono-numbers text-xl font-bold bg-white dark:bg-slate-800 ${
                  isGave
                    ? 'border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 focus:ring-rose-500'
                    : 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 focus:ring-emerald-500'
                }`}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
              <span>{isGave ? "You'll Get this back" : 'Reduces outstanding debt'}</span>
              <span className="font-semibold">{formatPaise(amountPaise)}</span>
            </div>
          </div>

          {/* Dates & Payment mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date (IST)
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Due / Return Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs capitalize"
              >
                <option value="upi">UPI / GPay / PhonePe</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer / NEFT</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Bill #
              </label>
              <input
                type="text"
                placeholder="e.g. Festival loan, Grocery balance"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-11 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 ${
                isGave
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {isSubmitting ? (
                <span>Recording...</span>
              ) : (
                <span>{isGave ? 'Save: You Gave ₹' : 'Save: You Got ₹'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
