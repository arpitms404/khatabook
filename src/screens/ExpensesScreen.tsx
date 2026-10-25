import React, { useState, useMemo } from 'react';
import { useStore } from '../lib/store';
import { formatPaise } from '../utils/currency';
import { formatDateIST, getRecentMonths } from '../utils/date';
import { CategoryIcon } from '../components/CategoryIcon';
import { Expense, ExpenseCategory, ExpenseType } from '../types';
import {
  Search,
  Filter,
  Trash2,
  Receipt,
  Plus,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface Props {
  onOpenAddExpense: () => void;
  onViewReceipt: (expense: Expense) => void;
}

export const ExpensesScreen: React.FC<Props> = ({ onOpenAddExpense, onViewReceipt }) => {
  const { currentUser, members, expenses, deleteExpense, udhaarTransactions, udhaarSummaries } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'personal' | 'shared' | 'udhaar'>('all');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Grouped items
  type UnifiedTx = {
    id: string;
    title: string;
    subtitle: string;
    amountPaise: number;
    date: string;
    timestamp?: string;
    isExpense: boolean;
    expenseType?: ExpenseType;
    category?: ExpenseCategory;
    originalExpense?: Expense;
    udhaarType?: 'gave' | 'got';
  };

  const allTransactions = useMemo<UnifiedTx[]>(() => {
    const list: UnifiedTx[] = [];

    // Add Expenses
    expenses.forEach((e) => {
      if (e.deleted_at) return;
      const payer = members.find((m) => m.user_id === e.paid_by);
      const isMe = e.paid_by === currentUser.id;
      const payerName = isMe
        ? `${currentUser.full_name.split(' ')[0]} (You)`
        : payer?.profile?.full_name?.split(' ')[0] || 'Member';
      const timeStr = new Date(e.created_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      list.push({
        id: e.id,
        title: e.description,
        subtitle: `${e.expense_type === 'shared' ? 'Shared' : 'Personal'} · ${payerName}`,
        amountPaise: e.amount_paise,
        date: e.expense_date,
        timestamp: timeStr,
        isExpense: true,
        expenseType: e.expense_type,
        category: e.category,
        originalExpense: e,
      });
    });

    // Add Udhaar Transactions
    udhaarTransactions.forEach((u) => {
      const acc = udhaarSummaries.find((s) => s.account.id === u.account_id)?.account;
      const timeStr = new Date(u.created_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      list.push({
        id: u.id,
        title: acc?.name || 'Khata Transaction',
        subtitle: `Udhaar · ${u.transaction_type === 'gave' ? 'Gave (Diya)' : 'Got (Liya)'} · ${u.payment_mode}`,
        amountPaise: u.amount_paise,
        date: u.transaction_date,
        timestamp: timeStr,
        isExpense: false,
        udhaarType: u.transaction_type,
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, udhaarTransactions, members, currentUser.id, udhaarSummaries]);

  // Filtered transactions
  const filteredList = useMemo(() => {
    return allTransactions.filter((tx) => {
      // Type Filter
      if (filterType === 'personal' && tx.expenseType !== 'personal') return false;
      if (filterType === 'shared' && tx.expenseType !== 'shared') return false;
      if (filterType === 'udhaar' && tx.isExpense) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = tx.title.toLowerCase().includes(q);
        const matchesSub = tx.subtitle.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSub) return false;
      }

      return true;
    });
  }, [allTransactions, filterType, searchQuery]);

  // Group by Date for display matching mockup #4
  const groupedByDate = useMemo(() => {
    const groups: { dateKey: string; label: string; items: UnifiedTx[] }[] = [];
    const dateMap = new Map<string, UnifiedTx[]>();

    filteredList.forEach((tx) => {
      const arr = dateMap.get(tx.date) || [];
      arr.push(tx);
      dateMap.set(tx.date, arr);
    });

    const todayStr = '2026-10-19';

    Array.from(dateMap.entries()).forEach(([date, items]) => {
      let label = formatDateIST(date);
      if (date === todayStr) {
        label = `Today, ${formatDateIST(date)}`;
      }
      groups.push({ dateKey: date, label, items });
    });

    return groups.sort((a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime());
  }, [filteredList]);

  const handleDelete = async (id: string, desc: string) => {
    if (confirm(`Delete "${desc}"?`)) {
      await deleteExpense(id);
    }
  };

  return (
    <div className="space-y-4 pb-24 text-slate-900 dark:text-slate-100">
      {/* Top Header matching mockup #4 */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Transactions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredList.length} recorded entries
          </p>
        </div>

        <button
          onClick={onOpenAddExpense}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Search Input with Filter Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <button
          onClick={() => setShowFilterDrawer(!showFilterDrawer)}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
          title="Filter options"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Chips: [ All ] [ Personal ] [ Shared ] [ Udhaar ] matching mockup #4 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'personal', label: 'Personal' },
            { id: 'shared', label: 'Shared' },
            { id: 'udhaar', label: 'Udhaar' },
          ] as const
        ).map((tab) => {
          const isSelected = filterType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Grouped Transaction Cards matching mockup #4 */}
      <div className="space-y-4">
        {groupedByDate.map((group) => (
          <div key={group.dateKey} className="space-y-2">
            {/* Date Header */}
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
              {group.label}
            </div>

            {/* Transaction Items */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-2xs">
              {group.items.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => tx.originalExpense && onViewReceipt(tx.originalExpense)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {tx.isExpense ? (
                        <CategoryIcon category={tx.category || 'Other'} className="w-4 h-4" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {tx.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {tx.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <div className="text-xs font-bold font-mono-numbers text-slate-900 dark:text-slate-100">
                      {formatPaise(tx.amountPaise)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {tx.timestamp || 'Today'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {groupedByDate.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">No transactions match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
