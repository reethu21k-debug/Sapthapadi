-- ============================================================
-- SAPTAPADI — Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- ─── ENUMS ──────────────────────────────────────────────────

CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE marital_status_type AS ENUM ('never_married', 'divorced', 'widowed');
CREATE TYPE profile_status_type AS ENUM ('pending', 'approved', 'rejected', 'deactivated', 'suspended');
CREATE TYPE subscription_plan_type AS ENUM ('free', 'six_months', 'one_year', 'premium', 'vip');
CREATE TYPE subscription_status_type AS ENUM ('active', 'pending', 'expired', 'cancelled');
CREATE TYPE payment_mode_type AS ENUM ('cash', 'upi', 'card', 'bank_transfer');
CREATE TYPE user_role_type AS ENUM ('admin', 'user');
CREATE TYPE audit_action_type AS ENUM (
  'profile_created', 'profile_edited', 'profile_deleted',
  'profile_approved', 'profile_rejected', 'profile_deactivated',
  'profile_suspended', 'profile_reactivated', 'profile_viewed',
  'biodata_generated', 'biodata_downloaded', 'profile_shared',
  'profile_access_revoked', 'subscription_created', 'subscription_updated',
  'subscription_cancelled', 'user_created', 'user_updated', 'user_deactivated',
  'plan_created', 'plan_updated', 'setting_updated', 'login', 'logout',
  'profile_verified', 'profile_unverified', 'profile_self_registered',
  'profile_share_updated', 'match_meeting_requested', 'match_meeting_accepted',
  'match_meeting_rejected', 'match_meeting_completed', 'match_meeting_cancelled'
);
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
CREATE TYPE interaction_type AS ENUM ('view', 'favourite', 'download', 'share', 'block');
CREATE TYPE match_meeting_status_type AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');

-- ─── USERS (extends Supabase auth.users) ────────────────────

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role_type NOT NULL DEFAULT 'user',
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- ─── SUBSCRIPTION PLANS ──────────────────────────────────────

CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan subscription_plan_type NOT NULL UNIQUE,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  profile_view_limit INTEGER, -- NULL = unlimited
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default plans
INSERT INTO public.subscription_plans (name, plan, duration_days, price, profile_view_limit, features, sort_order) VALUES
  ('Free', 'free', 0, 0, 5, '["View up to 5 profiles", "Basic profile creation", "Email support"]', 1),
  ('6 Months', 'six_months', 180, 2999, 100, '["View up to 100 profiles", "Priority support", "Profile highlighted", "WhatsApp assistance"]', 2),
  ('1 Year', 'one_year', 365, 4999, NULL, '["Unlimited profile views", "Priority support", "Premium listing", "Dedicated manager"]', 3),
  ('Premium', 'premium', 365, 7999, NULL, '["Unlimited views", "VIP support", "Featured profile", "Horoscope matching", "Dedicated manager"]', 4),
  ('VIP', 'vip', 365, 14999, NULL, '["Everything in Premium", "Personalized matchmaking", "Home visits", "100% privacy", "Exclusive matches"]', 5);

-- ─── PROFILES ────────────────────────────────────────────────

CREATE SEQUENCE profile_id_seq START 1;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id TEXT NOT NULL UNIQUE DEFAULT ('SPM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('profile_id_seq')::TEXT, 5, '0')),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Stored as JSONB for flexibility
  personal JSONB NOT NULL DEFAULT '{}',
  address JSONB NOT NULL DEFAULT '{}',
  contact JSONB NOT NULL DEFAULT '{}',
  profession JSONB NOT NULL DEFAULT '{}',
  education JSONB NOT NULL DEFAULT '{}',
  family JSONB NOT NULL DEFAULT '{}',
  property JSONB NOT NULL DEFAULT '{}',
  partner_preferences JSONB NOT NULL DEFAULT '{}',
  about_me TEXT,

  -- Images and docs
  images JSONB NOT NULL DEFAULT '{"profile_photo": null, "photo_2": null, "photo_3": null}',
  documents JSONB NOT NULL DEFAULT '{"horoscope_pdf": null, "biodata_pdf": null, "additional_docs": []}',

  -- Visibility
  visibility JSONB NOT NULL DEFAULT '{
    "show_phone": false,
    "show_email": false,
    "show_address": false,
    "show_family_details": false,
    "show_income": false,
    "show_documents": false
  }',

  status profile_status_type NOT NULL DEFAULT 'pending',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  profile_completion INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- "Verified" badge — a distinct trust signal from `status`/`approved_*`.
  -- `status = approved` means the profile is live/visible; `is_verified`
  -- means an admin has separately confirmed the person's identity/details
  -- and granted the blue-check "Verified" badge shown across the app.
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ
);

