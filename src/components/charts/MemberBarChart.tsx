import React from 'react';
import { formatPaise } from '../../utils/currency';
import { Avatar } from '../Avatar';
import { GroupMember } from '../../types';

interface MemberBarItem {
  member: GroupMember;
  spentPaise: number;
  percentage: number;
}

interface Props {
  data: MemberBarItem[];
  totalPaise: number;
  className?: string;
}

export const MemberBarChart: React.FC<Props> = ({ data, totalPaise, className = '' }) => {
  if (data.length === 0 || totalPaise === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        No member spending activity recorded yet.
      </div>
    );
  }

  const maxSpent = Math.max(...data.map((d) => d.spentPaise), 1);

  return (
    <div className={`space-y-3 ${className}`}>
      {data.map(({ member, spentPaise, percentage }) => {
        const barWidth = Math.round((spentPaise / maxSpent) * 100);

        return (
          <div key={member.id} className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar
                  name={member.profile?.full_name || 'Member'}
                  url={member.profile?.avatar_url}
                  size="sm"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {member.profile?.full_name}
                </span>
                {member.role === 'admin' && (
                  <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1 py-0.2 rounded">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono-numbers font-bold text-slate-900 dark:text-slate-100">
                  {formatPaise(spentPaise)}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono-numbers w-7 text-right">
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Horizontal Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
