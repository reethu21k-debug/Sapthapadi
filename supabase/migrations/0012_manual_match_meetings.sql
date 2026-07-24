-- ============================================================
-- 0012_manual_match_meetings.sql
-- Lets an admin/manager manually log that "Party A met Party B",
-- where EITHER party can be a member (user account) or a profile,
-- independent of the existing member-requests-a-profile flow.
-- ============================================================

-- ─── Schema changes ─────────────────────────────────────────

-- Side A ("requested_by") no longer has to be a user — a manual entry can
-- have a profile on both sides. Side B (`profile_id`) stays NOT NULL and
-- always a profile, so every existing read (profiles!inner join, counts
-- view, etc.) keeps working unchanged.
ALTER TABLE public.match_meeting_requests
  ALTER COLUMN requested_by_user_id DROP NOT NULL;

ALTER TABLE public.match_meeting_requests
  ADD COLUMN requested_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Exactly one of (requested_by_user_id, requested_by_profile_id) must be
-- set — side A is always resolvable to exactly one party.
ALTER TABLE public.match_meeting_requests
  ADD CONSTRAINT chk_match_meeting_side_a_single
  CHECK (
    (requested_by_user_id IS NOT NULL AND requested_by_profile_id IS NULL) OR
    (requested_by_user_id IS NULL AND requested_by_profile_id IS NOT NULL)
  );

-- Manual entries (created directly by an admin/manager, not via a member's
-- own request) are flagged so the UI can distinguish "member requested
-- this" rows from "staff logged this after the fact" rows.
ALTER TABLE public.match_meeting_requests
  ADD COLUMN is_manual BOOLEAN NOT NULL DEFAULT false;

-- Who logged a manual entry (admin or manager). Distinct from
-- completed_by_admin_id, which already exists for the accept/complete
-- flow — kept separate so audit history is unambiguous about how a row
-- was created vs. how it was later resolved.
ALTER TABLE public.match_meeting_requests
  ADD COLUMN logged_by_id UUID REFERENCES public.users(id);

CREATE INDEX idx_match_meetings_requested_by_profile_id
  ON public.match_meeting_requests(requested_by_profile_id);
CREATE INDEX idx_match_meetings_is_manual
  ON public.match_meeting_requests(is_manual);

-- The old "only one pending request per (user, profile)" partial unique
-- index only ever covered the user-requested path. Manual entries are
-- created directly as 'completed' (see RLS policy below) so they never
-- collide with it, and profile-side-A manual entries have no
-- requested_by_user_id to collide on anyway — no change needed there.

-- ─── RLS: allow admin/manager to insert manual, already-completed rows ──
-- The existing "Admins can manage all match meeting requests" policy
-- already covers admins fully (FOR ALL USING is_admin()). This adds
-- managers: they may insert manual match-meeting rows, but only ones
-- where every profile referenced (side A if it's a profile, and side B)
-- is one of their assigned profiles — enforced in the CHECK below via a
-- join against manager_profile_assignments.
CREATE POLICY "Managers can log manual match meetings for assigned profiles" ON public.match_meeting_requests
  FOR INSERT
  WITH CHECK (
    is_manual = true
    AND status = 'completed'
    AND logged_by_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manager')
    AND EXISTS (
      SELECT 1 FROM public.manager_profile_assignments
      WHERE manager_id = auth.uid() AND profile_id = match_meeting_requests.profile_id
    )
    AND (
      requested_by_profile_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.manager_profile_assignments
        WHERE manager_id = auth.uid() AND profile_id = match_meeting_requests.requested_by_profile_id
      )
    )
  );

-- Managers also need to be able to VIEW rows where they're the logger or
-- where the profile is assigned to them — the existing "manage all"
-- policy is admin-only, and managers currently only get requests where
-- they can join through profile_id in the manager_profile_assignments
-- table via the app-level query filter, not RLS. Add an explicit SELECT
-- policy so this holds at the DB level too, matching how assignedProfileIds
-- filtering already works in MatchMeetingsManager.
CREATE POLICY "Managers can view match meetings for assigned profiles" ON public.match_meeting_requests
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'manager')
    AND (
      EXISTS (
        SELECT 1 FROM public.manager_profile_assignments
        WHERE manager_id = auth.uid() AND profile_id = match_meeting_requests.profile_id
      )
      OR (
        requested_by_profile_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.manager_profile_assignments
          WHERE manager_id = auth.uid() AND profile_id = match_meeting_requests.requested_by_profile_id
        )
      )
    )
  );

-- ─── View update ────────────────────────────────────────────
-- profile_match_meeting_counts previously only looked at profile_id and
-- requested_by_user_id -> profiles.user_id. Extend it to also count a
-- profile as party to a completed meeting when it's on side A directly
-- via requested_by_profile_id.
CREATE OR REPLACE VIEW public.profile_match_meeting_counts AS
SELECT
  p.id AS profile_id,
  (
    SELECT COUNT(*)::int
    FROM public.match_meeting_requests mr
    WHERE mr.status = 'completed'
      AND (
        mr.profile_id = p.id
        OR mr.requested_by_profile_id = p.id
        OR (p.user_id IS NOT NULL AND mr.requested_by_user_id = p.user_id)
      )
  ) AS completed_match_meetings
FROM public.profiles p;