-- Extracted columns for fast filtering
--
-- NOTE ON IMMUTABILITY: a STORED generated column's expression must be
-- IMMUTABLE. Casting text directly to an enum (::gender_type) or to DATE
-- fails that check — enum_in is volatility-classed STABLE (enum labels can
-- be added later via ALTER TYPE ... ADD VALUE) and date's text input
-- depends on the DateStyle setting — so Postgres raises
-- "42P17: generation expression is not immutable" for both. Wrapping the
-- cast in a tiny SQL function explicitly marked IMMUTABLE fixes this:
-- Postgres trusts the function's declared volatility rather than
-- re-checking the cast inside it. (DECIMAL and plain ->> text extraction
-- below don't need this — numeric_in has no such dependency.)
CREATE OR REPLACE FUNCTION public.text_to_gender(val text)
RETURNS gender_type LANGUAGE sql IMMUTABLE AS $$ SELECT val::gender_type $$;

CREATE OR REPLACE FUNCTION public.text_to_marital_status(val text)
RETURNS marital_status_type LANGUAGE sql IMMUTABLE AS $$ SELECT val::marital_status_type $$;

CREATE OR REPLACE FUNCTION public.text_to_date(val text)
RETURNS DATE LANGUAGE sql IMMUTABLE AS $$ SELECT val::DATE $$;

ALTER TABLE public.profiles ADD COLUMN gender gender_type GENERATED ALWAYS AS (public.text_to_gender(personal->>'gender')) STORED;
ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE GENERATED ALWAYS AS (public.text_to_date(personal->>'date_of_birth')) STORED;
ALTER TABLE public.profiles ADD COLUMN religion TEXT GENERATED ALWAYS AS (personal->>'religion') STORED;
ALTER TABLE public.profiles ADD COLUMN caste TEXT GENERATED ALWAYS AS (personal->>'caste') STORED;
ALTER TABLE public.profiles ADD COLUMN district TEXT GENERATED ALWAYS AS (address->>'district') STORED;
ALTER TABLE public.profiles ADD COLUMN state TEXT GENERATED ALWAYS AS (address->>'state') STORED;
ALTER TABLE public.profiles ADD COLUMN country TEXT GENERATED ALWAYS AS (address->>'country') STORED;
ALTER TABLE public.profiles ADD COLUMN marital_status marital_status_type GENERATED ALWAYS AS (public.text_to_marital_status(personal->>'marital_status')) STORED;
ALTER TABLE public.profiles ADD COLUMN profession_name TEXT GENERATED ALWAYS AS (profession->>'profession') STORED;
ALTER TABLE public.profiles ADD COLUMN annual_income DECIMAL GENERATED ALWAYS AS ((profession->>'annual_income')::DECIMAL) STORED;

-- Indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
-- A real person should only have one self-registered profile. Admin-created
-- "shadow" profiles (no linked auth account) keep user_id NULL and are
-- unaffected since the partial index only applies where user_id IS NOT NULL.
CREATE UNIQUE INDEX idx_profiles_user_id_unique ON public.profiles(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_profiles_gender ON public.profiles(gender);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_is_verified ON public.profiles(is_verified);
CREATE INDEX idx_profiles_religion ON public.profiles(religion);
CREATE INDEX idx_profiles_caste ON public.profiles(caste);
CREATE INDEX idx_profiles_district ON public.profiles(district);
CREATE INDEX idx_profiles_state ON public.profiles(state);
CREATE INDEX idx_profiles_marital_status ON public.profiles(marital_status);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX idx_profiles_full_text ON public.profiles USING gin(
  to_tsvector('english',
    COALESCE(personal->>'first_name', '') || ' ' ||
    COALESCE(personal->>'last_name', '') || ' ' ||
    COALESCE(personal->>'religion', '') || ' ' ||
    COALESCE(personal->>'caste', '') || ' ' ||
    COALESCE(profession->>'profession', '') || ' ' ||
    COALESCE(address->>'district', '') || ' ' ||
    COALESCE(address->>'state', '')
  )
);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan subscription_plan_type NOT NULL,
  plan_config_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status subscription_status_type NOT NULL DEFAULT 'pending',
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  payment_mode payment_mode_type NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_reference TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expiry ON public.subscriptions(expiry_date);
CREATE INDEX idx_subscriptions_plan ON public.subscriptions(plan);

-- ─── PROFILE ACCESS ────────────────────────────────────────────

CREATE TABLE public.profile_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  granted_to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_by_admin_id UUID NOT NULL REFERENCES public.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  -- Per-section, per-field visibility map (see src/lib/profile-privacy.ts).
  -- NULL = no restrictions, the full profile is visible to the recipient.
  visible_fields JSONB,
  UNIQUE(granted_to_user_id, profile_id)
);

CREATE INDEX idx_access_user_id ON public.profile_access(granted_to_user_id);
CREATE INDEX idx_access_profile_id ON public.profile_access(profile_id);
CREATE INDEX idx_access_active ON public.profile_access(is_active);

-- ─── PROFILE ADMIN DOCUMENTS (admin-only, e.g. "SA Form") ───────
-- Kept in a separate table (not a column on `profiles`) so it can
-- never leak to the profile owner via the existing "Users can view
-- own and accessible profiles" policy on `profiles`, which is a
-- row-level (not column-level) grant. See migration 0005 for details.

CREATE TABLE public.profile_admin_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  sa_form_url TEXT,
  sa_form_public_id TEXT,
  sa_form_format TEXT,
  sa_form_uploaded_at TIMESTAMPTZ,
  sa_form_uploaded_by UUID REFERENCES public.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (profile_id)
);

