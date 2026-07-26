-- ============================================================
-- Migration: remove Weight, Blood Group, Complexion, Manglik,
-- Dietary Preference (food_preference), and Habits from profiles.
--
-- These were never separate columns — they lived as keys inside the
-- `personal` JSONB column — so no ALTER TABLE / column drop is needed.
-- This migration just strips the keys out of existing rows so old
-- data doesn't linger and get picked up again if any code still reads
-- from `personal->>'weight_kg'` etc.
--
-- Safe to run multiple times (the `-` jsonb operator is a no-op if the
-- key is already gone).
-- ============================================================

UPDATE public.profiles
SET personal = personal
  - 'weight_kg'
  - 'blood_group'
  - 'complexion'
  - 'manglik'
  - 'food_preference'
  - 'habits';