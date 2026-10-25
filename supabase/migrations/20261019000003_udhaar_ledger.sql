-- ==============================================================================
-- Migration: 20261019000003_udhaar_ledger.sql
-- FamilyKhata: Khatabook-Inspired Credit & Debit (Udhaar) Ledger System
-- ==============================================================================

-- 1. Udhaar Accounts Table (Person/Entity Ledger)
CREATE TABLE IF NOT EXISTS public.udhaar_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    account_type VARCHAR(30) NOT NULL DEFAULT 'family' CHECK (account_type IN ('family', 'friend', 'neighbor', 'shopkeeper', 'staff', 'other')),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- linked family member profile if applicable
    opening_balance_paise BIGINT NOT NULL DEFAULT 0, -- positive = you'll get, negative = you'll give
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_udhaar_accounts_group ON public.udhaar_accounts(group_id);
CREATE INDEX IF NOT EXISTS idx_udhaar_accounts_name ON public.udhaar_accounts(group_id, name);

-- 2. Udhaar Transactions Table (Credit & Debit Entries)
CREATE TABLE IF NOT EXISTS public.udhaar_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.udhaar_accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('gave', 'got')),
    -- 'gave': Money given / lent by family member (You will get / Receivable)
    -- 'got': Money received / repayment / borrowed (You will give / Payable)
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    transaction_date DATE NOT NULL,
    due_date DATE,
    description TEXT,
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'cheque', 'other')),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_udhaar_tx_account ON public.udhaar_transactions(account_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_udhaar_tx_group ON public.udhaar_transactions(group_id);

-- 3. Row Level Security for Udhaar Tables
ALTER TABLE public.udhaar_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.udhaar_transactions ENABLE ROW LEVEL SECURITY;

-- Udhaar Accounts Policies
CREATE POLICY "Members can view group udhaar accounts"
    ON public.udhaar_accounts FOR SELECT
    USING (public.is_member_of(group_id));

CREATE POLICY "Members can insert group udhaar accounts"
    ON public.udhaar_accounts FOR INSERT
    WITH CHECK (public.is_member_of(group_id) AND auth.uid() = created_by);

CREATE POLICY "Members can update group udhaar accounts"
    ON public.udhaar_accounts FOR UPDATE
    USING (public.is_member_of(group_id));

CREATE POLICY "Admins or creators can delete group udhaar accounts"
    ON public.udhaar_accounts FOR DELETE
    USING (public.is_member_of(group_id) AND (auth.uid() = created_by OR public.is_admin_of(group_id)));

-- Udhaar Transactions Policies
CREATE POLICY "Members can view group udhaar transactions"
    ON public.udhaar_transactions FOR SELECT
    USING (public.is_member_of(group_id));

CREATE POLICY "Members can insert group udhaar transactions"
    ON public.udhaar_transactions FOR INSERT
    WITH CHECK (public.is_member_of(group_id) AND auth.uid() = created_by);

CREATE POLICY "Members can update group udhaar transactions"
    ON public.udhaar_transactions FOR UPDATE
    USING (public.is_member_of(group_id) AND (auth.uid() = created_by OR public.is_admin_of(group_id)));

CREATE POLICY "Admins or creators can delete group udhaar transactions"
    ON public.udhaar_transactions FOR DELETE
    USING (public.is_member_of(group_id) AND (auth.uid() = created_by OR public.is_admin_of(group_id)));
