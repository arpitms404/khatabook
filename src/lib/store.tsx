import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Profile,
  FamilyGroup,
  GroupMember,
  Expense,
  ExpenseSplit,
  Settlement,
  AuditLog,
  MemberBalance,
  DebtPayment,
  ExpenseCategory,
  ExpenseType,
  UdhaarAccount,
  UdhaarTransaction,
  UdhaarAccountSummary,
  UdhaarAccountType,
  UdhaarTransactionType,
  PaymentMode,
  ThemeMode,
} from '../types';
import { calculateMemberBalances, simplifyDebts } from '../utils/settlements';
import { calculateEqualSplits } from '../utils/splits';
import { getTodayIST } from '../utils/date';
import { ToastMessage } from '../components/Toast';
import {
  db,
  auth,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User as FbUser } from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';

// Initial Seed Data aligned exactly with user reference mockup
const INITIAL_PROFILES: Profile[] = [
  {
    id: 'u1',
    full_name: 'Ankit Srivastav',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    phone: '+91 98200 11223',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'u2',
    full_name: 'Sunita Srivastav (Mom)',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    phone: '+91 98200 22334',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'u3',
    full_name: 'Ramesh Srivastav (Dad)',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    phone: '+91 98200 33445',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'u4',
    full_name: 'Neha Srivastav (Sister)',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    phone: '+91 98200 44556',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
];

const INITIAL_GROUP: FamilyGroup = {
  id: 'g1',
  name: 'Srivastava Family',
  created_by: 'u1',
  currency_code: 'INR',
  monthly_budget_paise: 5000000, // ₹50,000.00
  budget_includes_personal: true,
  invite_code: 'SRIVASTAVA7',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

const INITIAL_MEMBERS: GroupMember[] = [
  { id: 'm1', group_id: 'g1', user_id: 'u1', role: 'admin', membership_status: 'active', joined_at: '2026-09-01T00:00:00Z', profile: INITIAL_PROFILES[0] },
  { id: 'm2', group_id: 'g1', user_id: 'u2', role: 'member', membership_status: 'active', joined_at: '2026-09-01T00:00:00Z', profile: INITIAL_PROFILES[1] },
  { id: 'm3', group_id: 'g1', user_id: 'u3', role: 'member', membership_status: 'active', joined_at: '2026-09-01T00:00:00Z', profile: INITIAL_PROFILES[2] },
  { id: 'm4', group_id: 'g1', user_id: 'u4', role: 'member', membership_status: 'active', joined_at: '2026-09-01T00:00:00Z', profile: INITIAL_PROFILES[3] },
];

// Seed expenses mirroring exact figures from the reference mockup
const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e1',
    group_id: 'g1',
    description: 'Dinner at Restaurant',
    amount_paise: 125000, // ₹1,250
    currency_code: 'INR',
    expense_type: 'shared',
    category: 'Food',
    expense_date: '2026-10-19',
    paid_by: 'u1', // Ankit
    created_by: 'u1',
    notes: 'Family dinner after shopping',
    created_at: '2026-10-19T20:45:00Z',
    updated_at: '2026-10-19T20:45:00Z',
    splits: [
      { id: 's1', expense_id: 'e1', group_id: 'g1', member_id: 'u1', share_amount_paise: 31250, created_at: '2026-10-19T20:45:00Z' },
      { id: 's2', expense_id: 'e1', group_id: 'g1', member_id: 'u2', share_amount_paise: 31250, created_at: '2026-10-19T20:45:00Z' },
      { id: 's3', expense_id: 'e1', group_id: 'g1', member_id: 'u3', share_amount_paise: 31250, created_at: '2026-10-19T20:45:00Z' },
      { id: 's4', expense_id: 'e1', group_id: 'g1', member_id: 'u4', share_amount_paise: 31250, created_at: '2026-10-19T20:45:00Z' },
    ],
  },
  {
    id: 'e2',
    group_id: 'g1',
    description: 'Grocery Shopping',
    amount_paise: 234000, // ₹2,340
    currency_code: 'INR',
    expense_type: 'shared',
    category: 'Groceries',
    expense_date: '2026-10-19',
    paid_by: 'u2', // Mom
    created_by: 'u2',
    notes: 'Vegetables, milk, fruits, and weekly essentials',
    created_at: '2026-10-19T13:20:00Z',
    updated_at: '2026-10-19T13:20:00Z',
    splits: [
      { id: 's5', expense_id: 'e2', group_id: 'g1', member_id: 'u1', share_amount_paise: 58500, created_at: '2026-10-19T13:20:00Z' },
      { id: 's6', expense_id: 'e2', group_id: 'g1', member_id: 'u2', share_amount_paise: 58500, created_at: '2026-10-19T13:20:00Z' },
      { id: 's7', expense_id: 'e2', group_id: 'g1', member_id: 'u3', share_amount_paise: 58500, created_at: '2026-10-19T13:20:00Z' },
      { id: 's8', expense_id: 'e2', group_id: 'g1', member_id: 'u4', share_amount_paise: 58500, created_at: '2026-10-19T13:20:00Z' },
    ],
  },
  {
    id: 'e3',
    group_id: 'g1',
    description: 'Mobile Recharge',
    amount_paise: 29900, // ₹299
    currency_code: 'INR',
    expense_type: 'personal',
    category: 'Bills',
    expense_date: '2026-10-19',
    paid_by: 'u1', // Ankit
    created_by: 'u1',
    notes: 'Jio 5G monthly pack',
    created_at: '2026-10-19T10:15:00Z',
    updated_at: '2026-10-19T10:15:00Z',
    splits: [
      { id: 's9', expense_id: 'e3', group_id: 'g1', member_id: 'u1', share_amount_paise: 29900, created_at: '2026-10-19T10:15:00Z' },
    ],
  },
  {
    id: 'e4',
    group_id: 'g1',
    description: 'Electricity Bill',
    amount_paise: 198000, // ₹1,980
    currency_code: 'INR',
    expense_type: 'shared',
    category: 'Bills',
    expense_date: '2026-10-18',
    paid_by: 'u3', // Dad
    created_by: 'u3',
    notes: 'Power grid monthly bill',
    created_at: '2026-10-18T21:30:00Z',
    updated_at: '2026-10-18T21:30:00Z',
    splits: [
      { id: 's10', expense_id: 'e4', group_id: 'g1', member_id: 'u1', share_amount_paise: 49500, created_at: '2026-10-18T21:30:00Z' },
      { id: 's11', expense_id: 'e4', group_id: 'g1', member_id: 'u2', share_amount_paise: 49500, created_at: '2026-10-18T21:30:00Z' },
      { id: 's12', expense_id: 'e4', group_id: 'g1', member_id: 'u3', share_amount_paise: 49500, created_at: '2026-10-18T21:30:00Z' },
      { id: 's13', expense_id: 'e4', group_id: 'g1', member_id: 'u4', share_amount_paise: 49500, created_at: '2026-10-18T21:30:00Z' },
    ],
  },
  {
    id: 'e5',
    group_id: 'g1',
    description: 'Medicines',
    amount_paise: 52000, // ₹520
    currency_code: 'INR',
    expense_type: 'personal',
    category: 'Medical',
    expense_date: '2026-10-18',
    paid_by: 'u2', // Mom
    created_by: 'u2',
    notes: 'Prescription wellness medicines',
    created_at: '2026-10-18T16:10:00Z',
    updated_at: '2026-10-18T16:10:00Z',
    splits: [
      { id: 's14', expense_id: 'e5', group_id: 'g1', member_id: 'u2', share_amount_paise: 52000, created_at: '2026-10-18T16:10:00Z' },
    ],
  },
  {
    id: 'e6',
    group_id: 'g1',
    description: 'Fuel',
    amount_paise: 150000, // ₹1,500
    currency_code: 'INR',
    expense_type: 'personal',
    category: 'Fuel',
    expense_date: '2026-10-17',
    paid_by: 'u1', // Ankit
    created_by: 'u1',
    notes: 'Petrol pump refill',
    created_at: '2026-10-17T19:20:00Z',
    updated_at: '2026-10-17T19:20:00Z',
    splits: [
      { id: 's15', expense_id: 'e6', group_id: 'g1', member_id: 'u1', share_amount_paise: 150000, created_at: '2026-10-17T19:20:00Z' },
    ],
  },
  {
    id: 'e7',
    group_id: 'g1',
    description: 'Monthly Supermarket Staples & Pantry',
    amount_paise: 562600, // Groceries
    currency_code: 'INR',
    expense_type: 'shared',
    category: 'Groceries',
    expense_date: '2026-10-10',
    paid_by: 'u1',
    created_by: 'u1',
    notes: 'Atta, rice, oils, pulses, tea',
    created_at: '2026-10-10T11:00:00Z',
    updated_at: '2026-10-10T11:00:00Z',
    splits: [
      { id: 's16', expense_id: 'e7', group_id: 'g1', member_id: 'u1', share_amount_paise: 140650, created_at: '2026-10-10T11:00:00Z' },
      { id: 's17', expense_id: 'e7', group_id: 'g1', member_id: 'u2', share_amount_paise: 140650, created_at: '2026-10-10T11:00:00Z' },
      { id: 's18', expense_id: 'e7', group_id: 'g1', member_id: 'u3', share_amount_paise: 140650, created_at: '2026-10-10T11:00:00Z' },
      { id: 's19', expense_id: 'e7', group_id: 'g1', member_id: 'u4', share_amount_paise: 140650, created_at: '2026-10-10T11:00:00Z' },
    ],
  },
  {
    id: 'e8',
    group_id: 'g1',
    description: 'Broadband Wi-Fi & Maintenance',
    amount_paise: 283500, // Bills
    currency_code: 'INR',
    expense_type: 'shared',
    category: 'Bills',
    expense_date: '2026-10-06',
    paid_by: 'u3',
    created_by: 'u3',
    notes: 'High speed fiber & society maintenance',
    created_at: '2026-10-06T15:00:00Z',
    updated_at: '2026-10-06T15:00:00Z',
    splits: [
      { id: 's20', expense_id: 'e8', group_id: 'g1', member_id: 'u1', share_amount_paise: 70875, created_at: '2026-10-06T15:00:00Z' },
      { id: 's21', expense_id: 'e8', group_id: 'g1', member_id: 'u2', share_amount_paise: 70875, created_at: '2026-10-06T15:00:00Z' },
      { id: 's22', expense_id: 'e8', group_id: 'g1', member_id: 'u3', share_amount_paise: 70875, created_at: '2026-10-06T15:00:00Z' },
      { id: 's23', expense_id: 'e8', group_id: 'g1', member_id: 'u4', share_amount_paise: 70875, created_at: '2026-10-06T15:00:00Z' },
    ],
  },
  {
    id: 'e9',
    group_id: 'g1',
    description: 'Diwali Festive Shopping & Gifts',
    amount_paise: 426800, // Shopping
    currency_code: 'INR',
    expense_type: 'shared',
    category: 'Shopping',
    expense_date: '2026-10-12',
    paid_by: 'u1',
    created_by: 'u1',
    notes: 'Ethnic wear and sweets',
    created_at: '2026-10-12T18:00:00Z',
    updated_at: '2026-10-12T18:00:00Z',
    splits: [
      { id: 's24', expense_id: 'e9', group_id: 'g1', member_id: 'u1', share_amount_paise: 106700, created_at: '2026-10-12T18:00:00Z' },
      { id: 's25', expense_id: 'e9', group_id: 'g1', member_id: 'u2', share_amount_paise: 106700, created_at: '2026-10-12T18:00:00Z' },
      { id: 's26', expense_id: 'e9', group_id: 'g1', member_id: 'u3', share_amount_paise: 106700, created_at: '2026-10-12T18:00:00Z' },
      { id: 's27', expense_id: 'e9', group_id: 'g1', member_id: 'u4', share_amount_paise: 106700, created_at: '2026-10-12T18:00:00Z' },
    ],
  },
  {
    id: 'e10',
    group_id: 'g1',
    description: 'Health Checkup & Diagnostics',
    amount_paise: 289500, // Medical
    currency_code: 'INR',
    expense_type: 'shared',
    category: 'Medical',
    expense_date: '2026-10-08',
    paid_by: 'u3',
    created_by: 'u3',
    notes: 'Routine blood tests and doctor consultation',
    created_at: '2026-10-08T11:00:00Z',
    updated_at: '2026-10-08T11:00:00Z',
    splits: [
      { id: 's28', expense_id: 'e10', group_id: 'g1', member_id: 'u1', share_amount_paise: 72375, created_at: '2026-10-08T11:00:00Z' },
      { id: 's29', expense_id: 'e10', group_id: 'g1', member_id: 'u2', share_amount_paise: 72375, created_at: '2026-10-08T11:00:00Z' },
      { id: 's30', expense_id: 'e10', group_id: 'g1', member_id: 'u3', share_amount_paise: 72375, created_at: '2026-10-08T11:00:00Z' },
      { id: 's31', expense_id: 'e10', group_id: 'g1', member_id: 'u4', share_amount_paise: 72375, created_at: '2026-10-08T11:00:00Z' },
    ],
  },
  {
    id: 'e11',
    group_id: 'g1',
    description: 'Family Outing & Cab Travel',
    amount_paise: 284500, // Travel
    currency_code: 'INR',
    expense_type: 'shared',
    category: 'Travel',
    expense_date: '2026-10-14',
    paid_by: 'u1',
    created_by: 'u1',
    notes: 'Uber outstation roundtrip',
    created_at: '2026-10-14T20:00:00Z',
    updated_at: '2026-10-14T20:00:00Z',
    splits: [
      { id: 's32', expense_id: 'e11', group_id: 'g1', member_id: 'u1', share_amount_paise: 71125, created_at: '2026-10-14T20:00:00Z' },
      { id: 's33', expense_id: 'e11', group_id: 'g1', member_id: 'u2', share_amount_paise: 71125, created_at: '2026-10-14T20:00:00Z' },
      { id: 's34', expense_id: 'e11', group_id: 'g1', member_id: 'u3', share_amount_paise: 71125, created_at: '2026-10-14T20:00:00Z' },
      { id: 's35', expense_id: 'e11', group_id: 'g1', member_id: 'u4', share_amount_paise: 71125, created_at: '2026-10-14T20:00:00Z' },
    ],
  },
  {
    id: 'e12',
    group_id: 'g1',
    description: 'Personal Course Subscription & Books',
    amount_paise: 492100, // Personal Ankit
    currency_code: 'INR',
    expense_type: 'personal',
    category: 'Education',
    expense_date: '2026-10-04',
    paid_by: 'u1',
    created_by: 'u1',
    notes: 'Technical certification prep',
    created_at: '2026-10-04T12:00:00Z',
    updated_at: '2026-10-04T12:00:00Z',
    splits: [
      { id: 's36', expense_id: 'e12', group_id: 'g1', member_id: 'u1', share_amount_paise: 492100, created_at: '2026-10-04T12:00:00Z' },
    ],
  },
];

