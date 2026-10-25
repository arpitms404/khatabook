/**
 * FamilyKhata Core Domain Types
 * Strict integer paise monetary representation (1 INR = 100 paise)
 */

export type UserRole = 'admin' | 'member';
export type MembershipStatus = 'active' | 'inactive';
export type ExpenseType = 'personal' | 'shared';
export type SettlementStatus = 'pending' | 'confirmed' | 'cancelled';
export type ThemeMode = 'light' | 'dark' | 'system';

export type UdhaarAccountType = 'family' | 'friend' | 'neighbor' | 'shopkeeper' | 'staff' | 'other';
export type UdhaarTransactionType = 'gave' | 'got'; // gave = You gave money (You will get), got = You got money (You will give / repayment)
export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  created_by: string;
  currency_code: string; // 'INR'
  monthly_budget_paise: number; // e.g., 6000000 for ₹60,000.00
  budget_includes_personal: boolean; // whether personal expenses count toward family budget
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: UserRole;
  membership_status: MembershipStatus;
  joined_at: string;
  // Joined profile for display
  profile?: Profile;
}

export type ExpenseCategory =
  | 'Groceries'
  | 'Bills'
  | 'Food'
  | 'Rent'
  | 'Electricity'
  | 'Water'
  | 'Internet & Mobile'
  | 'Household Supplies'
  | 'Medical'
  | 'Education'
  | 'Transport'
  | 'Fuel'
  | 'Shopping'
  | 'Dining'
  | 'Travel'
  | 'Entertainment'
  | 'Insurance'
  | 'Other';

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount_paise: number; // integer paise
  currency_code: string;
  expense_type: ExpenseType;
  category: ExpenseCategory;
  expense_date: string; // YYYY-MM-DD
  paid_by: string; // user_id of payer
  created_by: string; // user_id of creator
  notes?: string;
  receipt_path?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Associated splits if shared
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  group_id: string;
  member_id: string; // user_id
  share_amount_paise: number; // integer paise
  created_at: string;
}

export interface Settlement {
  id: string;
  group_id: string;
  payer_member_id: string; // user_id who paid money
  recipient_member_id: string; // user_id who receives money
  amount_paise: number; // integer paise
  settlement_date: string; // YYYY-MM-DD
  status: SettlementStatus;
  created_by: string;
  confirmed_by?: string | null;
  notes?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export interface UdhaarAccount {
  id: string;
  group_id: string;
  name: string;
  phone?: string;
  relation?: string;
  account_type: UdhaarAccountType;
  user_id?: string;
  opening_balance_paise: number; // positive = you will get, negative = you will give
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UdhaarTransaction {
  id: string;
  group_id: string;
  account_id: string;
  transaction_type: UdhaarTransactionType;
  amount_paise: number;
  transaction_date: string; // YYYY-MM-DD
  due_date?: string; // YYYY-MM-DD
  description?: string;
  payment_mode: PaymentMode;
  created_by: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export interface UdhaarAccountSummary {
  account: UdhaarAccount;
  total_gave_paise: number;
  total_got_paise: number;
  net_balance_paise: number; // >0: You will get (Receivable), <0: You will give (Payable), 0: Settled
  status: 'to_collect' | 'to_pay' | 'settled' | 'will_get' | 'will_give';
  last_transaction_date?: string;
  is_overdue: boolean;
  transactions_count: number;
  transaction_count?: number;
}

export interface GroupInvite {
  id: string;
  group_id: string;
  token_hash: string;
  invite_code: string;
  created_by: string;
  expires_at: string;
  max_uses: number; // Max 10 per group limit
  uses_count: number;
  revoked_at?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  group_id: string;
  actor_user_id: string;
  action: string;
  entity_type: 'expense' | 'settlement' | 'member' | 'budget' | 'udhaar';
  entity_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface MemberBalance {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  // Paid toward shared expenses
  total_paid_shared_paise: number;
  // Assigned share of shared expenses
  total_shared_cost_paise: number;
  // Total personal expenses
  total_personal_paise: number;
  // Net settlements: (confirmed repayments received) - (confirmed repayments made)
  settlements_received_paise: number;
  settlements_paid_paise: number;
  // Net Balance = (Paid toward shared - Assigned shared) + (Settlements received - Settlements paid)
  // Positive = Should receive money
  // Negative = Owes money
  // Zero = Settled
  net_balance_paise: number;
}

export interface DebtPayment {
  from_user_id: string;
  from_name: string;
  to_user_id: string;
  to_name: string;
  amount_paise: number;
}

export type TabKey = 'home' | 'udhaar' | 'expenses' | 'balances' | 'reports' | 'settings' | 'tests';
