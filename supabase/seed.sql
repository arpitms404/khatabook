-- ==============================================================================
-- Seed: /supabase/seed.sql
-- FamilyKhata Development Seed Data: The Sharma Family
-- ==============================================================================

-- 1. Insert Profiles (mock user auth UUIDs)
INSERT INTO public.profiles (id, full_name, avatar_url, phone)
VALUES
    ('a0000001-0000-0000-0000-000000000001', 'Rajesh Sharma', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '+91 98200 11223'),
    ('a0000001-0000-0000-0000-000000000002', 'Priya Sharma', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', '+91 98200 22334'),
    ('a0000001-0000-0000-0000-000000000003', 'Aarav Sharma', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '+91 98200 33445'),
    ('a0000001-0000-0000-0000-000000000004', 'Ananya Sharma', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', '+91 98200 44556'),
    ('a0000001-0000-0000-0000-000000000005', 'Kamla Sharma (Dadi)', 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=150', '+91 98200 55667')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Family Group
INSERT INTO public.groups (id, name, created_by, currency_code, monthly_budget_paise, budget_includes_personal, invite_code)
VALUES
    ('g0000001-0000-0000-0000-000000000001', 'Sharma Family', 'a0000001-0000-0000-0000-000000000001', 'INR', 6000000, false, 'SHARMA7')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Group Members
INSERT INTO public.group_members (group_id, user_id, role, membership_status)
VALUES
    ('g0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'admin', 'active'),
    ('g0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'member', 'active'),
    ('g0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'member', 'active'),
    ('g0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'member', 'active'),
    ('g0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000005', 'member', 'active')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 4. Insert Seed Expenses
-- Shared: Groceries ₹4,550.00 (455000 paise) paid by Rajesh, split among Rajesh, Priya, Aarav, Ananya
INSERT INTO public.expenses (id, group_id, description, amount_paise, currency_code, expense_type, category, expense_date, paid_by, created_by, notes)
VALUES
    ('e0000001-0000-0000-0000-000000000001', 'g0000001-0000-0000-0000-000000000001', 'Monthly BigBasket Groceries & Staples', 455000, 'INR', 'shared', 'Groceries', '2026-10-02', 'a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Wheat, rice, dal, and cooking oils for October')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.expense_splits (expense_id, group_id, member_id, share_amount_paise)
VALUES
    ('e0000001-0000-0000-0000-000000000001', 'g0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 113750),
    ('e0000001-0000-0000-0000-000000000001', 'g0000001-0000-0000-0000-000000000002', 113750),
    ('e0000001-0000-0000-0000-000000000001', 'g0000001-0000-0000-0000-000000000003', 113750),
    ('e0000001-0000-0000-0000-000000000001', 'g0000001-0000-0000-0000-000000000004', 113750)
ON CONFLICT DO NOTHING;

-- Shared: Tata Power Electricity ₹2,840.00 paid by Priya, split between Rajesh & Priya
INSERT INTO public.expenses (id, group_id, description, amount_paise, currency_code, expense_type, category, expense_date, paid_by, created_by, notes)
VALUES
    ('e0000001-0000-0000-0000-000000000002', 'g0000001-0000-0000-0000-000000000002', 'Tata Power Electricity Bill', 284000, 'INR', 'shared', 'Electricity', '2026-10-06', 'a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'September consumption bill')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.expense_splits (expense_id, group_id, member_id, share_amount_paise)
VALUES
    ('e0000001-0000-0000-0000-000000000002', 'g0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 142000),
    ('e0000001-0000-0000-0000-000000000002', 'g0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 142000)
ON CONFLICT DO NOTHING;
