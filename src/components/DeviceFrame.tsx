import React from 'react';
import {
  Wifi,
  BatteryMedium,
  Signal,
  LayoutDashboard,
  Receipt,
  BookOpen,
  Scale,
  BarChart3,
  Users,
  Settings,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar } from './Avatar';
import { TabKey } from '../types';

interface Props {
  isMobileFrame: boolean;
  activeTab?: TabKey;
  setActiveTab?: (tab: TabKey) => void;
  onOpenAddExpense?: () => void;
  bottomBar?: React.ReactNode;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<Props> = ({
  isMobileFrame,
  activeTab = 'home',
  setActiveTab,
  onOpenAddExpense,
  bottomBar,
  children,
}) => {
  const { currentUser, members, group } = useStore();
  const currentMember = members.find((m) => m.user_id === currentUser.id);

  // Desktop Responsive Sidebar View matching the bottom-left & bottom-right mockups in image.jpeg
  if (!isMobileFrame) {
    const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
      { key: 'home', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { key: 'expenses', label: 'Expenses', icon: <Receipt className="w-4 h-4" /> },
      { key: 'udhaar', label: 'Khata / Udhaar', icon: <BookOpen className="w-4 h-4" /> },
      { key: 'balances', label: 'Shared Bills & Balances', icon: <Scale className="w-4 h-4" /> },
      { key: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
      { key: 'settings', label: 'Family Members', icon: <Users className="w-4 h-4" /> },
      { key: 'tests', label: 'Verification Suite', icon: <CheckCircle2 className="w-4 h-4" /> },
    ];

    return (
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row overflow-hidden min-h-[calc(100dvh-64px)]">
        {/* Left Desktop Sidebar matching mockup (collapses on mobile screens) */}
        <aside className="hidden md:flex w-60 lg:w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col shrink-0 p-4 transition-colors">
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-2 pb-6 pt-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-600/30">
              ₹
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100 block leading-none">
                FamilyKhata
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block truncate max-w-[140px]">
                {group.name}
              </span>
            </div>
          </div>

          {/* Quick Action Button */}
          {onOpenAddExpense && (
            <button
              onClick={onOpenAddExpense}
              className="w-full mb-4 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Expense</span>
            </button>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab && setActiveTab(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Current Profile Badge */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 px-2">
            <Avatar name={currentUser.full_name} url={currentUser.avatar_url} size="sm" />
            <div className="min-w-0 flex-1 text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {currentUser.full_name}
              </div>
              <div className="text-[10px] text-slate-400 capitalize">
                {currentMember?.role || 'Admin'}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 max-w-5xl">
          {children}
        </main>

        {/* On mobile screens, render bottom nav if in desktop mode */}
        <div className="md:hidden">
          {bottomBar}
        </div>
      </div>
    );
  }

  // Mobile View: Seamless full-bleed on mobile screens (<640px), elegant iPhone casing on desktop
  return (
    <div className="py-0 sm:py-4 px-0 sm:px-2 flex justify-center items-start min-h-[calc(100dvh-64px)] bg-slate-50 sm:bg-slate-200/70 dark:bg-slate-950 sm:dark:bg-slate-950/70 transition-colors">
      <div className="relative w-full sm:max-w-[420px] bg-transparent sm:bg-slate-900 rounded-none sm:rounded-[50px] p-0 sm:p-3 shadow-none sm:shadow-2xl sm:ring-1 sm:ring-slate-900/10 sm:dark:ring-slate-700/50 flex flex-col flex-1 sm:flex-initial">
        {/* Dynamic Island / Speaker Pill (Desktop frame only) */}
        <div className="hidden sm:flex absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 items-center justify-center pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ml-auto mr-3" />
        </div>

        {/* Screen Bezel and Inner Content */}
        <div className="relative bg-slate-50 dark:bg-slate-950 rounded-none sm:rounded-[40px] overflow-hidden min-h-[calc(100dvh-64px)] sm:min-h-[800px] sm:max-h-[88vh] flex flex-col shadow-none sm:shadow-inner transition-colors flex-1">
          {/* Mobile Status Bar (Desktop simulated frame only) */}
          <div className="hidden sm:flex h-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-slate-200 shrink-0 z-40 select-none border-b border-slate-100 dark:border-slate-800">
            <span>9:41</span>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <BatteryMedium className="w-4 h-4" />
            </div>
          </div>

          {/* Screen Body */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 scrollbar-none">
            {children}
          </div>

          {/* Docked Bottom Tab Navigation */}
          {bottomBar}

          {/* Home Indicator Bar (Desktop simulated frame only) */}
          <div className="hidden sm:flex h-4 bg-white/95 dark:bg-slate-900/95 items-center justify-center shrink-0 z-40">
            <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
