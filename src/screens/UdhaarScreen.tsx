import React, { useState, useMemo } from 'react';
import { useStore } from '../lib/store';
import { formatPaise } from '../utils/currency';
import { formatDateIST } from '../utils/date';
import { Avatar } from '../components/Avatar';
import { UdhaarAccount, UdhaarTransaction, UdhaarAccountSummary } from '../types';
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  FileText,
  Phone,
  Trash2,
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Share2,
} from 'lucide-react';

interface Props {
  onOpenAddAccount: () => void;
  onOpenAddTransaction: (accountId?: string, defaultType?: 'gave' | 'got') => void;
  onOpenStatement: (account: UdhaarAccount, txs: UdhaarTransaction[]) => void;
}

export const UdhaarScreen: React.FC<Props> = ({
  onOpenAddAccount,
  onOpenAddTransaction,
  onOpenStatement,
}) => {
  const {
    udhaarAccounts,
    udhaarTransactions,
    udhaarSummaries,
    totalUdhaarReceivablePaise,
    totalUdhaarPayablePaise,
    deleteUdhaarAccount,
    deleteUdhaarTransaction,
    settlements,
    members,
    currentUser,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [subTab, setSubTab] = useState<'people' | 'settlements'>('people');
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return udhaarSummaries.filter((summary) => {
      const acc = summary.account;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesPhone = acc.phone?.toLowerCase().includes(q);
        const matchesRel = acc.relation?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesRel) return false;
      }
      return true;
    });
  }, [udhaarSummaries, searchQuery]);

  const activeAccount = useMemo(() => {
    return udhaarAccounts.find((a) => a.id === activeAccountId) || null;
  }, [udhaarAccounts, activeAccountId]);

  const activeSummary = useMemo(() => {
    return udhaarSummaries.find((s) => s.account.id === activeAccountId) || null;
  }, [udhaarSummaries, activeAccountId]);

  const activeTransactions = useMemo(() => {
    if (!activeAccountId) return [];
    return udhaarTransactions
      .filter((tx) => tx.account_id === activeAccountId)
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }, [udhaarTransactions, activeAccountId]);

  // Recent 4 Khata transactions matching mockup #5
  const recentKhataTransactions = useMemo(() => {
    return [...udhaarTransactions]
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 4);
  }, [udhaarTransactions]);

  const handleDeleteAccount = async (id: string, name: string) => {
    if (confirm(`Delete ledger account for "${name}" and all records?`)) {
      await deleteUdhaarAccount(id);
      if (activeAccountId === id) setActiveAccountId(null);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Delete this entry?')) {
      await deleteUdhaarTransaction(id);
    }
  };

  return (
    <div className="space-y-4 pb-24 text-slate-900 dark:text-slate-100">
      {/* If detail view for a specific person is open, show their Khatabook ledger */}
      {activeAccount && activeSummary ? (
        <div className="space-y-4 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveAccountId(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Khata List</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenStatement(activeAccount, activeTransactions)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-200"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Statement</span>
              </button>
              <button
                onClick={() => handleDeleteAccount(activeAccount.id, activeAccount.name)}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Delete Account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Account Profile Header Card */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={activeAccount.name} size="lg" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {activeAccount.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  {activeAccount.relation && <span>{activeAccount.relation}</span>}
                  {activeAccount.phone && (
                    <span className="flex items-center gap-1 text-blue-600 font-mono-numbers">
                      <Phone className="w-3 h-3" />
                      {activeAccount.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Net Balance
              </span>
              <span
                className={`text-lg font-black font-mono-numbers ${
                  activeSummary.net_balance_paise > 0
                    ? 'text-emerald-600'
                    : activeSummary.net_balance_paise < 0
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {formatPaise(Math.abs(activeSummary.net_balance_paise))}
              </span>
              <span className="text-[10px] font-bold block text-slate-400">
                {activeSummary.net_balance_paise > 0
                  ? 'Owes you'
                  : activeSummary.net_balance_paise < 0
                  ? 'You owe'
                  : 'Settled'}
              </span>
            </div>
          </div>

          {/* Action Buttons: Diya (Gave) & Liya (Got) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onOpenAddTransaction(activeAccount.id, 'gave')}
              className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 active:scale-95 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>You Gave (Diya) ₹</span>
            </button>
            <button
              onClick={() => onOpenAddTransaction(activeAccount.id, 'got')}
              className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>You Got (Liya) ₹</span>
            </button>
          </div>

          {/* Transactions List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Ledger Entries ({activeTransactions.length})
            </h3>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
              {activeTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {tx.description || (tx.transaction_type === 'gave' ? 'Money Lent' : 'Money Received')}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatDateIST(tx.transaction_date)} · {tx.payment_mode.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold font-mono-numbers block ${
                          tx.transaction_type === 'gave' ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {tx.transaction_type === 'gave' ? '-' : '+'} {formatPaise(tx.amount_paise)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {tx.transaction_type === 'gave' ? 'Gave' : 'Got'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="text-slate-300 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {activeTransactions.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No entries yet. Tap "You Gave" or "You Got" above to add the first entry.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Main Khata / Udhaar Screen matching mockup #5 */
        <div className="space-y-4">
          {/* Header matching mockup #5 */}
          <div className="flex items-center justify-between pt-1">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Khata / Udhaar
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddAccount}
                className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-colors"
                title="Add New Party / Account"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subtabs: [ People ] [ Settlements ] matching mockup #5 */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => setSubTab('people')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                subTab === 'people'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              People
            </button>
            <button
              onClick={() => setSubTab('settlements')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                subTab === 'settlements'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Settlements
            </button>
          </div>

          {subTab === 'people' ? (
            <>
              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contacts, relatives, shops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* People Cards List matching mockup #5 */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
                {filteredSummaries.map((summary) => {
                  const acc = summary.account;
                  const isOwesYou = summary.net_balance_paise > 0;
                  const isYouOwe = summary.net_balance_paise < 0;
                  const isSettled = summary.net_balance_paise === 0;

                  return (
                    <div
                      key={acc.id}
                      onClick={() => setActiveAccountId(acc.id)}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={acc.name} size="md" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {acc.name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {acc.relation || acc.account_type}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-xs font-bold font-mono-numbers ${
                            isOwesYou
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isYouOwe
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {formatPaise(Math.abs(summary.net_balance_paise))}
                        </div>
                        <div
                          className={`text-[10px] font-semibold ${
                            isOwesYou
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isYouOwe
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {isOwesYou ? 'Owes you' : isYouOwe ? 'You owe' : 'Settled'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Khata Transactions section with "View All" matching mockup #5 */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Recent Khata Transactions
                  </h3>
                  <button
                    onClick={() => {}}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
                  {recentKhataTransactions.map((tx) => {
                    const acc = udhaarAccounts.find((a) => a.id === tx.account_id);
                    const isGave = tx.transaction_type === 'gave';

                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                              isGave
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60'
                            }`}
                          >
                            {isGave ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {acc?.name || 'Party Entry'}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {isGave ? 'Gave' : 'Received'} · {formatDateIST(tx.transaction_date)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-xs font-bold font-mono-numbers ${
                              isGave ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {formatPaise(tx.amount_paise)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Settlements Subtab */
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
                {settlements.map((set) => {
                  const payer = members.find((m) => m.user_id === set.payer_member_id);
                  const recipient = members.find((m) => m.user_id === set.recipient_member_id);

                  return (
                    <div key={set.id} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {payer?.profile?.full_name?.split(' ')[0]} paid{' '}
                            {recipient?.profile?.full_name?.split(' ')[0]}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {formatDateIST(set.settlement_date)} · {set.status}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-emerald-600 font-mono-numbers">
                        {formatPaise(set.amount_paise)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
