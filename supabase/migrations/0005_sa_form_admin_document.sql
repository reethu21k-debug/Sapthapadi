-- ============================================================
-- SAPTAPADI — Migration: Admin-Only "SA Form" Document
-- Run this in your Supabase SQL Editor after 0004_property_birth_habits.sql.
-- Safe to re-run.
--
-- What this adds:
--   A dedicated `profile_admin_documents` table holding one optional
--   file per profile — the "SA Form" (PDF or image, any format) —
--   that is visible ONLY to admins, never to the profile owner or
--   anyone else.
--
--   This is intentionally a SEPARATE TABLE rather than a new column
--   on `profiles`. The `profiles` table has a "Users can view own
--   and accessible profiles" RLS policy that lets the profile owner
--   (and anyone the admin explicitly shared the profile with) run
--   `select("*")` on their own row. RLS in Postgres is row-level,
--   not column-level, so any new column added directly to `profiles`
--   would be readable by the owner through that existing policy.
--   Using a separate table with admin-only RLS (no owner-access
--   policy at all) guarantees the SA Form can never leak to a
--   regular user, regardless of what the user-facing app queries.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profile_admin_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- "SA Form" — optional, admin-uploaded document (PDF or image, any format)
  sa_form_url TEXT,
  sa_form_public_id TEXT,       -- Cloudinary public_id, needed to delete/replace the asset
  sa_form_format TEXT,          -- e.g. "pdf", "jpg", "png"
  sa_form_uploaded_at TIMESTAMPTZ,
  sa_form_uploaded_by UUID REFERENCES public.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (profile_id)
);

COMMENT ON TABLE public.profile_admin_documents IS
  'Admin-only documents attached to a profile. Never exposed to the profile owner or shared members. Currently holds the optional "SA Form" upload.';

-- Keep updated_at fresh on every change, reusing the shared trigger
-- function already defined in schema.sql (public.handle_updated_at()).
DROP TRIGGER IF EXISTS trigger_profile_admin_documents_updated_at ON public.profile_admin_documents;
CREATE TRIGGER trigger_profile_admin_documents_updated_at
  BEFORE UPDATE ON public.profile_admin_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─── Row Level Security ────────────────────────────────────────
ALTER TABLE public.profile_admin_documents ENABLE ROW LEVEL SECURITY;

-- Admins only — no policy grants access to the profile owner or any
-- shared/access-granted member, by design.
CREATE POLICY "Admins can manage profile admin documents"
  ON public.profile_admin_documents
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());