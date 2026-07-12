-- ============================================================
-- SAPTAPADI — Migration: Change Profile ID Prefix (SPT- → SPM-)
-- Run this in your Supabase SQL Editor. Safe to re-run.
--
-- What this does:
--   Updates the default expression on profiles.profile_id so every
--   NEW profile gets an ID like SPM-2026-00001 instead of
--   SPT-2026-00001. The shared profile_id_seq sequence keeps
--   counting from wherever it left off — this does not reset numbering.
--
--   Existing profiles already saved as SPT-... are NOT touched by
--   this migration (see the optional backfill at the bottom).
-- ============================================================

ALTER TABLE public.profiles
  ALTER COLUMN profile_id
  SET DEFAULT ('SPM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('profile_id_seq')::TEXT, 5, '0'));

-- ── Optional: rename existing SPT- profiles to SPM- as well ──────
-- Uncomment and run this if you want existing profiles to switch
-- over too (their year/number suffix is kept as-is). Leave commented
-- if you'd rather only new profiles use the new prefix.
--
-- UPDATE public.profiles
-- SET profile_id = 'SPM-' || SPLIT_PART(profile_id, '-', 2) || '-' || SPLIT_PART(profile_id, '-', 3)
-- WHERE profile_id LIKE 'SPT-%';