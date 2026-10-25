import React, { useState, useMemo } from 'react';
import { useStore } from '../../lib/store';
import { formatPaise, parseRupeesToPaise } from '../../utils/currency';
import { getCurrentMonthIST } from '../../utils/date';
import { BudgetAlert } from '../BudgetAlert';
import { X, Check, ShieldAlert, AlertCircle, Sparkles, Bell } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { group, currentUser, members, expenses, updateBudget } = useStore();
  const currentMember = members.find((m) => m.user_id === currentUser.id);
  const isAdmin = currentMember?.role === 'admin';

  const [rupeesInput, setRupeesInput] = useState(() => (group.monthly_budget_paise / 100).toString());
  const [includesPersonal, setIncludesPersonal] = useState(group.budget_includes_personal);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate current month's cumulative spending
  const currentMonth = getCurrentMonthIST();
  const currentSpendingPaise = useMemo(() => {
    return expenses
      .filter((e) => {
        if (!e.expense_date.startsWith(currentMonth)) return false;
        if (e.expense_type === 'shared') return true;
        return includesPersonal;
      })
      .reduce((sum, e) => sum + e.amount_paise, 0);
  }, [expenses, currentMonth, includesPersonal]);

  if (!isOpen) return null;

  const budgetPaise = parseRupeesToPaise(rupeesInput);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (budgetPaise <= 0) {
      setErrorMsg('Monthly budget must be greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    const res = await updateBudget(budgetPaise, includesPersonal);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to update budget.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-base shadow-sm">
              🎯
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Monthly Family Budget
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure spending caps and alert thresholds for {group.name}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {!isAdmin && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Only the family administrator ({members.find((m) => m.role === 'admin')?.profile?.full_name}) can update group budget.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Budget Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Budget Amount (INR ₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="100"
                min="100"
                value={rupeesInput}
                onChange={(e) => setRupeesInput(e.target.value)}
                disabled={!isAdmin}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 font-mono-numbers text-xl font-bold text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800"
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between font-mono-numbers">
              <span>Target: {formatPaise(budgetPaise)}</span>
              <span>80% Warning: {formatPaise(Math.round(budgetPaise * 0.8))}</span>
            </div>
          </div>

          {/* Visual Budget Alert Component with Local State */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Live Budget Alert & Notification Status</span>
              </span>
            </div>
            <BudgetAlert
              currentSpendingPaise={currentSpendingPaise}
              targetBudgetPaise={budgetPaise}
              includesPersonal={includesPersonal}
            />
          </div>

          {/* Include Personal Expenses Toggle */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includesPersonal}
                onChange={(e) => setIncludesPersonal(e.target.checked)}
                disabled={!isAdmin}
                className="mt-0.5 rounded text-blue-700 focus:ring-blue-700 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Include personal expenses in family budget
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight block mt-0.5">
                  When enabled, individual personal spending counts toward the monthly family budget cap. When disabled, only shared household bills trigger 80% and 100% threshold alerts.
                </span>
              </div>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isAdmin || isSubmitting}
              className="w-full h-11 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Budget Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
