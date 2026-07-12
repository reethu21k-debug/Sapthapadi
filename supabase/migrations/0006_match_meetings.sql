-- ============================================================
-- SAPTAPADI — Migration: Match Meeting Requests
-- Run this in your Supabase SQL Editor. Safe to re-run.
--
-- What this adds:
--   1. New enum match_meeting_status_type.
--   2. New table match_meeting_requests: a user who has been granted
--      access to a profile (via profile_access) can request an
--      in-person "match meeting" with that profile. The admin then
--      accepts/rejects the request, and later marks it completed.
--   3. New audit_action_type values for the request lifecycle.
--   4. RLS policies: users can create/view/cancel their own requests;
--      admins can view and manage all requests.
--   5. A partial unique index preventing duplicate *pending* requests
--      for the same (user, profile) pair.
--   6. dashboard_stats view gains a total_completed_match_meetings count.
-- ============================================================

-- 1. Enum -------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE match_meeting_status_type AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Table --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_meeting_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- The member requesting the meeting, and the profile they want to meet.
  -- Kept as plain FKs (not a FK to profile_access) so meeting history
  -- survives even if the admin later revokes the underlying share.
  requested_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  status match_meeting_status_type NOT NULL DEFAULT 'pending',

  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Set when an admin accepts/rejects the request.
  responded_by_admin_id UUID REFERENCES public.users(id),
  responded_at TIMESTAMPTZ,

  -- Set when an admin marks an accepted meeting as completed.
  completed_by_admin_id UUID REFERENCES public.users(id),
  completed_at TIMESTAMPTZ,

  -- Optional scheduling / admin notes, and a reason if rejected/cancelled.
  meeting_date TIMESTAMPTZ,
  meeting_location TEXT,
  admin_notes TEXT,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_meetings_user_id ON public.match_meeting_requests(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_match_meetings_profile_id ON public.match_meeting_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_match_meetings_status ON public.match_meeting_requests(status);
CREATE INDEX IF NOT EXISTS idx_match_meetings_created_at ON public.match_meeting_requests(created_at DESC);

-- Only one *pending* request per (user, profile) pair at a time — a user
-- can still request again later if a previous request was rejected/
-- cancelled, but can't spam duplicate pending requests.
DROP INDEX IF EXISTS idx_match_meetings_pending_unique;
CREATE UNIQUE INDEX idx_match_meetings_pending_unique
  ON public.match_meeting_requests(requested_by_user_id, profile_id)
  WHERE status = 'pending';

CREATE TRIGGER trigger_match_meetings_updated_at
  BEFORE UPDATE ON public.match_meeting_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Audit action types --------------------------------------------
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'match_meeting_requested';
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'match_meeting_accepted';
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'match_meeting_rejected';
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'match_meeting_completed';
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'match_meeting_cancelled';

-- 4. RLS --------------------------------------------------------
ALTER TABLE public.match_meeting_requests ENABLE ROW LEVEL SECURITY;

-- A user may only request a meeting for a profile they've actually been
-- granted (active) access to — enforced here, not just in the UI.
CREATE POLICY "Users can request meetings for accessible profiles" ON public.match_meeting_requests
  FOR INSERT WITH CHECK (
    requested_by_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profile_access
      WHERE profile_id = match_meeting_requests.profile_id
        AND granted_to_user_id = auth.uid()
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

CREATE POLICY "Users can view own match meeting requests" ON public.match_meeting_requests
  FOR SELECT USING (requested_by_user_id = auth.uid());

-- A user may only cancel their own request, and only while it's still
-- pending (once an admin has accepted/rejected/completed it, it's final
-- from the member's side).
CREATE POLICY "Users can cancel own pending requests" ON public.match_meeting_requests
  FOR UPDATE USING (
    requested_by_user_id = auth.uid() AND status = 'pending'
  ) WITH CHECK (
    requested_by_user_id = auth.uid() AND status = 'cancelled'
  );

CREATE POLICY "Admins can manage all match meeting requests" ON public.match_meeting_requests
  FOR ALL USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- 5. dashboard_stats view -------------------------------------------
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
  (SELECT COALESCE(SUM(amount_paid), 0) FROM public.subscriptions WHERE status IN ('active', 'expired')) AS total_revenue,
  (SELECT COUNT(*) FROM public.match_meeting_requests WHERE status = 'pending') AS pending_match_meetings,
  (SELECT COUNT(*) FROM public.match_meeting_requests WHERE status = 'completed') AS total_completed_match_meetings;
