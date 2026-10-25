import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { X, Copy, Check, Users, UserPlus, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { group, members, joinGroupWithInvite } = useStore();
  const [copied, setCopied] = useState(false);
  const [testName, setTestName] = useState('');
  const [testJoinMsg, setTestJoinMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const activeCount = members.filter((m) => m.membership_status === 'active').length;
  const isFull = activeCount >= 10;

  const handleCopy = () => {
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;

    const res = await joinGroupWithInvite(group.invite_code, testName.trim());
    if (res.success) {
      setTestJoinMsg({ text: `Successfully added "${testName}" to ${group.name}!`, isError: false });
      setTestName('');
    } else {
      setTestJoinMsg({ text: res.error || 'Failed to join group.', isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Invite Family Member</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Up to 10 members in {group.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Member Capacity Tracker */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Family Group Capacity</span>
              <span className={`font-bold font-mono-numbers ${isFull ? 'text-rose-600' : 'text-blue-700'}`}>
                {activeCount} / 10 active members
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isFull ? 'bg-rose-500' : 'bg-blue-600'
                }`}
                style={{ width: `${(activeCount / 10) * 100}%` }}
              />
            </div>
            {isFull && (
              <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Maximum capacity reached. No additional members can be added.
              </p>
            )}
          </div>

          {/* Secure Invite Code Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Family Invitation Code
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-blue-50/70 border border-blue-200 rounded-xl font-mono text-center text-lg font-bold tracking-widest text-blue-900 select-all">
                {group.invite_code}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Share this code with family members. Valid for new members joining {group.name}.
            </p>
          </div>

          {/* Test Simulation Joiner */}
          {!isFull && (
            <form onSubmit={handleQuickJoin} className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Test Join a Member (Simulation)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g., Uncle Ramesh, Chachi Sita"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <button
                  type="submit"
                  disabled={!testName.trim()}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  Join
                </button>
              </div>

              {testJoinMsg && (
                <div
                  className={`mt-2 p-2 rounded-lg text-xs ${
                    testJoinMsg.isError
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {testJoinMsg.text}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
