import React, { useState } from 'react';
import { formatPaise } from '../../utils/currency';

interface TrendPoint {
  month: string;
  label: string;
  totalPaise: number;
}

interface Props {
  data: TrendPoint[];
  className?: string;
}

export const MonthlyTrendChart: React.FC<Props> = ({ data, className = '' }) => {
  const [activePoint, setActivePoint] = useState<TrendPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
        No monthly trend records yet.
      </div>
    );
  }

  const width = 460;
  const height = 160;
  const paddingX = 40;
  const paddingY = 25;

  const maxPaise = Math.max(...data.map((d) => d.totalPaise), 100000); // at least ₹1000 scale
  const minPaise = 0;

  const getX = (index: number) => {
    if (data.length <= 1) return width / 2;
    return paddingX + (index / (data.length - 1)) * (width - 2 * paddingX);
  };

  const getY = (val: number) => {
    const usableHeight = height - 2 * paddingY;
    const ratio = (val - minPaise) / (maxPaise - minPaise);
    return height - paddingY - ratio * usableHeight;
  };

  const points = data.map((d, i) => `${getX(i)},${getY(d.totalPaise)}`).join(' ');
  const areaPoints = `${getX(0)},${height - paddingY} ${points} ${getX(data.length - 1)},${height - paddingY}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Monthly Spending Trend (INR ₹)</span>
        {activePoint ? (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{activePoint.label}:</span>
            <span className="font-mono-numbers font-bold text-blue-600 dark:text-blue-400">
              {formatPaise(activePoint.totalPaise)}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">Tap point to inspect</span>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="currentColor"
            strokeDasharray="3 3"
            className="text-slate-200 dark:text-slate-800"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
          />

          {/* Filled Area */}
          <polygon points={areaPoints} fill="url(#trendGradient)" />

          {/* Trend Polyline */}
          <polyline
            points={points}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.totalPaise);
            const isHovered = activePoint?.month === d.month;

            return (
              <g key={d.month} className="cursor-pointer" onClick={() => setActivePoint(d)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke="#2563EB"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-200 hover:scale-125"
                  onMouseEnter={() => setActivePoint(d)}
                />
                {/* X-Axis Month Label */}
                <text
                  x={cx}
                  y={height - 6}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 dark:fill-slate-400 font-medium font-mono"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