const INITIAL_SETTLEMENTS: Settlement[] = [
  {
    id: 'set1',
    group_id: 'g1',
    payer_member_id: 'u2',
    recipient_member_id: 'u1',
    amount_paise: 100000,
    settlement_date: '2026-10-15',
    status: 'confirmed',
    created_by: 'u2',
    confirmed_by: 'u1',
    notes: 'Repaid grocery share via UPI GPay',
    created_at: '2026-10-15T16:00:00Z',
    updated_at: '2026-10-15T16:05:00Z',
  },
];

// Khatabook Udhaar Accounts matching mockup #5
const INITIAL_UDHAAR_ACCOUNTS: UdhaarAccount[] = [
  {
    id: 'ua1',
    group_id: 'g1',
    name: 'Rajesh Kumar',
    phone: '+91 98234 56789',
    account_type: 'family',
    relation: 'Chacha',
    opening_balance_paise: 270000, // Net +₹5,200 (Owes you)
    notes: 'Chacha ji festival emergency loan',
    created_by: 'u1',
    created_at: '2026-09-15T00:00:00Z',
    updated_at: '2026-09-15T00:00:00Z',
  },
  {
    id: 'ua2',
    group_id: 'g1',
    name: 'Suresh Bhai',
    phone: '+91 98345 67890',
    account_type: 'friend',
    relation: 'Neighbour',
    opening_balance_paise: -365000, // Net -₹3,450 (You owe)
    notes: 'Building A-301 neighbour grocery advance',
    created_by: 'u1',
    created_at: '2026-09-20T00:00:00Z',
    updated_at: '2026-09-20T00:00:00Z',
  },
  {
    id: 'ua3',
    group_id: 'g1',
    name: 'Vikash',
    phone: '+91 98456 78901',
    account_type: 'friend',
    relation: 'Friend',
    opening_balance_paise: 100000, // Net +₹1,800 (Owes you)
    notes: 'College friend concert tickets split',
    created_by: 'u1',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'ua4',
    group_id: 'g1',
    name: 'Amit',
    phone: '+91 98567 89012',
    account_type: 'other',
    relation: 'Colleague',
    opening_balance_paise: 0, // Net ₹0 (Settled)
    notes: 'Office team lunch expenses',
    created_by: 'u1',
    created_at: '2026-10-05T00:00:00Z',
    updated_at: '2026-10-05T00:00:00Z',
  },
];

