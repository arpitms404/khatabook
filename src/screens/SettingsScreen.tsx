import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { formatPaise } from '../utils/currency';
import { formatDateIST } from '../utils/date';
import { saveSupabaseConfig, clearSupabaseConfig } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { ThemeMode } from '../types';
import {
  Users,
  Shield,
  UserPlus,
  Database,
  Trash2,
  RefreshCw,
  Bell,
  Check,
  AlertCircle,
  Copy,
  Sun,
  Moon,
  Laptop,
  Smartphone,
  Phone,
  Download,
} from 'lucide-react';

interface Props {
  onOpenInvite: () => void;
  onOpenBudget: () => void;
  onOpenPhoneOtp?: () => void;
  onOpenDownloadApp?: () => void;
}

export const SettingsScreen: React.FC<Props> = ({
  onOpenInvite,
  onOpenBudget,
  onOpenPhoneOtp,
  onOpenDownloadApp,
}) => {
  const {
    currentUser,
    group,
    members,
    removeMember,
    resetToDefaultSeed,
    theme,
    setTheme,
    showToast,
    firebaseUser,
    signInWithGoogle,
    signOutFirebase,
  } = useStore();

  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('familykhata_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('familykhata_supabase_key') || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  const currentMember = members.find((m) => m.user_id === currentUser.id);
  const isAdmin = currentMember?.role === 'admin';
  const activeCount = members.filter((m) => m.membership_status === 'active').length;

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      clearSupabaseConfig();
      setSaveStatus('Cleared Supabase credentials. Operating on reactive local storage.');
    } else {
      saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
      setSaveStatus('Supabase credentials saved! Connected to live backend.');
    }
    showToast('Database configuration updated', 'info');
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(group.invite_code);
    setCopiedCode(true);
    showToast(`Invite code ${group.invite_code} copied!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRemove = async (userId: string, name: string) => {
    if (confirm(`Remove ${name} from ${group.name}?`)) {
      const res = await removeMember(userId);
      if (!res.success) {
        showToast(res.error || 'Failed to remove member.', 'error');
      } else {
        showToast(`${name} removed from family`, 'info');
      }
    }
  };

  return (
    <div className="space-y-5 pb-24 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold leading-tight">Settings &amp; Preferences</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Theme, family membership, budget limits, and database connection
        </p>
      </div>

      {/* Theme Appearance Selector */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-sm font-bold">App Appearance &amp; Theme</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose your visual preference or automatically follow your device settings
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
              theme === 'light'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span className="text-xs">Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
              theme === 'dark'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Moon className="w-5 h-5 text-amber-400" />
            <span className="text-xs">Dark Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
              theme === 'system'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Laptop className="w-5 h-5" />
            <span className="text-xs">System Theme</span>
          </button>
        </div>
      </div>

      {/* Family Group Info Card */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">{group.name}</h3>
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                Active Group
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Created {formatDateIST(group.created_at)} · Currency: {group.currency_code} (₹)
            </p>
          </div>
          <button
            onClick={onOpenInvite}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
        </div>

        {/* Capacity bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">10-Member Capacity</span>
            <span className="font-mono-numbers font-bold text-blue-700 dark:text-blue-400">
              {activeCount} / 10 active spots
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(activeCount / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Invite Code row */}
        <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Invite Code:</span>
            <span className="font-mono font-bold text-blue-900 dark:text-blue-200 tracking-wider text-sm">
              {group.invite_code}
            </span>
          </div>
          <button
            onClick={handleCopyInvite}
            className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold rounded-lg flex items-center gap-1 transition-colors"
          >
            {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Family Members List */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>Active Members ({members.length})</span>
          </h3>
          <span className="text-[11px] text-slate-400">Strict 10-member ceiling</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {members.map((m) => {
            const isMe = m.user_id === currentUser.id;
            const canRemove = isAdmin && !isMe;

            return (
              <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={m.profile?.full_name || 'Member'} url={m.profile?.avatar_url} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold truncate">{m.profile?.full_name}</span>
                      {isMe && <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">(You)</span>}
                      {m.role === 'admin' ? (
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-1 rounded">
                          Admin
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Member</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Joined {formatDateIST(m.joined_at)} · {m.profile?.phone || 'No phone'}
                    </div>
                  </div>
                </div>

                {canRemove && (
                  <button
                    onClick={() => handleRemove(m.user_id, m.profile?.full_name || 'Member')}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Budget Policy */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Monthly Family Budget</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Current budget: <strong className="font-mono-numbers">{formatPaise(group.monthly_budget_paise)}</strong>
            </p>
          </div>
          <button
            onClick={onOpenBudget}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Edit Budget
          </button>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          Personal expenses included in budget: <strong>{group.budget_includes_personal ? 'Yes' : 'No (Shared bills only)'}</strong>
        </div>
      </div>

      {/* Supabase Connection Settings */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold">Supabase PostgreSQL Backend</h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The app works completely out of the box with reactive state. If you wish to connect to your live Supabase project, provide your project details:
        </p>

        {saveStatus && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{saveStatus}</span>
          </div>
        )}

        <form onSubmit={handleSaveSupabase} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Anon Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              Save Credentials
            </button>
            <button
              type="button"
              onClick={() => {
                setSupabaseUrl('');
                setSupabaseKey('');
                clearSupabaseConfig();
                setSaveStatus('Cleared Supabase credentials.');
              }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Firebase Phone OTP Authentication */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Firebase Phone OTP Authentication</span>
          </h3>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            {firebaseUser ? 'Authenticated' : 'Not Connected'}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Verify family members via SMS One-Time Password (OTP) with real-time cloud data sync.
        </p>

        {firebaseUser ? (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {firebaseUser.phoneNumber || firebaseUser.email || firebaseUser.displayName || 'Authenticated User'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">UID: {firebaseUser.uid}</div>
              </div>
              <button
                onClick={signOutFirebase}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold text-xs rounded-xl transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            {onOpenPhoneOtp && (
              <button
                onClick={onOpenPhoneOtp}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Sign in with Mobile OTP</span>
              </button>
            )}
            <button
              onClick={signInWithGoogle}
              className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Google Login</span>
            </button>
          </div>
        )}
      </div>

      {/* PWA & Install Options */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span>Progressive Web App (PWA)</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Install FamilyKhata on your Android, iOS, or desktop home screen for one-tap access and offline reliability.
        </p>
        <div className="pt-1 flex flex-wrap gap-2">
          {onOpenDownloadApp && (
            <button
              onClick={onOpenDownloadApp}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download APK / iOS Guide</span>
            </button>
          )}
          <PWAInstallPrompt onOpenDownloadModal={onOpenDownloadApp} />
        </div>
      </div>

      {/* Reset Seed Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            if (confirm('Reset all demo data back to the original Sharma Family seed?')) {
              resetToDefaultSeed();
            }
          }}
          className="w-full py-2.5 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-200 text-rose-600 dark:text-rose-400 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset All Data to Default Demo Seed</span>
        </button>
      </div>
    </div>
  );
};
