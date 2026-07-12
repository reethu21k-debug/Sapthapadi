-- ============================================================
-- SAPTAPADI — Migration: Granular Profile Share Privacy Controls
-- Run this in your Supabase SQL Editor after 0002_profile_verification.sql.
-- Safe to re-run.
--
-- What this adds:
--   1. profile_access.visible_fields JSONB — a per-section, per-field
--      map (see src/lib/profile-privacy.ts for the canonical registry)
--      that lets an admin choose EXACTLY which fields of a profile are
--      visible to the specific member it was shared with, instead of
--      sharing the whole profile.
--      NULL (the default) means "no restrictions" — fully backward
--      compatible with every access grant created before this feature.
--   2. A new audit_action_type value, 'profile_share_updated', so
--      changing an existing share's privacy settings is distinguishable
--      from the initial 'profile_shared' grant in the audit log.
-- ============================================================

-- 1. New column ---------------------------------------------------
ALTER TABLE public.profile_access ADD COLUMN IF NOT EXISTS visible_fields JSONB;

COMMENT ON COLUMN public.profile_access.visible_fields IS
  'Per-section, per-field visibility map controlling exactly what the recipient can see. NULL = fully visible (no restrictions).';

-- 2. New audit action type ----------------------------------------
ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'profile_share_updated';