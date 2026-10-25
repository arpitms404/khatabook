import React, { useState } from 'react';
import { formatPaise } from '../utils/currency';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Bell,
  BellRing,
  X,
  Volume2,
  VolumeX,
  TrendingUp,
} from 'lucide-react';

interface Props {
  currentSpendingPaise: number;
  targetBudgetPaise: number;
  includesPersonal: boolean;
  className?: string;
}

export const BudgetAlert: React.FC<Props> = ({
  currentSpendingPaise,
  targetBudgetPaise,
  includesPersonal,
  className = '',
}) => {
  // Local state to track dismissed notifications or acknowledged alerts
  const [dismissed80, setDismissed80] = useState(false);
  const [dismissed100, setDismissed100] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showNotificationPopup, setShowNotificationPopup] = useState(true);

  // Allow user to simulate different spending levels in preview
  const [simulatedOffsetPercent, setSimulatedOffsetPercent] = useState<number | null>(null);

  const effectiveBudget = Math.max(targetBudgetPaise, 100);
  const rawPercentage = (currentSpendingPaise / effectiveBudget) * 100;
  const percentage = simulatedOffsetPercent !== null ? simulatedOffsetPercent : Math.round(rawPercentage);
  const effectiveSpendingPaise =
    simulatedOffsetPercent !== null
      ? Math.round((simulatedOffsetPercent / 100) * effectiveBudget)
      : currentSpendingPaise;

  const isAtOrAbove80 = percentage >= 80;
  const isAtOrAbove100 = percentage >= 100;

  const remainingPaise = effectiveBudget - effectiveSpendingPaise;
  const overspendPaise = effectiveSpendingPaise - effectiveBudget;

  const resetAlerts = () => {
    setDismissed80(false);
    setDismissed100(false);
    setShowNotificationPopup(true);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Visual Spending Gauge Card */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Current Spending vs Target</span>
          </div>
          <span
            className={`font-mono-numbers font-bold text-xs px-2 py-0.5 rounded-md ${
              isAtOrAbove100
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                : isAtOrAbove80
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            {percentage}% Used
          </span>
        </div>

        {/* Progress bar with 80% and 100% threshold markers */}
        <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden my-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAtOrAbove100
                ? 'bg-rose-600 dark:bg-rose-500'
                : isAtOrAbove80
                ? 'bg-amber-500 dark:bg-amber-400'
                : 'bg-blue-600 dark:bg-blue-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />

          {/* 80% threshold tick line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
            style={{ left: '80%' }}
            title="80% Warning Threshold"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono-numbers">
          <span>Spent: {formatPaise(effectiveSpendingPaise)}</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">80% Threshold</span>
          <span>Budget: {formatPaise(effectiveBudget)}</span>
        </div>
      </div>

      {/* 100% Critical Alert Notification Banner */}
      {isAtOrAbove100 && !dismissed100 && showNotificationPopup && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                  Critical Alert: 100% Budget Exceeded!
                </span>
                <button
                  type="button"
                  onClick={() => setDismissed100(true)}
                  className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 p-0.5"
                  title="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 leading-snug">
                Cumulative family spending has reached <strong>{percentage}%</strong>. The monthly budget is overdrawn by{' '}
                <strong className="font-mono-numbers">{formatPaise(overspendPaise)}</strong>.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-rose-200/70 dark:bg-rose-900/80 rounded font-semibold text-rose-800 dark:text-rose-200">
                  {includesPersonal ? 'Includes Personal + Shared Bills' : 'Shared Bills Only'}
                </span>
                <button
                  type="button"
                  onClick={() => setDismissed100(true)}
                  className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 underline hover:no-underline ml-auto"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 80% Warning Alert Notification Banner */}
      {isAtOrAbove80 && !isAtOrAbove100 && !dismissed80 && showNotificationPopup && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                  Warning: 80% Budget Threshold Reached
                </span>
                <button
                  type="button"
                  onClick={() => setDismissed80(true)}
                  className="text-amber-400 hover:text-amber-700 dark:hover:text-amber-200 p-0.5"
                  title="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-snug">
                You have utilized <strong>{percentage}%</strong> of this month's budget. Only{' '}
                <strong className="font-mono-numbers">{formatPaise(remainingPaise)}</strong> remaining before reaching the limit.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-amber-200/70 dark:bg-amber-900/80 rounded font-semibold text-amber-800 dark:text-amber-200">
                  {includesPersonal ? 'Includes Personal + Shared' : 'Shared Bills Only'}
                </span>
                <button
                  type="button"
                  onClick={() => setDismissed80(true)}
                  className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 underline hover:no-underline ml-auto"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Healthy Under-80% State */}
      {!isAtOrAbove80 && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold block leading-tight">Spending is on track ({percentage}%)</span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono-numbers">
              {formatPaise(remainingPaise)} remaining under the 80% warning limit.
            </span>
          </div>
        </div>
      )}

      {/* Interactive Threshold Simulator (helps user test 80% and 100% states) */}
      <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1.5 font-medium">
          <span className="flex items-center gap-1">
            <BellRing className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>Test Alert Thresholds</span>
          </span>
          {simulatedOffsetPercent !== null && (
            <button
              type="button"
              onClick={() => {
                setSimulatedOffsetPercent(null);
                resetAlerts();
              }}
              className="text-blue-600 dark:text-blue-400 text-[10px] hover:underline"
            >
              Reset to Live ({Math.round(rawPercentage)}%)
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setSimulatedOffsetPercent(50);
              resetAlerts();
            }}
            className={`py-1 px-2 rounded-lg border font-medium transition-all ${
              percentage === 50
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Normal (50%)
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedOffsetPercent(82);
              resetAlerts();
            }}
            className={`py-1 px-2 rounded-lg border font-medium transition-all ${
              percentage === 82
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Warning (82%)
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedOffsetPercent(105);
              resetAlerts();
            }}
            className={`py-1 px-2 rounded-lg border font-medium transition-all ${
              percentage === 105
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Exceeded (105%)
          </button>
        </div>
      </div>
    </div>
  );
};
