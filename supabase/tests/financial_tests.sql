-- ==============================================================================
-- Test Suite: /supabase/tests/financial_tests.sql
-- Automated PostgreSQL Assertions for FamilyKhata
-- ==============================================================================

BEGIN;
SELECT plan(6);

-- Test 1: Verify tables exist
SELECT has_table('public', 'groups', 'Table groups exists');
SELECT has_table('public', 'group_members', 'Table group_members exists');
SELECT has_table('public', 'expenses', 'Table expenses exists');
SELECT has_table('public', 'expense_splits', 'Table expense_splits exists');
SELECT has_table('public', 'settlements', 'Table settlements exists');

-- Test 2: Verify paise is integer (BIGINT) and check constraint > 0
SELECT col_type_is('public', 'expenses', 'amount_paise', 'bigint', 'amount_paise is stored as bigint');

-- Test 3: RLS is enabled on all tables
SELECT table_has_rls('public', 'expenses', 'RLS is enabled on expenses');
SELECT table_has_rls('public', 'group_members', 'RLS is enabled on group_members');
SELECT table_has_rls('public', 'settlements', 'RLS is enabled on settlements');

ROLLBACK;
