import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { formatPaise, parseRupeesToPaise } from '../../utils/currency';
import { X, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Avatar } from '../Avatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prefillRecipientId?: string;
  prefillAmountPaise?: number;
}

export const SettleUpModal: React.FC<Props> = ({
  isOpen,
  onClose,
  prefillRecipientId,
  prefillAmountPaise,
}) => {
  const { currentUser, members, recordSettlement, debtPayments } = useStore();

  const [recipientId, setRecipientId] = useState<string>(() => {
    if (prefillRecipientId) return prefillRecipientId;
    // Default to the first member who is not current user
    const other = members.find((m) => m.user_id !== currentUser.id);
    return other ? other.user_id : '';
  });

  const [rupeesInput, setRupeesInput] = useState<string>(() => {
    if (prefillAmountPaise) return (prefillAmountPaise / 100).toFixed(2);
    return '';
  });

  const [notes, setNotes] = useState('Repaid via UPI');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const otherMembers = members.filter((m) => m.user_id !== currentUser.id);
  const amountPaise = parseRupeesToPaise(rupeesInput);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!recipientId) {
      setErrorMsg('Please choose a recipient member.');
      return;
    }

    if (amountPaise <= 0) {
      setErrorMsg('Please enter an amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    const result = await recordSettlement(recipientId, amountPaise, notes);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to record repayment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              🤝
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Record Repayment</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Settle shared family balances without adding new expenses</p>
            </div>
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
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Pre-fill Suggestions */}
          {debtPayments.length > 0 && (
            <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100">
              <span className="text-[11px] font-bold text-blue-900 block mb-1.5">
                Suggested Settlements (Minimum Transactions):
              </span>
              <div className="space-y-1">
                {debtPayments.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRecipientId(p.to_user_id);
                      setRupeesInput((p.amount_paise / 100).toFixed(2));
                    }}
                    className="w-full text-left p-1.5 rounded-lg bg-white hover:bg-blue-100/50 border border-blue-200/60 flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="text-slate-700 truncate">
                      {p.from_name.split(' ')[0]} → {p.to_name.split(' ')[0]}
                    </span>
                    <span className="font-mono-numbers font-bold text-blue-700">
                      {formatPaise(p.amount_paise)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payer info */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Paying Member (You):</span>
            <div className="flex items-center gap-1.5">
              <Avatar name={currentUser.full_name} url={currentUser.avatar_url} size="sm" />
              <span className="text-xs font-semibold text-slate-800">{currentUser.full_name}</span>
            </div>
          </div>

          {/* Recipient Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Recipient Member
            </label>
            <div className="grid grid-cols-2 gap-2">
              {otherMembers.map((m) => {
                const isSelected = recipientId === m.user_id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setRecipientId(m.user_id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-colors ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Avatar name={m.profile?.full_name || 'Member'} url={m.profile?.avatar_url} size="sm" />
                    <span className="text-xs truncate">{m.profile?.full_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount in Rupees */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Settlement Amount (INR ₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
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
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono-numbers text-lg font-bold text-slate-900"
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Paise stored: {amountPaise.toLocaleString('en-IN')} paise
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Method</label>
            <input
              type="text"
              placeholder="e.g. Paid via UPI GPay, Cash, Paytm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 text-xs text-slate-800"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
            <strong>Settlement Workflow:</strong> Once recorded, this payment will appear as{' '}
            <em>Pending</em>. The recipient member confirms receipt in their Balances tab to update the official debt balance.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Recording...</span>
            ) : (
              <>
                <span>Record Repayment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
