import React, { useState, useMemo } from 'react';
import { useStore } from '../lib/store';
import { formatPaise } from '../utils/currency';
import { getRecentMonths } from '../utils/date';
import { exportExpensesToCsv } from '../utils/csv';
import { CategoryIcon } from '../components/CategoryIcon';
import { Download, Printer, ArrowUp, ChevronDown, Calendar } from 'lucide-react';
import { ExpenseCategory } from '../types';

export const ReportsScreen: React.FC = () => {
  const { group, members, expenses } = useStore();
  const [reportType, setReportType] = useState<'month' | 'year' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [trendRange, setTrendRange] = useState<'This Year' | 'Last 6 Months'>('This Year');

  const recentMonths = useMemo(() => getRecentMonths(6), []);

  // Filter expenses by selected month
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (e.deleted_at) return false;
      return e.expense_date.startsWith(selectedMonth);
    });
  }, [expenses, selectedMonth]);

  // Total Spending & Daily Average
  const totalSpendingPaise = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + e.amount_paise, 0);
  }, [monthExpenses]);

  // Assume 31 days for October or days elapsed
  const avgDailyPaise = useMemo(() => {
    return Math.round(totalSpendingPaise / 31);
  }, [totalSpendingPaise]);

  // Category stats
  const categoryStats = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    monthExpenses.forEach((e) => {
      const cur = map.get(e.category) || 0;
      map.set(e.category, cur + e.amount_paise);
    });

    const list = Array.from(map.entries()).map(([category, amountPaise]) => ({
      category,
      amountPaise,
      percentage: totalSpendingPaise > 0 ? Math.round((amountPaise / totalSpendingPaise) * 100) : 0,
    }));

    return list.sort((a, b) => b.amountPaise - a.amountPaise);
  }, [monthExpenses, totalSpendingPaise]);

  // Color map for categories
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

  // Monthly trend dummy data scaled realistically matching mockup #6 (May to Oct)
  const monthlyTrends = [
    { month: 'May', amountK: 24, label: '₹24K', active: false },
    { month: 'Jun', amountK: 18, label: '₹18K', active: false },
    { month: 'Jul', amountK: 32, label: '₹32K', active: false },
    { month: 'Aug', amountK: 22, label: '₹22K', active: false },
    { month: 'Sep', amountK: 25, label: '₹25K', active: false },
    { month: 'Oct', amountK: Math.round(totalSpendingPaise / 100000), label: `${Math.round(totalSpendingPaise / 100000)}K`, active: true },
  ];

  const handleExportCsv = () => {
    exportExpensesToCsv(monthExpenses, members, group.name, selectedMonth);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-24 text-slate-900 dark:text-slate-100">
      {/* Subtabs: [ Month ] [ Year ] [ Custom ] matching mockup #6 */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        {(
          [
            { id: 'month', label: 'Month' },
            { id: 'year', label: 'Year' },
            { id: 'custom', label: 'Custom' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              reportType === t.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Month Selector + Export Actions */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold pl-3 pr-7 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer shadow-2xs focus:outline-hidden"
          >
            {recentMonths.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCsv}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            title="Download CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2 Metric KPI Cards matching mockup #6 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Spending */}
        <div className="p-4 rounded-3xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Total Spending
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono-numbers">
            {formatPaise(totalSpendingPaise)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            <ArrowUp className="w-3 h-3" />
            <span>12%</span>
          </div>
        </div>

        {/* Avg. Daily */}
        <div className="p-4 rounded-3xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Avg. Daily
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono-numbers">
            {formatPaise(avgDailyPaise)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            <ArrowUp className="w-3 h-3" />
            <span>8%</span>
          </div>
        </div>
      </div>

      {/* Category-wise Spending List matching mockup #6 */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
          Category-wise Spending
        </h3>

        <div className="space-y-3">
          {categoryStats.map((item) => {
            const barColor = categoryColors[item.category] || '#64748b';
            return (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: barColor }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono-numbers text-xs">
                    <span className="text-slate-400 text-[11px]">{item.percentage}%</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatPaise(item.amountPaise)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Trend Bar Chart matching mockup #6 */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Monthly Trend
          </h3>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 cursor-pointer">
            <span>{trendRange}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Bar chart representation */}
        <div className="h-40 flex items-end justify-between gap-2 pt-6 px-2">
          {monthlyTrends.map((col) => {
            const heightPercent = Math.min(Math.round((col.amountK / 35) * 100), 100);
            return (
              <div key={col.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono-numbers">
                  {col.label}
                </span>
                <div
                  className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${
                    col.active
                      ? 'bg-blue-600 shadow-sm shadow-blue-600/30'
                      : 'bg-blue-200 dark:bg-blue-950/80 hover:bg-blue-300'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {col.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
