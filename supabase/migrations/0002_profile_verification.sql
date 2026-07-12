-- ============================================================
-- SAPTAPADI — Migration: Profile Verification Feature
-- Run this in your Supabase SQL Editor if you already have the
-- database from schema.sql set up. It is safe to re-run.
--
-- What this adds:
--   1. Two new columns on profiles: verified_by, verified_at
--      (kept separate from approved_by/approved_at, which power the
--      existing approve/reject moderation workflow).
--   2. New audit_action_type values: profile_verified,
--      profile_unverified, profile_self_registered.
--   3. A "one profile per account" unique index.
--   4. Self-signup support: users can now create their own profile
--      (RLS INSERT policy), and a BEFORE INSERT trigger guarantees a
--      self-created profile always starts unverified/pending no
--      matter what the client sends.
--   5. The existing admin-field-protection trigger is extended to
--      also pin verified_by/verified_at on non-admin updates.
--   6. Users can now SELECT their own profile regardless of status
--      (previously only approved profiles were visible, which meant
--      a user could not see their own profile while pending).
--   7. dashboard_stats view gains a verified_profiles count.
-- ============================================================

-- 1. New columns ------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 2. New audit action types -------------------------------------
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'profile_verified';
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'profile_unverified';
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'profile_self_registered';

-- 3. One self-registered profile per account ---------------------
DROP INDEX IF EXISTS idx_profiles_user_id_unique;
CREATE UNIQUE INDEX idx_profiles_user_id_unique ON public.profiles(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);

-- 4a. Extend the UPDATE protection trigger ------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.status := OLD.status;
    NEW.is_verified := OLD.is_verified;
    NEW.approved_by := OLD.approved_by;
    NEW.approved_at := OLD.approved_at;
    NEW.verified_by := OLD.verified_by;
    NEW.verified_at := OLD.verified_at;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.created_by := OLD.created_by;
    NEW.user_id := OLD.user_id;
    NEW.created_at := OLD.created_at;
    NEW.profile_id := OLD.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4b. New INSERT protection trigger + self-signup policy ----------
CREATE OR REPLACE FUNCTION public.enforce_profile_insert_defaults()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.user_id := auth.uid();
    NEW.created_by := auth.uid();
    NEW.status := 'pending';
    NEW.is_verified := false;
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
    NEW.rejection_reason := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_enforce_profile_insert_defaults ON public.profiles;
CREATE TRIGGER trigger_enforce_profile_insert_defaults
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_insert_defaults();

DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 6. Replace the old "approved only" select policy -----------------
DROP POLICY IF EXISTS "Users can view approved and accessible profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own and accessible profiles" ON public.profiles;
CREATE POLICY "Users can view own and accessible profiles" ON public.profiles
  FOR SELECT USING (
    user_id = auth.uid() OR
    (
      status = 'approved' AND
      EXISTS (
        SELECT 1 FROM public.profile_access
        WHERE profile_id = profiles.id
          AND granted_to_user_id = auth.uid()
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > NOW())
      )
    )
  );

-- 7. dashboard_stats view -------------------------------------------
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.users WHERE role = 'user') AS total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE gender = 'male') AS male_profiles,
  (SELECT COUNT(*) FROM public.profiles WHERE gender = 'female') AS female_profiles,
  (SELECT COUNT(DISTINCT user_id) FROM public.subscriptions WHERE status = 'active' AND plan != 'free') AS paid_users,
  (SELECT COUNT(DISTINCT user_id) FROM public.subscriptions WHERE plan = 'free') AS free_users,
  (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'expired') AS expired_subscriptions,
  (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active' AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) AS expiring_within_30_days,
  (SELECT COUNT(*) FROM public.profiles WHERE status = 'pending') AS pending_profiles,
  (SELECT COUNT(*) FROM public.profiles WHERE is_verified = true) AS verified_profiles,
  (SELECT COUNT(*) FROM public.profile_interactions WHERE interaction_type = 'download') AS total_biodatas,
  (SELECT COUNT(*) FROM public.users WHERE DATE(created_at) = CURRENT_DATE) AS today_registrations,
  (SELECT COALESCE(SUM(amount_paid), 0) FROM public.subscriptions WHERE status IN ('active', 'expired')) AS total_revenue;
