# Profile Verification Feature

This document explains the verification/badge system added to Saptapadi: who can
create a profile, how the "Verified" badge works, and what an admin can do.

## What was added

1. **Self sign-up** — A logged-in member without a profile yet can go to
   **My Biodata → Create My Profile** (`/user/profile/create`) and fill in
   their own matrimonial profile, the same multi-step form the admin uses.
   A self-created profile always starts as `status = pending` and
   `is_verified = false` — enforced in the database, not just the UI, so it
   can't be bypassed from the browser.

2. **Admin-created profiles are auto-verified** — When an admin creates a
   profile from **Admin → Profiles → Create Profile**, it is automatically
   saved as `status = approved` and `is_verified = true`, with
   `approved_by` / `verified_by` set to that admin and timestamps recorded.
   No extra step is needed.

3. **Admin verification of self-signed-up profiles** — On **Admin →
   Profiles**, every row and the profile detail page has a **Verify**
   action (blue checkmark icon, or "Verify Profile" / "Remove
   Verification" in the row's "⋮" menu, or the buttons on the profile
   detail page header). Verifying:
   - Sets `is_verified = true`, `verified_by = <admin id>`, `verified_at = now()`.
   - Writes an audit log entry (`profile_verified` / `profile_unverified`),
     visible on **Admin → Audit Logs** and the profile's own Activity tab.
   - Sends the member an in-app notification ("Your profile is now
     Verified").
   - Sends a "You're Verified!" email if the profile has a contact email
     and email sending is configured (best-effort — never blocks the
     action if it fails).
   - "Remove Verification" reverses all of the above (badge fields only;
     it does not change the audit trail or send a removal notification).

   Verification is intentionally **separate from Approve/Reject** —
   approval controls whether a profile is live/visible at all; verification
   is an additional trust signal an admin can grant or revoke independently.

4. **Admin delete** — Admins can permanently delete any profile from the
   row actions menu or the profile detail page ("Delete" button). This was
   already wired up in the table; it has now also been added to the detail
   page, and a delete event is recorded in the audit log before the row is
   removed.

5. **The badge reflects everywhere a profile appears**:
   - Admin profiles table & profile detail page
   - User-facing browse/match cards (`ProfileCard`)
   - User-facing profile detail page
   - The member's own "My Biodata" page
   - The member's sidebar (next to their name)
   - The downloaded biodata PDF (a small "✓ VERIFIED" mark next to the name)
   - The admin dashboard ("Verified Profiles" stat card + an "Awaiting
     Verification" widget listing approved-but-unverified profiles)

## Database changes

- `profiles.verified_by` / `profiles.verified_at` — new columns, separate
  from the existing `approved_by` / `approved_at` (which remain tied to the
  approve/reject status workflow).
- New `audit_action_type` enum values: `profile_verified`,
  `profile_unverified`, `profile_self_registered`.
- A unique index ensures one self-registered profile per user account
  (`idx_profiles_user_id_unique`, scoped to rows where `user_id IS NOT NULL`
  so admin-created "shadow" profiles with no linked account are unaffected).
- A new `BEFORE INSERT` trigger (`enforce_profile_insert_defaults`) forces
  any non-admin insert to start as `pending` / unverified / owned by the
  inserting user — this is what makes self sign-up safe even though the
  client also sends a payload.
- The existing `BEFORE UPDATE` trigger that protects admin-only fields now
  also pins `verified_by` / `verified_at`, so a member can never verify
  (or un-verify) their own profile by crafting a request.
- New RLS policy: members can `INSERT` their own profile
  (`user_id = auth.uid()`), and the `SELECT` policy was widened so a member
  can always see their own profile, even while it's still pending (it
  previously only allowed viewing `approved` profiles, which meant a user
  couldn't see their own profile before an admin approved it).
- `dashboard_stats` view gains a `verified_profiles` count.

## Applying this to an existing Supabase project

If you already ran `supabase/schema.sql` before this change, **don't
re-run the whole file**. Instead, open the Supabase SQL Editor and run:

```
supabase/migrations/0002_profile_verification.sql
```

It's additive and safe to re-run. New projects can just use the updated
`supabase/schema.sql` as-is — it already contains everything above.

## Where the code lives

| Concern | File |
|---|---|
| Verified badge UI | `src/components/shared/VerifiedBadge.tsx` |
| Shared create/edit form (admin + self) | `src/components/shared/ProfileForm.tsx` |
| Admin self-create CTA / page | `src/app/user/profile/create/page.tsx` |
| Admin verify/delete actions (table) | `src/components/admin/ProfilesTable.tsx` |
| Admin verify/delete actions (detail page) | `src/components/admin/ProfileDetailView.tsx` |
| Audit log + notification + email helpers | `src/lib/audit.ts` |
| PDF "✓ VERIFIED" mark | `src/lib/pdf/biodata-generator.ts` |
| Verified filter on the profiles list | `src/components/admin/ProfileFiltersBar.tsx`, `src/app/admin/profiles/page.tsx` |