-- ─── PROFILE INTERACTIONS ──────────────────────────────────────

CREATE TABLE public.profile_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interaction_type interaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_user_id ON public.profile_interactions(user_id);
CREATE INDEX idx_interactions_profile_id ON public.profile_interactions(profile_id);
CREATE INDEX idx_interactions_type ON public.profile_interactions(interaction_type);
-- For favourites - unique constraint
CREATE UNIQUE INDEX idx_interactions_favourite ON public.profile_interactions(user_id, profile_id)
  WHERE interaction_type = 'favourite';

-- ─── MATCH MEETING REQUESTS ──────────────────────────────────────
-- Once a user has been granted access to a shared profile and likes what
-- they see, they can request an in-person "match meeting" with that
-- profile. The admin accepts/rejects the request and, once the meeting
-- has taken place, marks it completed.

CREATE TABLE public.match_meeting_requests (
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

CREATE INDEX idx_match_meetings_user_id ON public.match_meeting_requests(requested_by_user_id);
CREATE INDEX idx_match_meetings_profile_id ON public.match_meeting_requests(profile_id);
CREATE INDEX idx_match_meetings_status ON public.match_meeting_requests(status);
CREATE INDEX idx_match_meetings_created_at ON public.match_meeting_requests(created_at DESC);

-- Only one *pending* request per (user, profile) pair at a time — a user
-- can still request again later if a previous request was rejected/
-- cancelled, but can't spam duplicate pending requests.
CREATE UNIQUE INDEX idx_match_meetings_pending_unique
  ON public.match_meeting_requests(requested_by_user_id, profile_id)
  WHERE status = 'pending';

-- ─── AUDIT LOGS ────────────────────────────────────────────────

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES public.users(id),
  actor_role user_role_type NOT NULL,
  actor_name TEXT NOT NULL,
  action audit_action_type NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_action ON public.audit_logs(action);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON public.audit_logs(created_at DESC);

-- ─── NOTIFICATIONS ─────────────────────────────────────────────

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ─── SITE SETTINGS ─────────────────────────────────────────────

CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name TEXT NOT NULL DEFAULT 'Saptapadi',
  site_tagline TEXT NOT NULL DEFAULT 'Where Souls Unite',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_address TEXT NOT NULL DEFAULT '',
  banner_title TEXT,
  banner_subtitle TEXT,
  banner_image_url TEXT,
  social_links JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.site_settings (site_name, site_tagline, contact_email, contact_phone) 
VALUES ('Saptapadi', 'Where Souls Unite', 'contact@saptapadi.in', '+91 9999999999');

-- ─── SUCCESS STORIES ───────────────────────────────────────────

CREATE TABLE public.success_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_names TEXT NOT NULL,
  wedding_date DATE,
  story TEXT NOT NULL,
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TESTIMONIALS ──────────────────────────────────────────────

CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── FAQS ──────────────────────────────────────────────────────

CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── HELPER FUNCTIONS ──────────────────────────────────────────

-- IMPORTANT: Do NOT write RLS policies (or trigger functions used by RLS-
-- protected tables) that run
--   EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
-- directly inline inside a policy on public.users itself (or in a way that
-- re-triggers RLS evaluation on public.users from another policy that
-- Postgres ends up nesting). Doing so causes
-- "infinite recursion detected in policy for relation \"users\"" errors,
-- because evaluating the policy requires re-running the policy.
--
-- The fix: a SECURITY DEFINER helper function. Functions created this way
-- in Supabase's SQL editor are owned by a superuser role, and Postgres
-- skips RLS checks for the table owner / superuser roles, so the lookup
-- inside is_admin() does not recursively re-trigger the RLS policy that
-- is calling it.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─── TRIGGERS ──────────────────────────────────────────────────

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_profile_admin_documents_updated_at BEFORE UPDATE ON public.profile_admin_documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_match_meetings_updated_at BEFORE UPDATE ON public.match_meeting_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Guard against privilege escalation: the "Users can update own profile" RLS
-- policy below only restricts which ROW a non-admin can target (their own),
-- not which COLUMNS they may change. Without this trigger a user could send
-- an update to their own profile that also flips status to 'approved',
-- sets is_verified = true, rewrites approved_by/approved_at, or even
-- reassigns user_id to another account. This trigger silently pins those
-- admin-only fields back to their previous values whenever the actor is not
-- an admin (admin writes, e.g. via the service-role client, are unaffected).
CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.status := OLD.status;
    NEW.is_verified := OLD.is_verified;
    NEW.approved_by := OLD.approved_by;
    NEW.approved_at := OLD.approved_at;
    NEW.verified_by := OLD.verified_by;
    NEW.verified_at := OLD.verified_at;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.created_by := OLD.created_by;
    NEW.user_id := OLD.user_id;
    NEW.created_at := OLD.created_at;
    NEW.profile_id := OLD.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_protect_profile_admin_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_fields();

-- Same idea, but for INSERT: a self-signed-up user (the "Users can create
-- own profile" policy below) must never be able to insert a profile that is
-- pre-approved or pre-verified, or that is created on someone else's behalf.
-- Whatever the client sends for these fields is overwritten with safe
-- defaults unless the actor is an admin (the admin "Create Profile" screen
-- is the only place that legitimately sets status/verification at insert
-- time, e.g. to auto-verify a profile the admin builds on a member's behalf).
CREATE OR REPLACE FUNCTION public.enforce_profile_insert_defaults()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.user_id := auth.uid();
    NEW.created_by := auth.uid();
    NEW.status := 'pending';
    NEW.is_verified := false;
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
    NEW.rejection_reason := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_enforce_profile_insert_defaults
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_insert_defaults();

-- Auto-create user record when auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-expire subscriptions
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE status = 'active' AND expiry_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_admin_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_meeting_requests ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    public.is_admin()
  );

CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (
    public.is_admin()
  );

-- Profiles policies  
CREATE POLICY "Admins can do everything on profiles" ON public.profiles
  FOR ALL USING (
    public.is_admin()
  );

CREATE POLICY "Users can view own and accessible profiles" ON public.profiles
  FOR SELECT USING (
    -- Own profile, regardless of status — a user must be able to see their
    -- own profile while it's still pending verification/approval.
    user_id = auth.uid() OR
    (
      status = 'approved' AND
      -- Admin granted access
      EXISTS (
        SELECT 1 FROM public.profile_access
        WHERE profile_id = profiles.id
          AND granted_to_user_id = auth.uid()
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > NOW())
      )
    )
  );

-- Lets a logged-in user create their own profile ("sign up on their own").
-- The trigger_enforce_profile_insert_defaults trigger above guarantees the
-- row always lands as unverified/pending and owned by the inserting user,
-- no matter what the client sends.
CREATE POLICY "Users can create own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
  FOR ALL USING (
    public.is_admin()
  );

-- Profile access policies
CREATE POLICY "Users can view own access" ON public.profile_access
  FOR SELECT USING (granted_to_user_id = auth.uid());

CREATE POLICY "Admins can manage access" ON public.profile_access
  FOR ALL USING (
    public.is_admin()
  );

-- Profile admin documents ("SA Form") — admin-only, no owner-access
-- policy exists here by design; see note above the table definition.
CREATE POLICY "Admins can manage profile admin documents" ON public.profile_admin_documents
  FOR ALL USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- Interactions
CREATE POLICY "Users can manage own interactions" ON public.profile_interactions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all interactions" ON public.profile_interactions
  FOR SELECT USING (
    public.is_admin()
  );

-- Match meeting requests
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

-- Notifications
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Audit logs (admin only)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    public.is_admin()
  );

-- Public tables (no RLS needed for reads)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (
  public.is_admin()
);

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published stories" ON public.success_stories FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage stories" ON public.success_stories FOR ALL USING (
  public.is_admin()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published testimonials" ON public.testimonials FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage testimonials" ON public.testimonials FOR ALL USING (
  public.is_admin()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published faqs" ON public.faqs FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage faqs" ON public.faqs FOR ALL USING (
  public.is_admin()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL USING (
  public.is_admin()
);

-- ─── VIEWS ─────────────────────────────────────────────────────

-- Dashboard stats view
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

-- Per-profile completed match meeting counts — one row per profile, giving
-- the number of COMPLETED match meetings that person has been part of,
-- whether as the requester (via their linked user_id) or as the one
-- requested to meet (via profile_id on the request). Used by the admin
-- Profiles list/detail views to avoid an N+1 query per row.
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