import React, { useState } from 'react';
import {
  Home,
  Receipt,
  BookOpen,
  BarChart3,
  Plus,
  Scale,
  Settings,
  CheckCircle2,
  MoreVertical,
  X,
} from 'lucide-react';
import { TabKey } from '../types';

export type { TabKey };

interface Props {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  onOpenAddExpense: () => void;
  pendingSettlementsCount?: number;
  overdueUdhaarCount?: number;
  isEmbedded?: boolean;
}

export const BottomTabBar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  onOpenAddExpense,
  pendingSettlementsCount = 0,
  overdueUdhaarCount = 0,
  isEmbedded = false,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <>
      {/* Floating More Options Modal/Drawer */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 space-y-2 mb-16 sm:mb-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">More Tools</span>
              <button onClick={() => setShowMoreMenu(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setActiveTab('balances');
                setShowMoreMenu(false);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-colors ${
                activeTab === 'balances'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <span>Balances & Settlements</span>
              </div>
              {pendingSettlementsCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingSettlementsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('settings');
                setShowMoreMenu(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-xs font-semibold transition-colors ${
                activeTab === 'settings'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <span>Family Settings & Limit</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('tests');
                setShowMoreMenu(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-xs font-semibold transition-colors ${
                activeTab === 'tests'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Automated Verification Suite</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar matching mockup */}
      <nav
        className={`${
          isEmbedded
            ? 'sticky bottom-0 w-full z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors shrink-0'
            : 'fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors'
        }`}
      >
        <div className="max-w-md mx-auto flex items-center justify-around h-16 px-3">
          {/* 1. Home */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-all ${
              activeTab === 'home'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] mt-1 font-medium">Home</span>
          </button>

          {/* 2. Expenses */}
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-all ${
              activeTab === 'expenses'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[11px] mt-1 font-medium">Expenses</span>
          </button>

          {/* 3. Center Elevated Quick Add Button */}
          <button
            onClick={onOpenAddExpense}
            className="-mt-5 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 active:scale-95 transition-all ring-4 ring-white dark:ring-slate-900"
            title="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* 4. Khata / Udhaar */}
          <button
            onClick={() => setActiveTab('udhaar')}
            className={`relative flex flex-col items-center justify-center min-w-[56px] py-1 transition-all ${
              activeTab === 'udhaar'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="relative">
              <BookOpen className="w-5 h-5" />
              {overdueUdhaarCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {overdueUdhaarCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 font-medium">Khata</span>
          </button>

          {/* 5. Reports (or More Menu) */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-all ${
              activeTab === 'reports'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px] mt-1 font-medium">Reports</span>
          </button>

          {/* Quick Menu Icon */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </nav>
    </>
  );
};
