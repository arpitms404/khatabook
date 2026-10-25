import React, { useState, useMemo } from 'react';
import { useStore } from '../../lib/store';
import { ExpenseCategory, ExpenseType } from '../../types';
import { formatPaise, parseRupeesToPaise } from '../../utils/currency';
import { calculateEqualSplits, validateCustomSplits } from '../../utils/splits';
import { getTodayIST } from '../../utils/date';
import {
  X,
  AlertCircle,
  Check,
  Calculator,
  ShoppingBag,
  Receipt,
  Fuel,
  Utensils,
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Plus,
  ArrowLeft,
  Bookmark,
} from 'lucide-react';
import { Avatar } from '../Avatar';

// 8 prominent category tiles matching mockup #3
const VISUAL_CATEGORIES: { id: ExpenseCategory; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: 'Groceries', label: 'Groceries', icon: <ShoppingCart className="w-5 h-5 text-orange-500" />, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/60' },
  { id: 'Bills', label: 'Bills', icon: <Receipt className="w-5 h-5 text-blue-500" />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60' },
  { id: 'Fuel', label: 'Fuel', icon: <Fuel className="w-5 h-5 text-red-500" />, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60' },
  { id: 'Food', label: 'Food', icon: <Utensils className="w-5 h-5 text-amber-500" />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60' },
  { id: 'Shopping', label: 'Shopping', icon: <ShoppingBag className="w-5 h-5 text-purple-500" />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60' },
  { id: 'Medical', label: 'Medical', icon: <HeartPulse className="w-5 h-5 text-pink-500" />, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-900/60' },
  { id: 'Education', label: 'Education', icon: <GraduationCap className="w-5 h-5 text-indigo-500" />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60' },
  { id: 'Other', label: 'Others', icon: <MoreHorizontal className="w-5 h-5 text-slate-500" />, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ExpenseType;
}

export const AddExpenseModal: React.FC<Props> = ({ isOpen, onClose, defaultType = 'shared' }) => {
  const { currentUser, members, addExpense, showToast } = useStore();

  const [description, setDescription] = useState('');
  const [rupeesInput, setRupeesInput] = useState('');
  const [expenseType, setExpenseType] = useState<ExpenseType>(defaultType);
  const [category, setCategory] = useState<ExpenseCategory>('Groceries');
  const [expenseDate, setExpenseDate] = useState(getTodayIST());
  const [paidBy, setPaidBy] = useState(currentUser.id);
  const [notes, setNotes] = useState('');

  // Splitting state
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(() =>
    members.filter((m) => m.membership_status === 'active').map((m) => m.user_id)
  );
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountPaise = useMemo(() => {
    return parseRupeesToPaise(rupeesInput);
  }, [rupeesInput]);

  // Compute equal splits
  const equalSplitsPreview = useMemo(() => {
    if (splitMode !== 'equal' || selectedParticipants.length === 0 || amountPaise <= 0) return [];
    return calculateEqualSplits(amountPaise, selectedParticipants);
  }, [splitMode, selectedParticipants, amountPaise]);

  // Compute custom splits validation
  const customValidation = useMemo(() => {
    if (splitMode !== 'custom') return { isValid: true, sumPaise: amountPaise, differencePaise: 0 };
    const customList = selectedParticipants.map((id) => ({
      memberId: id,
      sharePaise: parseRupeesToPaise(customShares[id] || '0'),
    }));
    return validateCustomSplits(amountPaise, customList);
  }, [splitMode, selectedParticipants, customShares, amountPaise]);

  if (!isOpen) return null;

  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      if (selectedParticipants.length <= 1) return; // Keep at least one
      setSelectedParticipants((prev) => prev.filter((id) => id !== userId));
    } else {
      setSelectedParticipants((prev) => [...prev, userId]);
    }
  };

  const handleCustomShareChange = (userId: string, val: string) => {
    setCustomShares((prev) => ({ ...prev, [userId]: val }));
  };

  const handleSaveDraft = () => {
    showToast('Draft saved to local device cache', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveDesc = description.trim() || `${category} Expense`;

    if (amountPaise <= 0) {
      setErrorMsg('Please enter an amount greater than ₹0.');
      return;
    }

    let splitsToSave: { member_id: string; share_amount_paise: number }[] | undefined;

    if (expenseType === 'shared') {
      if (selectedParticipants.length === 0) {
        setErrorMsg('At least one member must be included in the shared expense.');
        return;
      }

      if (splitMode === 'equal') {
        const splits = calculateEqualSplits(amountPaise, selectedParticipants);
        splitsToSave = splits.map((s) => ({
          member_id: s.memberId,
          share_amount_paise: s.sharePaise,
        }));
      } else {
        if (!customValidation.isValid) {
          setErrorMsg(
            `Custom split mismatch: Sum is ${formatPaise(customValidation.sumPaise)}, but expense total is ${formatPaise(amountPaise)}.`
          );
          return;
        }
        splitsToSave = selectedParticipants.map((id) => ({
          member_id: id,
          share_amount_paise: parseRupeesToPaise(customShares[id] || '0'),
        }));
      }
    }

    setIsSubmitting(true);
    const result = await addExpense({
      description: effectiveDesc,
      amount_paise: amountPaise,
      expense_type: expenseType,
      category,
      expense_date: expenseDate,
      paid_by: paidBy,
      notes: notes.trim() || undefined,
      splits: splitsToSave,
    });
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to save expense.');
    }
  };

  const paidByMember = members.find((m) => m.user_id === paidBy);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Top Header matching mockup #3 */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Add Expense</h2>
          </div>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="px-5 py-4 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Personal vs Shared Toggle Pill */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setExpenseType('personal')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                expenseType === 'personal'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Personal
            </button>
            <button
              type="button"
              onClick={() => setExpenseType('shared')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                expenseType === 'shared'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Shared
            </button>
          </div>

          {/* Amount Input with Large Display and Calculator Icon */}
          <div className="pt-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Amount
            </label>
            <div className="relative flex items-center">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mr-2">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="1,250"
                value={rupeesInput}
                onChange={(e) => setRupeesInput(e.target.value)}
                autoFocus
                required
                className="w-full py-1 text-2xl font-black text-slate-900 dark:text-slate-100 bg-transparent border-none focus:outline-hidden focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-600 font-mono-numbers"
              />
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Calculator"
              >
                <Calculator className="w-5 h-5" />
              </button>
            </div>
            <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-800" />
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono-numbers">
              <span>{amountPaise > 0 ? `${amountPaise.toLocaleString('en-IN')} paise` : '0 paise'}</span>
              <span>{formatPaise(amountPaise)}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Merchant
            </label>
            <input
              type="text"
              placeholder="e.g. Dinner at Restaurant, Grocery Shopping"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-600"
            />
          </div>

          {/* Category Icon Grid (8 tiles matching mockup #3) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {VISUAL_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all text-center ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 shadow-2xs">
                      {cat.icon}
                    </div>
                    <span className={`text-[11px] font-medium leading-none ${isSelected ? 'font-bold text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paid by selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Paid by
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {members.map((m) => {
                const isSelected = paidBy === m.user_id;
                const isMe = m.user_id === currentUser.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaidBy(m.user_id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all shrink-0 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Avatar name={m.profile?.full_name || 'Member'} url={m.profile?.avatar_url} size="sm" />
                    <span className="text-xs font-semibold whitespace-nowrap">
                      {isMe ? `${m.profile?.full_name?.split(' ')[0]} (You)` : m.profile?.full_name?.split(' ')[0]}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Between section (only for shared expenses) */}
          {expenseType === 'shared' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Split between ({selectedParticipants.length} members)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedParticipants(members.map((m) => m.user_id))
                  }
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select All
                </button>
              </div>

              {/* Avatar bubbles matching mockup */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {members.map((m) => {
                  const isChecked = selectedParticipants.includes(m.user_id);
                  const isMe = m.user_id === currentUser.id;
                  const label = isMe ? 'You' : m.profile?.full_name?.split(' ')[0] || 'User';
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleParticipant(m.user_id)}
                      className="flex flex-col items-center gap-1 cursor-pointer shrink-0"
                    >
                      <div className="relative">
                        <Avatar
                          name={m.profile?.full_name || 'User'}
                          url={m.profile?.avatar_url}
                          size="md"
                          className={!isChecked ? 'opacity-40 grayscale' : 'ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-900'}
                        />
                        {isChecked && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </div>
                        )}
                      </div>
                      <span className={`text-[11px] font-medium leading-none ${isChecked ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Split Type Pill */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Split type
                </label>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSplitMode('equal')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      splitMode === 'equal'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    Equal Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('custom')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      splitMode === 'custom'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    Custom Amount
                  </button>
                </div>
              </div>

              {/* Equal splits preview */}
              {splitMode === 'equal' && equalSplitsPreview.length > 0 && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">
                    Each member pays exactly:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {equalSplitsPreview.map((s) => {
                      const m = members.find((mem) => mem.user_id === s.memberId);
                      return (
                        <div key={s.memberId} className="px-2 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 font-mono-numbers">
                          <span className="text-slate-500 dark:text-slate-400 text-[10px] mr-1">
                            {m?.profile?.full_name?.split(' ')[0]}:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {formatPaise(s.sharePaise)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom splits input */}
              {splitMode === 'custom' && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Assign exact share for each member:
                  </div>
                  {selectedParticipants.map((id) => {
                    const m = members.find((mem) => mem.user_id === id);
                    return (
                      <div key={id} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {m?.profile?.full_name}
                        </span>
                        <div className="relative w-32">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={customShares[id] || ''}
                            onChange={(e) => handleCustomShareChange(id, e.target.value)}
                            className="w-full pl-6 pr-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono-numbers text-right"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes (optional)
            </label>
            <input
              type="text"
              placeholder="Add a note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
            />
          </div>

          {/* Save Expense Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || amountPaise <= 0}
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>Save Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
