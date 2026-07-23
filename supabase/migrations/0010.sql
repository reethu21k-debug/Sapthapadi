-- ============================================================
-- Migration: Allow subscriptions for profiles with no linked user
-- (idempotent — safe to run multiple times / on partially-applied DBs)
-- ============================================================

BEGIN;

ALTER TABLE public.subscriptions
  ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.subscriptions'::regclass
      AND conname = 'subscriptions_user_or_profile_required'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_user_or_profile_required
      CHECK (user_id IS NOT NULL OR profile_id IS NOT NULL);
  END IF;
END $$;

COMMIT;