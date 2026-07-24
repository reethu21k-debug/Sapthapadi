-- ============================================================
-- SAPTAPADI — Migration: Manager Accounts
-- Run this in your Supabase SQL Editor after 0010.sql. Safe to re-run,
-- EXCEPT the `ALTER TYPE ... ADD VALUE` statements, which Postgres does
-- not support inside `IF NOT EXISTS`-free re-runs on very old PG
-- versions. On modern Postgres (Supabase's default) `ADD VALUE IF NOT
-- EXISTS` is idempotent and this whole file can be re-run safely.
--
-- What this adds:
--   1. New role value 'manager' on user_role_type.
--   2. public.is_admin_or_manager() — a SECURITY DEFINER helper
--      mirroring is_admin(), used to grant Managers the same RLS
--      access as Admins on the "workload" tables (profiles,
--      subscriptions, profile_access, match meetings, plans, content,
--      audit log reads). Managing Manager accounts themselves and
--      Settings stay gated behind is_admin() only — see note in the
--      accompanying implementation notes.
--   3. manager_profile_assignments table — which profiles are
--      assigned to which manager, for the "Assigned Profiles" view.
--      Only true Admins can write to it; Admins+Managers can read it.
--   4. New audit_action_type values for manager lifecycle events.
-- ============================================================

-- 1. New role value -------------------------------------------------
ALTER TYPE user_role_type ADD VALUE IF NOT EXISTS 'manager';

-- 2. Helper: true Admin OR Manager -----------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
$$;

-- 3. manager_profile_assignments -------------------------------------
CREATE TABLE IF NOT EXISTS public.manager_profile_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  UNIQUE (manager_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_manager_assignments_manager ON public.manager_profile_assignments(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_assignments_profile ON public.manager_profile_assignments(profile_id);

ALTER TABLE public.manager_profile_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin or manager can view assignments" ON public.manager_profile_assignments;
CREATE POLICY "Admin or manager can view assignments" ON public.manager_profile_assignments
  FOR SELECT USING (public.is_admin_or_manager());

-- Assignment is an Admin-only workload-distribution action per the
-- feature spec — Managers can see assignments but not create/edit them.
DROP POLICY IF EXISTS "Admins can create assignments" ON public.manager_profile_assignments;
CREATE POLICY "Admins can create assignments" ON public.manager_profile_assignments
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update assignments" ON public.manager_profile_assignments;
CREATE POLICY "Admins can update assignments" ON public.manager_profile_assignments
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete assignments" ON public.manager_profile_assignments;
CREATE POLICY "Admins can delete assignments" ON public.manager_profile_assignments
  FOR DELETE USING (public.is_admin());

-- 4. Audit action types ----------------------------------------------
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'manager_created';
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'manager_activated';
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'manager_deactivated';
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'manager_deleted';
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'profile_assigned_to_manager';
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'profile_unassigned_from_manager';

-- 5. Swap is_admin() -> is_admin_or_manager() on "full access" policies
--    so Managers get the same data access as Admins on these tables.
--    (Managing Manager accounts and Settings are intentionally left as
--    is_admin()-only — see notes above.)

DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
CREATE POLICY "Admin or manager full access to profiles" ON public.profiles
  FOR ALL USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admin or manager can manage subscriptions" ON public.subscriptions
  FOR ALL USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can manage access" ON public.profile_access;
CREATE POLICY "Admin or manager can manage profile access" ON public.profile_access
  FOR ALL USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can manage profile admin documents" ON public.profile_admin_documents;
CREATE POLICY "Admin or manager can manage profile admin documents" ON public.profile_admin_documents
  FOR ALL USING (public.is_admin_or_manager()) WITH CHECK (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can view all interactions" ON public.profile_interactions;
CREATE POLICY "Admin or manager can view all interactions" ON public.profile_interactions
  FOR SELECT USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can manage all match meeting requests" ON public.match_meeting_requests;
CREATE POLICY "Admin or manager can manage all match meeting requests" ON public.match_meeting_requests
  FOR ALL USING (public.is_admin_or_manager()) WITH CHECK (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admin or manager can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can manage plans" ON public.subscription_plans;
CREATE POLICY "Admin or manager can manage plans" ON public.subscription_plans
  FOR ALL USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can manage stories" ON public.success_stories;
CREATE POLICY "Admin or manager can manage stories" ON public.success_stories
  FOR ALL USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
CREATE POLICY "Admin or manager can manage testimonials" ON public.testimonials
  FOR ALL USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can manage faqs" ON public.faqs;
CREATE POLICY "Admin or manager can manage faqs" ON public.faqs
  FOR ALL USING (public.is_admin_or_manager());

-- 6. Users table: Managers can view all users and update MEMBER
--    (role = 'user') accounts (e.g. activate/deactivate), same as
--    Admins today — but cannot touch other admin/manager rows, and
--    cannot change anyone's role via this policy (role changes only
--    happen through the dedicated Managers API using the service-role
--    client, which bypasses RLS entirely and is itself gated to true
--    Admins in application code).
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admin or manager can view all users" ON public.users
  FOR SELECT USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Managers can update member users" ON public.users;
CREATE POLICY "Managers can update member users" ON public.users
  FOR UPDATE USING (
    public.is_admin_or_manager() AND role = 'user'
  ) WITH CHECK (
    role = 'user'
  );

-- NOTE: subscription_plans/site_settings/success_stories/testimonials/faqs
-- "Anyone can read ..." public SELECT policies are untouched — no change
-- needed there.