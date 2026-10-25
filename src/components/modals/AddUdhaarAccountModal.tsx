import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { UdhaarAccountType } from '../../types';
import { parseRupeesToPaise } from '../../utils/currency';
import { X, UserPlus, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddUdhaarAccountModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addUdhaarAccount } = useStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<UdhaarAccountType>('friend');
  const [openingBalanceRupees, setOpeningBalanceRupees] = useState('');
  const [balanceDirection, setBalanceDirection] = useState<'receivable' | 'payable'>('receivable');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter a person or business name.');
      return;
    }

    const rawPaise = parseRupeesToPaise(openingBalanceRupees || '0');
    // Positive = You will get (Receivable), Negative = You will give (Payable)
    const openingPaise = balanceDirection === 'receivable' ? rawPaise : -rawPaise;

    setIsSubmitting(true);
    const result = await addUdhaarAccount({
      name: name.trim(),
      phone: phone.trim() || undefined,
      account_type: accountType,
      opening_balance_paise: openingPaise,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to add account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Add Udhaar Account</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a credit/debit ledger for a person, vendor, or family friend
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Person / Business Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Uncle, Sharma Kirana, Maid Sunita"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Relation / Category
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as UdhaarAccountType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="friend">Friend</option>
                <option value="family">Extended Family</option>
                <option value="neighbor">Neighbor</option>
                <option value="shopkeeper">Shopkeeper / Vendor</option>
                <option value="staff">Household Staff</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Opening balance */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Opening Balance (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setBalanceDirection('receivable')}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                  balanceDirection === 'receivable'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                You Will Get (They owe you)
              </button>
              <button
                type="button"
                onClick={() => setBalanceDirection('payable')}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                  balanceDirection === 'payable'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                You Will Give (You owe them)
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={openingBalanceRupees}
                onChange={(e) => setOpeningBalanceRupees(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono-numbers"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Milk delivery account, festival loan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Adding to Khata...</span>
              ) : (
                <>
                  <span>Save Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
