-- ============================================================
-- SAPTAPADI — Migration: Per-Profile Match Meeting Counts
-- Run this in your Supabase SQL Editor. Safe to re-run.
--
-- What this adds:
--   A view, profile_match_meeting_counts, with one row per profile
--   giving the number of COMPLETED match meetings that person has
--   been part of — whether they were the one who requested the
--   meeting (via their linked user_id) or the one who was requested
--   to meet (via profile_id on the request itself).
--
--   Used by the admin Profiles list/detail views to show a
--   "Match Meetings" count next to each profile without an N+1
--   query per row.
-- ============================================================

CREATE OR REPLACE VIEW public.profile_match_meeting_counts AS
SELECT
  p.id AS profile_id,
  (
    SELECT COUNT(*)::int
    FROM public.match_meeting_requests mr
    WHERE mr.status = 'completed'
      AND (
        mr.profile_id = p.id
        OR (p.user_id IS NOT NULL AND mr.requested_by_user_id = p.user_id)
      )
  ) AS completed_match_meetings
FROM public.profiles p;