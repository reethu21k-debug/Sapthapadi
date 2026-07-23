-- ============================================================
-- Migration: Remove deprecated profile fields
-- Removes: personal.mother_tongue, about_me (top-level column),
--          family.family_type, family.family_status,
--          family.family_values, family.native_place
-- ============================================================
-- These were JSONB keys (mother_tongue/family_* live inside the
-- `personal`/`family` JSONB columns) plus one real column (`about_me`).
-- The application code no longer reads or writes these fields as of
-- this release; this migration cleans up existing rows so exports,
-- PDFs, and any raw JSONB queries don't surface stale data.

BEGIN;

UPDATE profiles
SET personal = personal - 'mother_tongue'
WHERE personal ? 'mother_tongue';

UPDATE profiles
SET family = (family - 'family_type' - 'family_status' - 'family_values' - 'native_place')
WHERE family ?| array['family_type', 'family_status', 'family_values', 'native_place'];

-- `about_me` was a real top-level column on `profiles`, not JSONB.
ALTER TABLE profiles DROP COLUMN IF EXISTS about_me;

COMMIT;