// Khatabook transactions matching mockup #5 Recent Khata list
const INITIAL_UDHAAR_TRANSACTIONS: UdhaarTransaction[] = [
  {
    id: 'ut1',
    group_id: 'g1',
    account_id: 'ua2', // Suresh Bhai
    transaction_type: 'gave',
    amount_paise: 100000, // ₹1,000
    transaction_date: '2026-10-12',
    description: 'UPI repayment toward milk and veggies',
    payment_mode: 'upi',
    created_by: 'u1',
    created_at: '2026-10-12T11:00:00Z',
    updated_at: '2026-10-12T11:00:00Z',
  },
  {
    id: 'ut2',
    group_id: 'g1',
    account_id: 'ua1', // Rajesh Kumar
    transaction_type: 'got',
    amount_paise: 250000, // ₹2,500
    transaction_date: '2026-10-10',
    description: 'Partial bank transfer received',
    payment_mode: 'bank_transfer',
    created_by: 'u1',
    created_at: '2026-10-10T15:30:00Z',
    updated_at: '2026-10-10T15:30:00Z',
  },
  {
    id: 'ut3',
    group_id: 'g1',
    account_id: 'ua3', // Vikash
    transaction_type: 'gave',
    amount_paise: 80000, // ₹800
    transaction_date: '2026-10-09',
    description: 'Fuel share paid for weekend trip',
    payment_mode: 'upi',
    created_by: 'u1',
    created_at: '2026-10-09T19:00:00Z',
    updated_at: '2026-10-09T19:00:00Z',
  },
  {
    id: 'ut4',
    group_id: 'g1',
    account_id: 'ua2', // Suresh Bhai
    transaction_type: 'got',
    amount_paise: 120000, // ₹1,200
    transaction_date: '2026-10-05',
    description: 'Borrowed cash for repair',
    payment_mode: 'cash',
    created_by: 'u1',
    created_at: '2026-10-05T10:00:00Z',
    updated_at: '2026-10-05T10:00:00Z',
  },
  {
    id: 'ut5',
    group_id: 'g1',
    account_id: 'ua1', // Rajesh Kumar loan gave
    transaction_type: 'gave',
    amount_paise: 500000, // ₹5,000
    transaction_date: '2026-10-02',
    description: 'Emergency loan transfer',
    payment_mode: 'bank_transfer',
    created_by: 'u1',
    created_at: '2026-10-02T10:00:00Z',
    updated_at: '2026-10-02T10:00:00Z',
  },
];

