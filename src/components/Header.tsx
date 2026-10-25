import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Avatar } from './Avatar';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import {
  Smartphone,
  Monitor,
  ChevronDown,
  Check,
  Sun,
  Moon,
  Laptop,
  Plus,
  Flame,
  LogIn,
  LogOut,
  Download,
  Phone,
} from 'lucide-react';

interface Props {
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  onOpenAddExpense: () => void;
  onOpenDownloadApp?: () => void;
  onOpenPhoneOtp?: () => void;
}

export const Header: React.FC<Props> = ({
  isMobileFrame,
  setIsMobileFrame,
  onOpenAddExpense,
  onOpenDownloadApp,
  onOpenPhoneOtp,
}) => {
  const {
    currentUser,
    switchCurrentUser,
    members,
    group,
    theme,
    setTheme,
    firebaseUser,
    signInWithGoogle,
    signOutFirebase,
  } = useStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeMemberCount = members.filter((m) => m.membership_status === 'active').length;
  const currentMember = members.find((m) => m.user_id === currentUser.id);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base sm:text-xl shadow-md shadow-blue-600/30 shrink-0">
            ₹
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none truncate">
                FamilyKhata
              </span>
              <span className="hidden xs:inline-block text-[10px] sm:text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 sm:px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/50 truncate max-w-[90px] sm:max-w-[130px]">
                {group.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="hidden sm:inline">{activeMemberCount} of 10 members ·</span>
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[10px] sm:text-[11px]">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                <span className="hidden sm:inline">Firebase Connected</span>
                <span className="sm:hidden">Firebase</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Download APK / iOS App Modal Trigger */}
          {onOpenDownloadApp && (
            <button
              onClick={onOpenDownloadApp}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800/60 rounded-xl transition-all active:scale-95 whitespace-nowrap"
              title="Download FamilyKhata Android APK or Install on iOS"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="hidden sm:inline">Get App</span>
              <span className="text-[10px] font-extrabold bg-blue-600 text-white px-1 py-0.5 rounded leading-none">APK/iOS</span>
            </button>
          )}

          {/* Phone OTP Login button */}
          {!firebaseUser && onOpenPhoneOtp && (
            <button
              onClick={onOpenPhoneOtp}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl transition-all active:scale-95 whitespace-nowrap"
              title="Sign in with Mobile OTP"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden xs:inline">OTP</span> Login
            </button>
          )}

          {/* PWA Install Trigger */}
          <PWAInstallPrompt onOpenDownloadModal={onOpenDownloadApp} />

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Current theme: ${theme}. Click to change.`}
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-amber-400" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Laptop className="w-4 h-4 text-blue-500" />
            )}
          </button>

          {/* Mobile Frame toggle (desktop only) */}
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Toggle between Mobile Phone Frame and Responsive Desktop View"
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>Desktop</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>Phone Frame</span>
              </>
            )}
          </button>

          {/* Quick Add Expense Button (hidden on narrow screens to avoid crowding) */}
          <button
            onClick={onOpenAddExpense}
            className="hidden sm:flex px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/20 transition-all whitespace-nowrap items-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>

          {/* Member Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1.5 pl-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-hidden"
              title="Switch user to test multi-member perspective"
            >
              <Avatar name={currentUser.full_name} url={currentUser.avatar_url} size="sm" />
              <div className="hidden md:block text-left text-xs leading-tight pr-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <span className="truncate max-w-[100px]">{currentUser.full_name}</span>
                  {currentMember?.role === 'admin' && (
                    <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-900/40 px-1 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Switch user</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-fade-in">
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Test As Family Member
                </div>
                <div className="space-y-1">
                  {members.map((m) => {
                    const isSelected = m.user_id === currentUser.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          switchCurrentUser(m.user_id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.profile?.full_name || 'Member'} url={m.profile?.avatar_url} size="sm" />
                          <div>
                            <div className="font-medium">{m.profile?.full_name}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{m.role}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-700 dark:text-blue-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* Firebase Auth Section in Dropdown */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  {firebaseUser ? (
                    <div className="px-2 py-1">
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>
                          {firebaseUser.phoneNumber ? `Phone: ${firebaseUser.phoneNumber}` : `Google: ${firebaseUser.email}`}
                        </span>
                      </div>
                      <button
                        onClick={signOutFirebase}
                        className="mt-1 w-full py-1 text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign out of Firebase</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {onOpenPhoneOtp && (
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onOpenPhoneOtp();
                          }}
                          className="w-full py-1.5 px-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sign in with Phone OTP</span>
                        </button>
                      )}
                      <button
                        onClick={signInWithGoogle}
                        className="w-full py-1.5 px-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign in with Google</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
