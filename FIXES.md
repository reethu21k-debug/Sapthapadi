# Saptapadi — Bug Fix Report

This document lists every bug found in the project and exactly what was changed to fix it. The project was verified end‑to‑end after fixes: `npm install` (0 vulnerabilities) → `tsc --noEmit` (0 errors) → `next lint` (0 errors) → `next build` (succeeds, 34/34 routes generate) → `next start` (all public routes return HTTP 200, no server errors in logs).

## Critical bugs (would break the app once connected to a real Supabase project)

### 1. Infinite recursion in Row Level Security policies (`supabase/schema.sql`)
Every "admin can do X" policy was written as:
```sql
EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
```
When this subquery runs *inside a policy on `public.users` itself* (e.g. "Admins can view all users"), Postgres has to re‑evaluate the RLS policy on `public.users` in order to evaluate the subquery that is *part of* that same policy — causing `ERROR: infinite recursion detected in policy for relation "users"`. This isn't a hypothetical edge case; it would fire on the very first admin login or any `/admin/*` page load, because the middleware checks the caller's role with exactly this kind of query.

**Fix:** Added a `SECURITY DEFINER` helper function `public.is_admin()` (`STABLE`, safe `search_path`, returns `BOOLEAN`) and replaced every inline subquery with a call to it. Functions created this way in Supabase are owned by a superuser role, so Postgres skips RLS evaluation inside the function body, which breaks the recursive loop. This is the fix pattern Supabase officially recommends for this exact error. Verified by grepping the whole schema: `public.users` is now referenced only by foreign keys, indexes, aggregate stats queries, and the one safe call inside `is_admin()` itself — no policy queries it directly anymore.

### 2. Privilege escalation via "Users can update own profile" policy
```sql
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());
```
This only restricts *which row* a user can target — not *which columns*. A regular user could send an update to their own profile that also sets `status = 'approved'`, `is_verified = true`, rewrites `approved_by`/`approved_at`/`created_by`, reassigns `user_id` to someone else's account, or backdates `created_at`/`profile_id`, bypassing the entire admin approval workflow.

**Fix:** Added a `BEFORE UPDATE` trigger (`protect_profile_admin_fields`, `SECURITY DEFINER`) that pins `status`, `is_verified`, `approved_by`, `approved_at`, `rejection_reason`, `created_by`, `user_id`, `created_at`, and `profile_id` back to their previous values whenever the actor isn't an admin (checked via `is_admin()`). Admin writes (via the service-role client) are unaffected. Confirmed `public.users` itself has no "update own row" policy at all — only `SELECT` (own row) and admin `FOR ALL` — so there's no separate escalation path on `users.role`; the app never updates that table from client code.

### 3. Vulnerable Next.js version
`package.json` originally pinned `next` to `15.1.3`, affected by **CVE‑2025‑66478** (CVSS 10.0, unauthenticated RCE via React Server Components deserialization, "React2Shell").

An initial pass bumped this to `15.1.11`, but a fresh `npm audit` against that version still showed it exposed to roughly 15 *additional* Next.js advisories disclosed and patched **after** 15.1.11 shipped, including:
- **Authorization Bypass in Next.js Middleware** — CVSS 9.1, fixed in 15.2.3 (`GHSA-f82v-jwr5-mffw`)
- HTTP request smuggling in rewrites — fixed in 15.5.13
- Multiple Denial-of-Service issues in Server Components / Image Optimization — fixed across 15.5.14–15.5.16
- Cache poisoning, CSP-nonce XSS, and middleware/i18n bypass issues — fixed in 15.5.16

None of these were backported to the 15.1.x patch branch, so staying on 15.1.x (even the latest `15.1.12`) leaves the app exposed.

**Fix:** Upgraded to **`next@15.5.19`** and `eslint-config-next@15.5.19` — the latest patched release on the Next 15 line (chosen over a Next 16 major bump to avoid unnecessary breaking changes). `npm audit` now reports the `next` package as clean.

## Dependency vulnerabilities found during the audit (not in the original list, but real and fixable)

