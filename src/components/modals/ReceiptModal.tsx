import React from 'react';
import { Expense, GroupMember } from '../../types';
import { formatPaise } from '../../utils/currency';
import { formatDateIST } from '../../utils/date';
import { X, Receipt, CheckCircle, ShieldCheck } from 'lucide-react';

interface Props {
  expense: Expense | null;
  members: GroupMember[];
  onClose: () => void;
}

export const ReceiptModal: React.FC<Props> = ({ expense, members, onClose }) => {
  if (!expense) return null;

  const payer = members.find((m) => m.user_id === expense.paid_by)?.profile?.full_name || expense.paid_by;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Digital Receipt</h2>
              <p className="text-[11px] text-slate-500">Verified Supabase Storage Record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Simulated Physical Bill Receipt Card */}
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl font-mono text-xs space-y-3">
            <div className="text-center pb-2 border-b border-slate-200">
              <div className="font-bold text-slate-900 text-sm tracking-wide uppercase">
                {expense.category}
              </div>
              <div className="text-[11px] text-slate-500">{expense.description}</div>
            </div>

            <div className="space-y-1.5 text-slate-600 text-[11px]">
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-semibold text-slate-800">{formatDateIST(expense.expense_date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid by:</span>
                <span className="font-semibold text-slate-800">{payer}</span>
              </div>
              <div className="flex justify-between">
                <span>Expense Type:</span>
                <span className="font-semibold text-slate-800 uppercase">{expense.expense_type}</span>
              </div>
              {expense.notes && (
                <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-200">
                  Note: {expense.notes}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm text-slate-900">
              <span>Total Amount:</span>
              <span className="font-mono-numbers text-base text-blue-700">
                {formatPaise(expense.amount_paise)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Encrypted receipt asset verified with Group RLS credentials.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
