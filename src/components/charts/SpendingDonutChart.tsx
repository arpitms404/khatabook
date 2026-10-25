import React, { useState } from 'react';
import { formatPaise } from '../../utils/currency';
import { CategoryIcon, getCategoryColor } from '../CategoryIcon';
import { ExpenseCategory } from '../../types';

interface CategoryData {
  category: ExpenseCategory;
  amountPaise: number;
  percentage: number;
}

interface Props {
  data: CategoryData[];
  totalPaise: number;
  className?: string;
}

const PALETTE = [
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#EF4444', // Red
  '#14B8A6', // Cyan
  '#F97316', // Orange
  '#64748B', // Slate
];

export const SpendingDonutChart: React.FC<Props> = ({ data, totalPaise, className = '' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0 || totalPaise === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
        No expense data available for this period.
      </div>
    );
  }

  // Calculate SVG arc paths
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;

  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-6 ${className}`}>
      {/* SVG Donut Visual */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Base background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />

          {/* Slices */}
          {data.map((item, idx) => {
            const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativeAngle;
            cumulativeAngle += (item.percentage / 100) * circumference;
            const color = PALETTE[idx % PALETTE.length];
            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={item.category}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Text (Total or Hovered Category) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-[100px]">
            {activeItem ? activeItem.category : 'Total Spent'}
          </span>
          <span className="font-mono-numbers font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
            {activeItem ? formatPaise(activeItem.amountPaise) : formatPaise(totalPaise)}
          </span>
          {activeItem && (
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono-numbers">
              {activeItem.percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Interactive Legend Grid */}
      <div className="flex-1 w-full space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {data.map((item, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const isSelected = hoveredIdx === idx;

          return (
            <div
              key={item.category}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs ${
                isSelected
                  ? 'bg-blue-50/70 dark:bg-blue-900/30 ring-1 ring-blue-400'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono-numbers font-semibold text-slate-900 dark:text-slate-100">
                  {formatPaise(item.amountPaise)}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono-numbers w-7 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
