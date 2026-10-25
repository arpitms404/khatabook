import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { formatPaise } from '../utils/currency';
import { formatDateIST } from '../utils/date';
import { Avatar } from '../components/Avatar';
import {
  Scale,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Check,
  Send,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  onOpenSettleUp: (recipientId?: string, amountPaise?: number) => void;
}

export const BalancesScreen: React.FC<Props> = ({ onOpenSettleUp }) => {
  const {
    currentUser,
    members,
    balances,
    debtPayments,
    settlements,
    confirmSettlement,
    cancelSettlement,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'balances' | 'settlements'>('balances');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const pendingSettlements = settlements.filter((s) => s.status === 'pending');
  const confirmedSettlements = settlements.filter((s) => s.status === 'confirmed');

  const currentMember = members.find((m) => m.user_id === currentUser.id);
  const isAdmin = currentMember?.role === 'admin';

  const handleConfirm = async (settlementId: string) => {
    const res = await confirmSettlement(settlementId);
    if (res.success) {
      setFeedbackMsg({ text: 'Repayment confirmed! Balances updated.', isError: false });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } else {
      setFeedbackMsg({ text: res.error || 'Failed to confirm settlement.', isError: true });
    }
  };

  const handleCancel = async (settlementId: string) => {
    if (confirm('Cancel this pending settlement?')) {
      await cancelSettlement(settlementId);
    }
  };

  return (
    <div className="space-y-5 pb-24 text-slate-900 dark:text-slate-100">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold leading-tight">Balances &amp; Settlements</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Shared expense debt resolution with minimal transactions
          </p>
        </div>
        <button
          onClick={() => onOpenSettleUp()}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
        >
          + Record Repayment
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedbackMsg.isError
              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {feedbackMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Segmented Tab */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
        <button
          onClick={() => setActiveTab('balances')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'balances'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Net Balances &amp; Debt Simplification
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors relative ${
            activeTab === 'settlements'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>Settlement Ledger</span>
          {pendingSettlements.length > 0 && (
            <span className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingSettlements.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'balances' ? (
        <div className="space-y-5">
          {/* Section 1: Simplified Repayments */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Suggested Settlements</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Optimized repayment routes minimizing total transactions
                </p>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                {debtPayments.length} transactions needed
              </span>
            </div>

            {debtPayments.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold block">All family debts are settled!</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">No member currently owes anyone money.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {debtPayments.map((payment, idx) => {
                  const isCurrentDebtor = payment.from_user_id === currentUser.id;
                  const isCurrentCreditor = payment.to_user_id === currentUser.id;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        isCurrentDebtor
                          ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                          : isCurrentCreditor
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={payment.from_name} size="sm" />
                        <span className="font-semibold truncate">
                          {payment.from_name.split(' ')[0]}
                          {isCurrentDebtor && ' (You)'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <Avatar name={payment.to_name} size="sm" />
                        <span className="font-semibold truncate">
                          {payment.to_name.split(' ')[0]}
                          {isCurrentCreditor && ' (You)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono-numbers font-bold text-sm">
                          {formatPaise(payment.amount_paise)}
                        </span>
                        {isCurrentDebtor && (
                          <button
                            onClick={() => onOpenSettleUp(payment.to_user_id, payment.amount_paise)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] rounded-lg transition-colors whitespace-nowrap"
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Member Net Balances Table */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold">Individual Net Balances</h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {balances.map((b) => {
                const isMe = b.user_id === currentUser.id;
                const isPositive = b.net_balance_paise > 0;
                const isNegative = b.net_balance_paise < 0;

                return (
                  <div key={b.user_id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={b.full_name} url={b.avatar_url} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold truncate">{b.full_name}</span>
                          {isMe && (
                            <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-900/40 px-1 rounded">
                              You
                            </span>
                          )}
                          {b.role === 'admin' && (
                            <span className="text-[10px] text-slate-500 uppercase">Admin</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Paid: {formatPaise(b.total_paid_shared_paise)} · Share: {formatPaise(b.total_shared_cost_paise)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono-numbers font-bold text-sm ${
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isNegative
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {b.net_balance_paise === 0
                          ? 'Settled'
                          : formatPaise(b.net_balance_paise, { showSign: true })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {isPositive ? 'gets back' : isNegative ? 'owes family' : 'even'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Section 3: Settlements Tab */
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Pending Repayment Confirmations ({pendingSettlements.length})</span>
              </h3>
            </div>

            {pendingSettlements.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No pending repayments awaiting confirmation.
              </p>
            ) : (
              <div className="space-y-2.5">
                {pendingSettlements.map((s) => {
                  const payer = members.find((m) => m.user_id === s.payer_member_id)?.profile?.full_name || s.payer_member_id;
                  const recipient = members.find((m) => m.user_id === s.recipient_member_id)?.profile?.full_name || s.recipient_member_id;
                  const canConfirm = s.recipient_member_id === currentUser.id || isAdmin;
                  const canCancel = s.payer_member_id === currentUser.id || isAdmin;

                  return (
                    <div
                      key={s.id}
                      className="p-3.5 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-900 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {payer} repaid {recipient}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Amount: <strong className="font-mono-numbers text-slate-800 dark:text-slate-200">{formatPaise(s.amount_paise)}</strong> · {formatDateIST(s.settlement_date)}
                        </div>
                        {s.notes && <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 italic">Note: "{s.notes}"</div>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canConfirm ? (
                          <button
                            onClick={() => handleConfirm(s.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm Receipt</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                            Awaiting {recipient.split(' ')[0]}
                          </span>
                        )}

                        {canCancel && (
                          <button
                            onClick={() => handleCancel(s.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Cancel settlement"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold">Confirmed Settlement History</h3>

            {confirmedSettlements.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No confirmed settlements yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {confirmedSettlements.map((s) => {
                  const payer = members.find((m) => m.user_id === s.payer_member_id)?.profile?.full_name || s.payer_member_id;
                  const recipient = members.find((m) => m.user_id === s.recipient_member_id)?.profile?.full_name || s.recipient_member_id;

                  return (
                    <div key={s.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {payer} paid {recipient}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatDateIST(s.settlement_date)} · {s.notes || 'Repayment'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono-numbers font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPaise(s.amount_paise)}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Confirmed ✓</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
