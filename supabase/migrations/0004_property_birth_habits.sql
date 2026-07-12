-- ============================================================
-- SAPTAPADI — Migration: Property Details, Birth Info & Habits
-- Run this in your Supabase SQL Editor after 0003_profile_share_privacy.sql.
-- Safe to re-run.
--
-- What this adds:
--   1. profiles.property JSONB — a dedicated section capturing the
--      user's own property details (owns_property, property_type,
--      property_location, property_value, property_description).
--      Default '{}' — fully backward compatible with existing rows.
--   2. Documents the new free-text fields that now live inside the
--      existing `personal` and `education` JSONB columns (no schema
--      change needed for these since they're stored as JSONB):
--        - personal.place_of_birth   (text)
--        - personal.time_of_birth    (text, e.g. "14:30")
--        - personal.habits           (text, free-text; replaces the
--                                      old personal.smoking / personal.drinking
--                                      booleans)
--        - education.qualification_10th (text)
--        - education.qualification_12th (text)
--   3. Backfills `personal.habits` from the legacy smoking/drinking
--      booleans (where present) so existing profiles keep meaningful
--      data instead of an empty field, then leaves the old keys in
--      place (harmless, simply unused by the app going forward).
-- ============================================================

-- 1. New column: dedicated Property Details section ----------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS property JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.profiles.property IS
  'Dedicated Property Details section: owns_property, property_type, property_location, property_value, property_description.';

-- 2. Backfill habits free-text field from legacy smoking/drinking ----
-- Only touches rows where habits is not already set, so it is safe to re-run.
UPDATE public.profiles
SET personal = personal || jsonb_build_object(
  'habits',
  TRIM(BOTH ', ' FROM
    CONCAT(
      CASE WHEN (personal->>'smoking')::boolean IS TRUE THEN 'Smokes, ' ELSE '' END,
      CASE WHEN (personal->>'drinking')::boolean IS TRUE THEN 'Drinks, ' ELSE '' END
    )
  )
)
WHERE (personal ? 'smoking' OR personal ? 'drinking')
  AND (personal->>'habits' IS NULL OR personal->>'habits' = '');

COMMENT ON COLUMN public.profiles.personal IS
  'Personal details JSONB. Includes place_of_birth, time_of_birth, and free-text habits (replaces legacy smoking/drinking booleans).';

COMMENT ON COLUMN public.profiles.education IS
  'Education details JSONB. Includes qualification_10th and qualification_12th alongside highest_qualification.';