interface StoreContextType {
  currentUser: Profile;
  switchCurrentUser: (userId: string) => void;
  group: FamilyGroup;
  members: GroupMember[];
  expenses: Expense[];
  settlements: Settlement[];
  auditLogs: AuditLog[];
  balances: MemberBalance[];
  debtPayments: DebtPayment[];
  // Udhaar
  udhaarAccounts: UdhaarAccount[];
  udhaarTransactions: UdhaarTransaction[];
  udhaarSummaries: UdhaarAccountSummary[];
  totalUdhaarReceivablePaise: number;
  totalUdhaarPayablePaise: number;
  addUdhaarAccount: (accountData: Omit<UdhaarAccount, 'id' | 'group_id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
  updateUdhaarAccount: (id: string, updates: Partial<UdhaarAccount>) => Promise<{ success: boolean; error?: string }>;
  deleteUdhaarAccount: (id: string) => Promise<{ success: boolean; error?: string }>;
  addUdhaarTransaction: (txData: {
    account_id: string;
    transaction_type: UdhaarTransactionType;
    amount_paise: number;
    transaction_date: string;
    due_date?: string;
    description?: string;
    payment_mode: PaymentMode;
  }) => Promise<{ success: boolean; error?: string }>;
  deleteUdhaarTransaction: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Theme
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  // Firebase Auth & Cloud Sync
  firebaseUser: FbUser | null;
  signInWithGoogle: () => Promise<void>;
  signOutFirebase: () => Promise<void>;
  isFirebaseConnected: boolean;
  // Other operations
  isRealtimeConnected: boolean;
  addExpense: (expenseData: {
    description: string;
    amount_paise: number;
    expense_type: ExpenseType;
    category: ExpenseCategory;
    expense_date: string;
    paid_by: string;
    notes?: string;
    receipt_path?: string;
    splits?: { member_id: string; share_amount_paise: number }[];
  }) => Promise<{ success: boolean; error?: string }>;
  updateExpense: (
    id: string,
    updates: Partial<Expense> & { splits?: { member_id: string; share_amount_paise: number }[] }
  ) => Promise<{ success: boolean; error?: string }>;
  deleteExpense: (id: string) => Promise<{ success: boolean; error?: string }>;
  recordSettlement: (
    recipientId: string,
    amountPaise: number,
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  confirmSettlement: (settlementId: string) => Promise<{ success: boolean; error?: string }>;
  cancelSettlement: (settlementId: string) => Promise<{ success: boolean; error?: string }>;
  updateBudget: (budgetPaise: number, includesPersonal: boolean) => Promise<{ success: boolean; error?: string }>;
  inviteMember: () => { inviteCode: string; maxAllowed: number; currentCount: number };
  joinGroupWithInvite: (
    inviteCode: string,
    name: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  removeMember: (userId: string) => Promise<{ success: boolean; error?: string }>;
  resetToDefaultSeed: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('fk_theme') as ThemeMode) || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
    localStorage.setItem('fk_theme', theme);
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  // Toast system
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Firebase Auth state
  const [firebaseUser, setFirebaseUser] = useState<FbUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        const identifier = user.displayName || user.phoneNumber || user.email || 'User';
        showToast(`Signed in as ${identifier}`, 'info');
      }
    });
    return () => unsubscribe();
  }, [showToast]);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setFirebaseUser(result.user);
        showToast(`Welcome ${result.user.displayName}! Connected to Firebase.`, 'success');
      }
    } catch (error) {
      console.warn('Google Sign-in was dismissed or popup blocked:', error);
      showToast('Firebase Google sign-in available in browser.', 'info');
    }
  };

  const signOutFirebase = async () => {
    try {
      await fbSignOut(auth);
      setFirebaseUser(null);
      showToast('Signed out of Firebase account.', 'info');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Core app state
  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    const saved = localStorage.getItem('fk_current_user_id');
    return INITIAL_PROFILES.find((p) => p.id === saved) || INITIAL_PROFILES[0];
  });

  const [group, setGroup] = useState<FamilyGroup>(() => {
    const saved = localStorage.getItem('fk_group');
    return saved ? JSON.parse(saved) : INITIAL_GROUP;
  });

  const [members, setMembers] = useState<GroupMember[]>(() => {
    const saved = localStorage.getItem('fk_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('fk_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [settlements, setSettlements] = useState<Settlement[]>(() => {
    const saved = localStorage.getItem('fk_settlements');
    return saved ? JSON.parse(saved) : INITIAL_SETTLEMENTS;
  });

  const [udhaarAccounts, setUdhaarAccounts] = useState<UdhaarAccount[]>(() => {
    const saved = localStorage.getItem('fk_udhaar_accounts');
    return saved ? JSON.parse(saved) : INITIAL_UDHAAR_ACCOUNTS;
  });

  const [udhaarTransactions, setUdhaarTransactions] = useState<UdhaarTransaction[]>(() => {
    const saved = localStorage.getItem('fk_udhaar_transactions');
    return saved ? JSON.parse(saved) : INITIAL_UDHAAR_TRANSACTIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isRealtimeConnected] = useState<boolean>(true);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('fk_current_user_id', currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('fk_group', JSON.stringify(group));
  }, [group]);

  useEffect(() => {
    localStorage.setItem('fk_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('fk_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('fk_settlements', JSON.stringify(settlements));
  }, [settlements]);

  useEffect(() => {
    localStorage.setItem('fk_udhaar_accounts', JSON.stringify(udhaarAccounts));
  }, [udhaarAccounts]);

  useEffect(() => {
    localStorage.setItem('fk_udhaar_transactions', JSON.stringify(udhaarTransactions));
  }, [udhaarTransactions]);

  // Firestore optional live cloud sync
  useEffect(() => {
    if (!firebaseUser) return;
    try {
      const expensesRef = collection(db, 'groups', group.id, 'expenses');
      const unsubExpenses = onSnapshot(
        expensesRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudExpenses: Expense[] = [];
            snapshot.forEach((docSnap) => {
              cloudExpenses.push(docSnap.data() as Expense);
            });
            setExpenses(cloudExpenses);
          }
        },
        (error) => {
          // Handled gracefully without crashing offline mode
          console.warn('Firestore sync note:', error.message);
        }
      );
      return () => unsubExpenses();
    } catch {
      // offline fallback
    }
  }, [firebaseUser, group.id]);

  // Udhaar Balances computation
  const udhaarSummaries = useMemo<UdhaarAccountSummary[]>(() => {
    const today = getTodayIST();
    return udhaarAccounts.map((account) => {
      const txs = udhaarTransactions.filter((t) => t.account_id === account.id);
      let totalGavePaise = 0;
      let totalGotPaise = 0;
      let isOverdue = false;

      txs.forEach((t) => {
        if (t.transaction_type === 'gave') {
          totalGavePaise += t.amount_paise;
        } else {
          totalGotPaise += t.amount_paise;
        }
        if (t.due_date && t.due_date < today && t.transaction_type === 'gave') {
          isOverdue = true;
        }
      });

      const netBalancePaise = account.opening_balance_paise + totalGavePaise - totalGotPaise;
      let status: 'will_get' | 'will_give' | 'settled' = 'settled';
      if (netBalancePaise > 0) status = 'will_get';
      else if (netBalancePaise < 0) status = 'will_give';

      return {
        account,
        total_gave_paise: totalGavePaise,
        total_got_paise: totalGotPaise,
        net_balance_paise: netBalancePaise,
        status,
        is_overdue: isOverdue && netBalancePaise > 0,
        transactions_count: txs.length,
        transaction_count: txs.length,
      };
    });
  }, [udhaarAccounts, udhaarTransactions]);

  const totalUdhaarReceivablePaise = useMemo(() => {
    return udhaarSummaries
      .filter((s) => s.net_balance_paise > 0)
      .reduce((sum, s) => sum + s.net_balance_paise, 0);
  }, [udhaarSummaries]);

  const totalUdhaarPayablePaise = useMemo(() => {
    return udhaarSummaries
      .filter((s) => s.net_balance_paise < 0)
      .reduce((sum, s) => sum + Math.abs(s.net_balance_paise), 0);
  }, [udhaarSummaries]);

  // Shared family balances
  const balances = useMemo<MemberBalance[]>(() => {
    return calculateMemberBalances(members, expenses, settlements);
  }, [members, expenses, settlements]);

  // Debt simplification repayments
  const debtPayments = useMemo<DebtPayment[]>(() => {
    return simplifyDebts(balances);
  }, [balances]);

  const switchCurrentUser = (userId: string) => {
    const target = INITIAL_PROFILES.find((p) => p.id === userId);
    if (target) {
      setCurrentUser(target);
      showToast(`Switched view to ${target.full_name}`, 'info');
    }
  };

  // Add Expense
  const addExpense = async (data: {
    description: string;
    amount_paise: number;
    expense_type: ExpenseType;
    category: ExpenseCategory;
    expense_date: string;
    paid_by: string;
    notes?: string;
    receipt_path?: string;
    splits?: { member_id: string; share_amount_paise: number }[];
  }) => {
    try {
      const newId = 'e_' + Date.now();
      const activeMemberIds = members
        .filter((m) => m.membership_status === 'active')
        .map((m) => m.user_id);

      let finalSplits: ExpenseSplit[] = [];
      if (data.expense_type === 'personal') {
        finalSplits = [
          {
            id: 's_' + Date.now() + '_1',
            expense_id: newId,
            group_id: group.id,
            member_id: data.paid_by,
            share_amount_paise: data.amount_paise,
            created_at: new Date().toISOString(),
          },
        ];
      } else {
        if (data.splits && data.splits.length > 0) {
          finalSplits = data.splits.map((s, idx) => ({
            id: 's_' + Date.now() + '_' + idx,
            expense_id: newId,
            group_id: group.id,
            member_id: s.member_id,
            share_amount_paise: s.share_amount_paise,
            created_at: new Date().toISOString(),
          }));
        } else {
          const calcSplits = calculateEqualSplits(data.amount_paise, activeMemberIds);
          finalSplits = calcSplits.map((cs, idx) => ({
            id: 's_' + Date.now() + '_' + idx,
            expense_id: newId,
            group_id: group.id,
            member_id: cs.memberId,
            share_amount_paise: cs.sharePaise,
            created_at: new Date().toISOString(),
          }));
        }
      }

      const newExpense: Expense = {
        id: newId,
        group_id: group.id,
        description: data.description,
        amount_paise: data.amount_paise,
        currency_code: 'INR',
        expense_type: data.expense_type,
        category: data.category,
        expense_date: data.expense_date,
        paid_by: data.paid_by,
        created_by: currentUser.id,
        notes: data.notes,
        receipt_path: data.receipt_path,
        splits: finalSplits,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setExpenses((prev) => [newExpense, ...prev]);

      // Cloud Firestore replication if online
      try {
        if (auth.currentUser) {
          await setDoc(doc(db, 'groups', group.id, 'expenses', newId), {
            id: newId,
            groupId: group.id,
            title: data.description,
            amountPaise: data.amount_paise,
            expenseType: data.expense_type,
            category: data.category,
            paidBy: data.paid_by,
            expenseDate: data.expense_date,
            notes: data.notes || '',
            createdAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('Firestore backup note:', e);
      }

      showToast(`Expense added: ${data.description}`, 'success');
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add expense';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const updateExpense = async (
    id: string,
    updates: Partial<Expense> & { splits?: { member_id: string; share_amount_paise: number }[] }
  ) => {
    try {
      setExpenses((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          return {
            ...e,
            ...updates,
            updated_at: new Date().toISOString(),
          };
        })
      );
      showToast('Expense updated successfully', 'success');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      showToast('Expense deleted', 'info');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Delete failed' };
    }
  };

  // Udhaar mutations
  const addUdhaarAccount = async (
    accountData: Omit<UdhaarAccount, 'id' | 'group_id' | 'created_by' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const newId = 'ua_' + Date.now();
      const newAccount: UdhaarAccount = {
        id: newId,
        group_id: group.id,
        ...accountData,
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUdhaarAccounts((prev) => [newAccount, ...prev]);

      // Cloud sync
      try {
        if (auth.currentUser) {
          await setDoc(doc(db, 'groups', group.id, 'udhaarAccounts', newId), {
            id: newId,
            groupId: group.id,
            name: newAccount.name,
            accountType: newAccount.account_type,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('Firestore backup note:', e);
      }

      showToast(`Added ${newAccount.name} to Khata`, 'success');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  const updateUdhaarAccount = async (id: string, updates: Partial<UdhaarAccount>) => {
    setUdhaarAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a))
    );
    showToast('Khata account updated', 'success');
    return { success: true };
  };

  const deleteUdhaarAccount = async (id: string) => {
    setUdhaarAccounts((prev) => prev.filter((a) => a.id !== id));
    setUdhaarTransactions((prev) => prev.filter((t) => t.account_id !== id));
    showToast('Khata account deleted', 'info');
    return { success: true };
  };

  const addUdhaarTransaction = async (txData: {
    account_id: string;
    transaction_type: UdhaarTransactionType;
    amount_paise: number;
    transaction_date: string;
    due_date?: string;
    description?: string;
    payment_mode: PaymentMode;
  }) => {
    try {
      const newId = 'ut_' + Date.now();
      const newTx: UdhaarTransaction = {
        id: newId,
        group_id: group.id,
        ...txData,
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUdhaarTransactions((prev) => [newTx, ...prev]);

      // Cloud sync
      try {
        if (auth.currentUser) {
          await setDoc(doc(db, 'groups', group.id, 'udhaarTransactions', newId), {
            id: newId,
            groupId: group.id,
            accountId: txData.account_id,
            transactionType: txData.transaction_type,
            amountPaise: txData.amount_paise,
            transactionDate: txData.transaction_date,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('Firestore backup note:', e);
      }

      showToast(
        `Recorded ${txData.transaction_type === 'gave' ? 'Gave (Diya)' : 'Got (Liya)'} entry`,
        'success'
      );
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  const deleteUdhaarTransaction = async (id: string) => {
    setUdhaarTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Udhaar entry deleted', 'info');
    return { success: true };
  };

  // Settlements
  const recordSettlement = async (recipientId: string, amountPaise: number, notes?: string) => {
    try {
      const newId = 'set_' + Date.now();
      const newSet: Settlement = {
        id: newId,
        group_id: group.id,
        payer_member_id: currentUser.id,
        recipient_member_id: recipientId,
        amount_paise: amountPaise,
        settlement_date: getTodayIST(),
        status: 'confirmed',
        created_by: currentUser.id,
        confirmed_by: recipientId,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSettlements((prev) => [newSet, ...prev]);

      try {
        if (auth.currentUser) {
          await setDoc(doc(db, 'groups', group.id, 'settlements', newId), {
            id: newId,
            groupId: group.id,
            payerMemberId: currentUser.id,
            recipientMemberId: recipientId,
            amountPaise: amountPaise,
            settlementDate: getTodayIST(),
            status: 'confirmed',
            createdAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('Firestore backup note:', e);
      }

      showToast('Settlement recorded and balance updated', 'success');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Settlement failed' };
    }
  };

  const confirmSettlement = async (settlementId: string) => {
    setSettlements((prev) =>
      prev.map((s) => (s.id === settlementId ? { ...s, status: 'confirmed', confirmed_by: currentUser.id } : s))
    );
    showToast('Settlement confirmed', 'success');
    return { success: true };
  };

  const cancelSettlement = async (settlementId: string) => {
    setSettlements((prev) => prev.filter((s) => s.id !== settlementId));
    showToast('Settlement canceled', 'info');
    return { success: true };
  };

  // Budget
  const updateBudget = async (budgetPaise: number, includesPersonal: boolean) => {
    setGroup((prev) => ({
      ...prev,
      monthly_budget_paise: budgetPaise,
      budget_includes_personal: includesPersonal,
      updated_at: new Date().toISOString(),
    }));
    showToast('Monthly family budget updated', 'success');
    return { success: true };
  };

  const inviteMember = () => {
    return {
      inviteCode: group.invite_code,
      maxAllowed: 10,
      currentCount: members.length,
    };
  };

  const joinGroupWithInvite = async (inviteCode: string, name: string, phone?: string) => {
    if (members.length >= 10) {
      return { success: false, error: 'Group is at maximum capacity (10 members limit).' };
    }
    const newUserId = 'u_' + Date.now();
    const newProfile: Profile = {
      id: newUserId,
      full_name: name,
      phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const newMember: GroupMember = {
      id: 'm_' + Date.now(),
      group_id: group.id,
      user_id: newUserId,
      role: 'member',
      membership_status: 'active',
      joined_at: new Date().toISOString(),
      profile: newProfile,
    };
    setMembers((prev) => [...prev, newMember]);
    showToast(`${name} joined ${group.name}!`, 'success');
    return { success: true };
  };

  const removeMember = async (userId: string) => {
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    showToast('Member removed from family group', 'info');
    return { success: true };
  };

  const resetToDefaultSeed = () => {
    setCurrentUser(INITIAL_PROFILES[0]);
    setGroup(INITIAL_GROUP);
    setMembers(INITIAL_MEMBERS);
    setExpenses(INITIAL_EXPENSES);
    setSettlements(INITIAL_SETTLEMENTS);
    setUdhaarAccounts(INITIAL_UDHAAR_ACCOUNTS);
    setUdhaarTransactions(INITIAL_UDHAAR_TRANSACTIONS);
    showToast('Reset to Srivastava Family demo data', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        switchCurrentUser,
        group,
        members,
        expenses,
        settlements,
        auditLogs,
        balances,
        debtPayments,
        udhaarAccounts,
        udhaarTransactions,
        udhaarSummaries,
        totalUdhaarReceivablePaise,
        totalUdhaarPayablePaise,
        addUdhaarAccount,
        updateUdhaarAccount,
        deleteUdhaarAccount,
        addUdhaarTransaction,
        deleteUdhaarTransaction,
        theme,
        setTheme,
        toasts,
        showToast,
        dismissToast,
        firebaseUser,
        signInWithGoogle,
        signOutFirebase,
        isFirebaseConnected,
        isRealtimeConnected,
        addExpense,
        updateExpense,
        deleteExpense,
        recordSettlement,
        confirmSettlement,
        cancelSettlement,
        updateBudget,
        inviteMember,
        joinGroupWithInvite,
        removeMember,
        resetToDefaultSeed,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
