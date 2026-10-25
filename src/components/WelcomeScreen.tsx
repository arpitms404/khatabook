import React from 'react';
import {
  Users,
  BookOpen,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  X,
  ArrowRight,
  LogIn,
  Phone,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
  onSignIn: () => void;
  onOpenPhoneOtp?: () => void;
}

export const WelcomeScreen: React.FC<Props> = ({
  isOpen,
  onClose,
  onGetStarted,
  onSignIn,
  onOpenPhoneOtp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex flex-col transition-colors relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top House Illustration Zone matching mockup #1 */}
        <div className="pt-8 pb-4 px-6 flex flex-col items-center text-center">
          {/* House Vector Art */}
          <div className="w-28 h-28 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mb-4 relative shadow-sm">
            <svg
              className="w-16 h-16 text-blue-600 dark:text-blue-400"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M32 10L8 28V52C8 53.1 8.9 54 10 54H24V38H40V54H54C55.1 54 56 53.1 56 52V28L32 10Z"
                fill="currentColor"
                fillOpacity="0.2"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M24 54V38H40V54"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 29L32 8L60 29"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="48" cy="22" r="3" fill="#10b981" />
            </svg>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            FamilyKhata
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Ghar ka hisaab, sabke saath
          </p>
        </div>

        {/* Features List matching mockup #1 */}
        <div className="px-6 py-2 space-y-3">
          <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">Shared family expenses</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">Udhaar & settlements</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <PieChart className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">Monthly budget & reports</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">10 family members capacity</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">Safe & secure with Firebase</span>
          </div>
        </div>

        {/* Action Buttons matching mockup #1 */}
        <div className="p-6 pt-4 space-y-2">
          <button
            onClick={() => {
              onGetStarted();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 active:scale-[0.99] transition-all"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {onOpenPhoneOtp && (
            <button
              onClick={() => {
                onClose();
                onOpenPhoneOtp();
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/60 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Sign In with Phone OTP (SMS)</span>
            </button>
          )}

          <button
            onClick={() => {
              onSignIn();
              onClose();
            }}
            className="w-full py-2 px-4 rounded-2xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In with Google Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
