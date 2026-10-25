import React, { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { formatPaise } from '../utils/currency';
import { formatDateIST, getRecentMonths, getCurrentMonthIST } from '../utils/date';
import { CategoryIcon, getCategoryColor } from '../components/CategoryIcon';
import { Avatar } from '../components/Avatar';
import {
  Plus,
  Scale,
  Users,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Calendar,
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Search,
  Bell,
  Sun,
  ChevronDown,
  Wallet,
  ArrowUp,
  ArrowDown,
  Sparkles,
  BarChart3,
  User,
  Phone,
  Download,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { Expense, ExpenseCategory, TabKey } from '../types';

interface Props {
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  onOpenAddExpense: (type?: 'personal' | 'shared') => void;
  onOpenAddUdhaarTransaction: (accountId?: string, defaultType?: 'gave' | 'got') => void;
  onOpenSettleUp: () => void;
  onOpenInvite: () => void;
  onOpenBudget: () => void;
  onViewReceipt: (expense: Expense) => void;
  onNavigateToTab: (tab: TabKey) => void;
  onOpenWelcome?: () => void;
  onOpenDownloadApp?: () => void;
  onOpenPhoneOtp?: () => void;
}

export const HomeScreen: React.FC<Props> = ({
  selectedMonth,
  setSelectedMonth,
  onOpenAddExpense,
  onOpenAddUdhaarTransaction,
  onOpenSettleUp,
  onOpenInvite,
  onOpenBudget,
  onViewReceipt,
  onNavigateToTab,
  onOpenWelcome,
  onOpenDownloadApp,
  onOpenPhoneOtp,
}) => {
  const {
    currentUser,
    group,
    members,
    expenses,
    balances,
    totalUdhaarReceivablePaise,
    totalUdhaarPayablePaise,
    udhaarSummaries,
    udhaarTransactions,
    firebaseUser,
  } = useStore();

  const recentMonths = useMemo(() => getRecentMonths(6), []);
  const [trendView, setTrendView] = useState<'6M' | '1Y'>('6M');

  // Filter expenses by selected month
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (e.deleted_at) return false;
      return e.expense_date.startsWith(selectedMonth);
    });
  }, [expenses, selectedMonth]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalFamilyPaise = 0;
    let sharedPaise = 0;
    let personalPaise = 0;
    let myPersonalPaise = 0;

    monthExpenses.forEach((e) => {
      totalFamilyPaise += e.amount_paise;
      if (e.expense_type === 'shared') {
        sharedPaise += e.amount_paise;
      } else {
        personalPaise += e.amount_paise;
        if (e.paid_by === currentUser.id) {
          myPersonalPaise += e.amount_paise;
        }
      }
    });

    const budgetSubjectPaise = group.budget_includes_personal ? totalFamilyPaise : sharedPaise;
    const budgetRemainingPaise = group.monthly_budget_paise - budgetSubjectPaise;
    const budgetUsagePercent = Math.round(
      (budgetSubjectPaise / (group.monthly_budget_paise || 1)) * 100
    );

    return {
      totalFamilyPaise,
      sharedPaise,
      personalPaise,
      myPersonalPaise,
      budgetSubjectPaise,
      budgetRemainingPaise,
      budgetUsagePercent,
    };
  }, [monthExpenses, currentUser.id, group.budget_includes_personal, group.monthly_budget_paise]);

  // Current user's net balance for shared expenses
  const myBalance = useMemo(() => {
    return balances.find((b) => b.user_id === currentUser.id);
  }, [balances, currentUser.id]);

  const netPaise = myBalance?.net_balance_paise || 0;
  // Owes money (negative balance) vs Owed to me (positive balance)
  const iOwePaise = netPaise < 0 ? Math.abs(netPaise) : 0;
  const owedToMePaise = netPaise > 0 ? netPaise : 0;

  // Category data for Donut Chart
  const categoryChartData = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    monthExpenses.forEach((e) => {
      const cur = map.get(e.category) || 0;
      map.set(e.category, cur + e.amount_paise);
    });

    const list = Array.from(map.entries()).map(([category, amountPaise]) => ({
      category,
      amountPaise,
      percentage: stats.totalFamilyPaise > 0 ? Math.round((amountPaise / stats.totalFamilyPaise) * 100) : 0,
    }));

    return list.sort((a, b) => b.amountPaise - a.amountPaise);
  }, [monthExpenses, stats.totalFamilyPaise]);

  // Category Color Map
  const categoryColors: Record<string, string> = {
    Groceries: '#f97316',
    Bills: '#3b82f6',
    Shopping: '#a855f7',
    Medical: '#ec4899',
    Food: '#eab308',
    Fuel: '#ef4444',
    Travel: '#06b6d4',
    Education: '#6366f1',
    Other: '#64748b',
  };

  // Recent 5 transactions
  const recentTransactions = useMemo(() => {
    return [...monthExpenses]
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
      .slice(0, 5);
  }, [monthExpenses]);

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Format month name for display
  const currentMonthLabel = useMemo(() => {
    const found = recentMonths.find((m) => m.key === selectedMonth);
    return found ? found.label : selectedMonth;
  }, [recentMonths, selectedMonth]);

  return (
    <div className="space-y-5 pb-24 text-slate-900 dark:text-slate-100">
      {/* Top Header Zone matching mockup #2 */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{getGreeting()}, {currentUser.full_name.split(' ')[0]}</span>
            <span>👋</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 cursor-pointer" onClick={() => onNavigateToTab('settings')}>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              {group.name}
            </h1>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Right Action Icons: Month selector, Notifications, Profile */}
        <div className="flex items-center gap-2">
          {/* Month selector dropdown pill */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold pl-3 pr-7 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-hidden"
            >
              {recentMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Notification Bell */}
          <button
            onClick={onOpenBudget}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center relative hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Budget & Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* User Avatar */}
          <div
            onClick={() => onNavigateToTab('settings')}
            className="cursor-pointer ring-2 ring-blue-600/30 rounded-full"
            title="Profile & Family Settings"
          >
            <Avatar name={currentUser.full_name} url={currentUser.avatar_url} size="sm" />
          </div>
        </div>
      </div>

      {/* Hero Card: Total Family Spending matching mockup #2 */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-xl shadow-blue-700/20 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between text-blue-100 text-xs font-medium">
          <span>Total Family Spending</span>
          <span className="flex items-center gap-1 bg-white/15 backdrop-blur-xs text-[11px] font-bold px-2 py-0.5 rounded-full">
            <ArrowUp className="w-3 h-3 text-emerald-300" />
            <span>12% vs last month</span>
          </span>
        </div>

        <div className="mt-2 text-3xl font-black tracking-tight font-mono-numbers">
          {formatPaise(stats.totalFamilyPaise)}
        </div>

        {/* Budget Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/15">
          <div className="flex items-center justify-between text-xs text-blue-100 font-medium mb-1.5 font-mono-numbers">
            <span className="flex items-center gap-1 cursor-pointer hover:underline" onClick={onOpenBudget}>
              <span>{formatPaise(group.monthly_budget_paise)} budget</span>
            </span>
            <span className="font-bold">{stats.budgetUsagePercent}% used</span>
          </div>

          <div className="w-full h-2 bg-blue-950/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.budgetUsagePercent >= 100
                  ? 'bg-rose-400'
                  : stats.budgetUsagePercent >= 80
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(stats.budgetUsagePercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Firebase Phone OTP Login Prompt (shown when not logged in) */}
      {!firebaseUser && onOpenPhoneOtp && (
        <div
          onClick={onOpenPhoneOtp}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 flex items-center justify-between cursor-pointer hover:border-emerald-500/60 transition-all shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-600/30">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Firebase Phone OTP Login
                </span>
                <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.5 rounded-md leading-none">
                  SMS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Verify mobile number with 6-digit OTP for real-time Firebase sync
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
        </div>
      )}

      {/* Download App (APK / iOS) Banner */}
      {onOpenDownloadApp && (
        <div
          onClick={onOpenDownloadApp}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/30 flex items-center justify-between cursor-pointer hover:border-blue-500/60 transition-all shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-blue-600/30">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Direct App Download (APK &amp; iOS)
                </span>
                <span className="text-[10px] font-extrabold bg-blue-600 text-white px-1.5 py-0.5 rounded-md leading-none">
                  APK &amp; iOS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Download FamilyKhata.apk directly or install on iPhone via iOS profile
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
        </div>
      )}

      {/* 4 Quick Stat Cards in 2x2 Grid matching mockup #2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Personal */}
        <div
          onClick={() => onOpenAddExpense('personal')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Personal</span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono-numbers">
            {formatPaise(stats.personalPaise)}
          </div>
        </div>

        {/* Card 2: Shared */}
        <div
          onClick={() => onOpenAddExpense('shared')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Shared</span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono-numbers">
            {formatPaise(stats.sharedPaise)}
          </div>
        </div>

        {/* Card 3: I Owe */}
        <div
          onClick={onOpenSettleUp}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">I Owe</span>
          </div>
          <div className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono-numbers">
            {formatPaise(iOwePaise)}
          </div>
        </div>

        {/* Card 4: Owed to Me */}
        <div
          onClick={() => onNavigateToTab('balances')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Owed to Me</span>
          </div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
            {formatPaise(owedToMePaise)}
          </div>
        </div>
      </div>

      {/* Spending by Category (Donut Chart + Legend) matching mockup #2 */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Spending by Category
          </h3>
          <button
            onClick={() => onNavigateToTab('reports')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Details
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut Chart representation */}
          <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                className="text-slate-100 dark:text-slate-800"
              />

              {/* Segment arcs */}
              {(() => {
                let cumulativePercent = 0;
                return categoryChartData.slice(0, 6).map((item, idx) => {
                  const strokeColor = categoryColors[item.category] || '#64748b';
                  const percent = item.percentage;
                  const strokeDasharray = `${percent * 2.387} 238.7`;
                  const strokeDashoffset = -cumulativePercent * 2.387;
                  cumulativePercent += percent;

                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="14"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  );
                });
              })()}
            </svg>

            {/* Donut Hole Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-mono-numbers leading-tight">
                {formatPaise(stats.totalFamilyPaise)}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Total
              </span>
            </div>
          </div>

          {/* Legend Table matching mockup #2 */}
          <div className="w-full space-y-2 text-xs">
            {categoryChartData.slice(0, 6).map((item) => {
              const dotColor = categoryColors[item.category] || '#64748b';
              return (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono-numbers">
                    <span className="text-slate-400 text-[11px] w-8 text-right">
                      {item.percentage}%
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 w-16 text-right">
                      {formatPaise(item.amountPaise)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Access to Khata & Bilateral Udhaar Ledger */}
      <div
        onClick={() => onNavigateToTab('udhaar')}
        className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Khata / Udhaar
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Receivable: <strong className="text-emerald-600 font-mono-numbers">{formatPaise(totalUdhaarReceivablePaise)}</strong> · Payable: <strong className="text-rose-600 font-mono-numbers">{formatPaise(totalUdhaarPayablePaise)}</strong>
            </div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </div>

      {/* Recent Transactions List matching mockup */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Recent Transactions
          </h3>
          <button
            onClick={() => onNavigateToTab('expenses')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-2xs">
          {recentTransactions.map((expense) => {
            const payer = members.find((m) => m.user_id === expense.paid_by);
            const isMe = expense.paid_by === currentUser.id;
            const payerLabel = isMe
              ? `${currentUser.full_name.split(' ')[0]} (You)`
              : payer?.profile?.full_name?.split(' ')[0] || 'Member';

            return (
              <div
                key={expense.id}
                onClick={() => onViewReceipt(expense)}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <CategoryIcon category={expense.category} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {expense.description}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {expense.expense_type === 'shared' ? 'Shared' : 'Personal'} · {payerLabel}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <div className="text-xs font-bold font-mono-numbers text-slate-900 dark:text-slate-100">
                    {formatPaise(expense.amount_paise)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {formatDateIST(expense.expense_date)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
