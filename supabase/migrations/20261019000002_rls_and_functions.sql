-- ==============================================================================
-- Migration: 20261019000002_rls_and_functions.sql
-- FamilyKhata: Row Level Security (RLS) Policies and Trusted Database RPCs
-- ==============================================================================

-- 1. Helper Security Functions
CREATE OR REPLACE FUNCTION public.is_member_of(_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = _group_id
          AND user_id = auth.uid()
          AND membership_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_of(_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = _group_id
          AND user_id = auth.uid()
          AND role = 'admin'
          AND membership_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Profiles Policies
-- Users can see their own profile and profiles of members in the same family group
CREATE POLICY "Profiles viewable by self and co-group members"
    ON public.profiles FOR SELECT
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.group_members gm1
            JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
            WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.id
        )
    );

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- 4. Groups Policies
CREATE POLICY "Groups viewable by members"
    ON public.groups FOR SELECT
    USING (public.is_member_of(id));

CREATE POLICY "Admins can update group settings"
    ON public.groups FOR UPDATE
    USING (public.is_admin_of(id));

CREATE POLICY "Users can create groups"
    ON public.groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- 5. Group Members Policies
CREATE POLICY "Members can view membership"
    ON public.group_members FOR SELECT
    USING (public.is_member_of(group_id));

CREATE POLICY "Admins can manage group members"
    ON public.group_members FOR ALL
    USING (public.is_admin_of(group_id));

CREATE POLICY "Users can join group via invite"
    ON public.group_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 6. Expenses Policies
CREATE POLICY "Members can view group expenses"
    ON public.expenses FOR SELECT
    USING (public.is_member_of(group_id) AND deleted_at IS NULL);

CREATE POLICY "Members can insert group expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (public.is_member_of(group_id) AND auth.uid() = created_by);

CREATE POLICY "Creators or admins can update expenses"
    ON public.expenses FOR UPDATE
    USING (public.is_member_of(group_id) AND (auth.uid() = created_by OR public.is_admin_of(group_id)));

CREATE POLICY "Creators or admins can delete expenses"
    ON public.expenses FOR DELETE
    USING (public.is_member_of(group_id) AND (auth.uid() = created_by OR public.is_admin_of(group_id)));

-- 7. Expense Splits Policies
CREATE POLICY "Members can view expense splits"
    ON public.expense_splits FOR SELECT
    USING (public.is_member_of(group_id));

CREATE POLICY "Members can insert expense splits"
    ON public.expense_splits FOR INSERT
    WITH CHECK (public.is_member_of(group_id));

-- 8. Settlements Policies
CREATE POLICY "Members can view group settlements"
    ON public.settlements FOR SELECT
    USING (public.is_member_of(group_id));

CREATE POLICY "Debtors can record settlements"
    ON public.settlements FOR INSERT
    WITH CHECK (public.is_member_of(group_id) AND auth.uid() = payer_member_id);

CREATE POLICY "Recipients or admins can confirm or cancel settlements"
    ON public.settlements FOR UPDATE
    USING (
        public.is_member_of(group_id) AND
        (auth.uid() = recipient_member_id OR auth.uid() = payer_member_id OR public.is_admin_of(group_id))
    );

-- 9. Audit Logs Policies
CREATE POLICY "Members can view group audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_member_of(group_id));

-- 10. RPC: Transactional invite code redemption with 10-member enforcement
CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_invite_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_group_id UUID;
    v_current_count INT;
    v_member_id UUID;
BEGIN
    -- Check invite validity
    SELECT id INTO v_group_id FROM public.groups WHERE invite_code = p_invite_code;
    IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Invalid invite code.';
    END IF;

    -- Check active count
    SELECT count(*) INTO v_current_count
    FROM public.group_members
    WHERE group_id = v_group_id AND membership_status = 'active';

    IF v_current_count >= 10 THEN
        RAISE EXCEPTION 'Family group has reached the maximum of 10 members.';
    END IF;

    -- Check if already member
    IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = v_group_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'You are already a member of this family group.';
    END IF;

    -- Insert membership
    INSERT INTO public.group_members (group_id, user_id, role, membership_status)
    VALUES (v_group_id, auth.uid(), 'member', 'active')
    RETURNING id INTO v_member_id;

    -- Log audit entry
    INSERT INTO public.audit_logs (group_id, actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (v_group_id, auth.uid(), 'member_joined', 'member', v_member_id, jsonb_build_object('invite_code', p_invite_code));

    RETURN jsonb_build_object('success', true, 'group_id', v_group_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
