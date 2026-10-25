-- ==============================================================================
-- Migration: 20261019000001_family_khata_schema.sql
-- FamilyKhata: Production Schema with Integer Paise Money, 10-Member Limit & Triggers
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Groups Table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
    monthly_budget_paise BIGINT NOT NULL DEFAULT 5000000 CHECK (monthly_budget_paise >= 0), -- ₹50,000 default
    budget_includes_personal BOOLEAN NOT NULL DEFAULT false,
    invite_code VARCHAR(16) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Group Members Table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    membership_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_group_user UNIQUE(group_id, user_id)
);

-- Index for fast member lookups
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON public.group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);

-- Enforce maximum of 10 active members per group constraint via trigger
CREATE OR REPLACE FUNCTION public.check_group_member_limit()
RETURNS TRIGGER AS $$
DECLARE
    active_count INT;
BEGIN
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.membership_status = 'active') THEN
        SELECT count(*) INTO active_count
        FROM public.group_members
        WHERE group_id = NEW.group_id AND membership_status = 'active';

        IF active_count >= 10 THEN
            RAISE EXCEPTION 'FamilyKhata limit reached: A family group cannot exceed 10 active members.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_group_member_limit ON public.group_members;
CREATE TRIGGER trg_enforce_group_member_limit
    BEFORE INSERT ON public.group_members
    FOR EACH ROW
    EXECUTE FUNCTION public.check_group_member_limit();

-- 5. Group Invites Table
CREATE TABLE IF NOT EXISTS public.group_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    invite_code VARCHAR(16) UNIQUE NOT NULL,
    token_hash TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INT NOT NULL DEFAULT 10,
    uses_count INT NOT NULL DEFAULT 0,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Expenses Table (Paise integer amount)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
    expense_type VARCHAR(20) NOT NULL CHECK (expense_type IN ('personal', 'shared')),
    category VARCHAR(50) NOT NULL,
    expense_date DATE NOT NULL,
    paid_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    notes TEXT,
    receipt_path TEXT,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_expenses_group_date ON public.expenses(group_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON public.expenses(paid_by);
CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_idempotency ON public.expenses(group_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 7. Expense Splits Table
CREATE TABLE IF NOT EXISTS public.expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    share_amount_paise BIGINT NOT NULL CHECK (share_amount_paise >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_expense_split_member UNIQUE(expense_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_splits_member ON public.expense_splits(member_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_group ON public.expense_splits(group_id);

-- 8. Settlements Table
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    payer_member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    recipient_member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    settlement_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_settlement_different_parties CHECK (payer_member_id <> recipient_member_id)
);

CREATE INDEX IF NOT EXISTS idx_settlements_group ON public.settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_payer ON public.settlements(payer_member_id);
CREATE INDEX IF NOT EXISTS idx_settlements_recipient ON public.settlements(recipient_member_id);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_group ON public.audit_logs(group_id, created_at DESC);