- **`jspdf-autotable`** — present in `package.json` but unused in code (the PDF biodata layout in `lib/pdf/biodata-generator.ts` is built manually with `doc.text`/`doc.rect`/`doc.addImage`, no tables). It pulled in a vulnerable `dompurify` chain (13 advisories, XSS/prototype pollution). **Removed entirely.**
- **`jspdf`** `2.5.2` → **`4.2.1`** — the 2.x line depends on the same vulnerable `dompurify`. Verified the upgrade is safe: the app only uses stable, unchanged APIs (`setFont`, `setFillColor`, `text`, `addImage`, `roundedRect`, `output("arraybuffer")`).
- **`nodemailer`** `6.9.16` → **`9.0.1`** — the installed range was vulnerable to SMTP command injection, CRLF header injection, SSRF via the `raw` option, and OAuth2 TLS validation issues (8 advisories total). Verified the app only uses `createTransport`, `sendMail`, and `verify` — all stable across the major bumps.
- **`postcss`** `<8.5.10` (XSS via unescaped `</style>` in stringified output) — this copy was bundled *inside* `next`'s own `node_modules` as an internal build-time dependency, with no fix shipped by Next itself at this version. Added an `"overrides"` entry in `package.json` to force `postcss@^8.5.10` everywhere, including nested copies, and aligned the top-level `devDependencies` entry to match (npm rejects an override that conflicts with a direct dependency range).

**Result:** `npm audit` went from **7 vulnerabilities (1 critical, 2 high, 4 moderate)** to **0 vulnerabilities**.

## Code-quality bugs (caught by `next lint`, would fail CI/strict builds)

- **`ProfileForm.tsx`** — 9 instances of unescaped `'` apostrophes in JSX text (`react/no-unescaped-entities`), and a naming collision where the `Image` icon imported from `lucide-react` was being misidentified by the accessibility linter as Next's `<Image>` component (which requires `alt`). Renamed the icon import to `ImageIcon` and escaped all apostrophes.
- **`PublicFooter.tsx`**, **`PublicSections.tsx`** — unescaped `'` and `"` characters in JSX text.
- **`NotificationsClient.tsx`** — unescaped apostrophe; unused `router`/`useRouter` import.
- **`UserProfileDetailView.tsx`** — unused `router`/`useRouter`, unused `Eye`/`EyeOff` icon imports.
- **`UserTopbar.tsx`** — unused `cn` import and unused `user` prop destructure.
- **`ProfileCard.tsx`** — unused `subscription` prop destructure.
- **`SettingsForm.tsx`** — unused `Edit`, `X`, `Check` icon imports.
- **`HeroSection.tsx`** — unused `Search` icon import.
- **`PlansSection.tsx`** — unused `formatCurrency` import (price is formatted inline elsewhere in the file).
- **`lib/pdf/biodata-generator.ts`** — unused `jspdf-autotable` import, later removed as a dependency entirely (see above).

None of these affected runtime behavior, but `next lint` reported them as hard errors, which would fail a CI pipeline or `next build --strict` style checks.

## Verified working end-to-end

- `npm install` — clean, **0 vulnerabilities** (`npm audit`)
- `npx tsc --noEmit` — **0 errors**
- `npx next lint` — **0 errors** (only expected `<img>`/custom-font performance warnings remain, intentional since profile photos are loaded from external Cloudinary URLs at runtime)
- `npm run build` — succeeds, all 34 routes compile and generate
- `npm run start` — server boots, all public pages (`/`, `/login`, `/register`, `/plans`, `/about`, `/contact`, `/forgot-password`, `/reset-password`, `/success-stories`) return HTTP 200 with real rendered content and no server-side errors in the logs

## What you still need to do

This app requires a live Supabase project, Cloudinary account, and Gmail App Password to function beyond the public marketing pages (the admin/user dashboards need a real database). Follow the **Setup Instructions** in `README.md`:
1. `npm install`
2. `cp .env.local.example .env.local` and fill in real credentials
3. Run `supabase/schema.sql` in the Supabase SQL editor (no recursion errors, privilege-escalation trigger active)
4. Register an account, then promote it to admin via the SQL editor as described in the README
5. `npm run dev`

**One more thing worth knowing:** because security advisories for frameworks like Next.js ship continuously, treat `15.5.19` as the state of the art *as of this fix*, not a permanent guarantee — run `npm audit` again before your next deploy, since fix availability changes monthly.
