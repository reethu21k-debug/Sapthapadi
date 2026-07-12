# 🔱 Saptapadi — Premium Matrimonial Management Platform

> **"सप्तपदी — Seven Steps, One Soul"**  
> A complete CRM + Matrimony Management Software for Matrimony Offices.

---

## 📋 Overview

Saptapadi is a **production-ready, enterprise-grade** matrimonial management platform built with Next.js 15, Supabase, and Cloudinary. It is designed for matrimony offices to manage profiles, subscriptions, and profile sharing — not a self-service matrimony portal.

---

## ✨ Features

### Admin Panel
- **Dashboard** — Live stats: total users, male/female profiles, paid/free members, expiring subscriptions, pending profiles, **verified profiles**, revenue
- **Profile Management** — Create, edit, approve, reject, deactivate, suspend, reactivate, **verify**, and **delete** profiles with complete detail sections
- **Profile Verification** — Grant or remove the "Verified" trust badge on any profile, independent of the approve/reject workflow; profiles the admin creates themselves are verified automatically. The badge appears everywhere that profile is shown across the app (admin tables, user browse/match cards, profile detail pages, biodata preview, downloaded biodata PDF) and the member is notified in-app (and by email, if configured) when verified.
- **Multi-step Profile Form** — 9 sections: Personal, Address, Contact, Profession, Education, Family (with grandparents), Partner Preferences, Photos, About Me. Shared between the admin "Create Profile" screen and a member's self-signup "Create My Profile" screen.
- **Subscription Manager** — Add/cancel subscriptions, track payments (Cash/UPI/Card/Bank Transfer)
- **Profile Sharing** — Grant specific users access to specific profiles with optional expiry
- **Visibility Controls** — Per-profile privacy: hide/show phone, email, address, family details, income, documents
- **Plans Manager** — Edit pricing, duration, view limits, features per plan
- **Analytics** — Revenue charts, gender split, plan distribution, membership stats
- **Audit Logs** — Complete activity trail, including profile verification/unverification and deletion
- **Site Settings** — Success stories, testimonials, FAQs, contact info, banners

### User Panel
- **Dashboard** — Subscription status, profile completion, **verification status**, recent notifications, recently viewed profiles
- **Create My Profile** — Members without a profile yet can sign up and create their own profile; it starts as pending/unverified until an admin reviews and verifies it
- **My Matches** — View only admin-shared profiles with visibility controls applied
- **Favourites** — Save and view favourite profiles
- **My Biodata** — View and download their own biodata PDF (shows the Verified badge once granted)
- **Subscription** — View active plan, history, upgrade options
- **Notifications** — Mark read, delete notifications; receives a notification when their profile is verified

### PDF Biodata Generator
- Beautiful A4 PDF with navy/gold luxury design
- Profile photo, all personal/family/profession/education details
- Partner preferences, About Me section
- QR code linking to profile
- Unique Profile ID and generation date

### Email Notifications (Gmail SMTP)
- Registration welcome
- Profile approved/rejected
- Subscription activated/expiring/expired
- Password reset
- Profile shared notification
- Biodata generated

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Custom Design System |
| UI Components | shadcn/ui + Radix UI |
| Animations | Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| File Storage | Cloudinary |
| State | TanStack Query + Zustand |
| Tables | TanStack Table |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Email | Nodemailer (Gmail SMTP) |
| QR Code | qrcode |
| Deployment | Vercel |

---

## 🚀 Setup Instructions

### 1. Clone and Install

```bash
cd saptapadi
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
# Supabase — get from supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx

# Cloudinary — get from cloudinary.com/console
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=your_api_secret

# Gmail — use App Password (not your account password)
# Enable 2FA on Gmail → My Account → Security → App Passwords
GMAIL_USER=youroffice@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Saptapadi
```

### 3. Set Up Supabase Database

1. Create a new project on [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy and run the entire contents of `supabase/schema.sql`

This creates all tables, enums, RLS policies, triggers, indexes, and seeds default plans.

> **Already have this project running from before?** Don't re-run the whole
> `schema.sql` (it would fail on objects that already exist). Instead just
> run `supabase/migrations/0002_profile_verification.sql` once in the SQL
> Editor — it adds the profile verification feature on top of your existing
> database. See `VERIFICATION_FEATURE.md` for full details.

### 4. Create Admin User

After running the schema:

1. Register at `/register` with your admin email
2. In Supabase SQL Editor, run:

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'youradmin@email.com';
```

### 5. Run the Project

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 📁 Project Structure

```
saptapadi/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, Register, Forgot Password
│   │   ├── (public)/            # Homepage, About, Plans, Success Stories
│   │   ├── admin/               # Admin panel (protected)
│   │   │   ├── dashboard/
│   │   │   ├── profiles/
│   │   │   ├── users/
│   │   │   ├── subscriptions/
│   │   │   ├── shared-profiles/
│   │   │   ├── plans/
│   │   │   ├── analytics/
│   │   │   ├── audit-logs/
│   │   │   └── settings/
│   │   ├── user/                # User panel (protected)
│   │   │   ├── dashboard/
│   │   │   ├── profiles/
│   │   │   ├── favorites/
│   │   │   ├── biodata/
│   │   │   ├── subscription/
│   │   │   └── notifications/
│   │   └── api/
│   │       ├── biodata/[id]/    # PDF generation
│   │       ├── upload/          # Cloudinary upload
│   │       ├── email/           # Email sending
│   │       └── profiles/[id]/view/
│   ├── components/
│   │   ├── admin/               # Admin-specific components
│   │   ├── user/                # User-specific components
│   │   ├── forms/               # Shared form components
│   │   ├── layout/              # Navbar, Footer
│   │   └── shared/              # Shared components, Providers
│   ├── lib/
│   │   ├── supabase/            # Client + Server + Middleware
│   │   ├── cloudinary/          # Upload utilities
│   │   ├── email/               # Gmail SMTP + templates
│   │   ├── pdf/                 # jsPDF biodata generator
│   │   ├── validations/         # Zod schemas
│   │   ├── utils/               # Helper functions
│   │   └── store/               # Zustand stores
│   ├── types/                   # TypeScript types
│   └── middleware.ts            # Auth + route protection
├── supabase/
│   └── schema.sql               # Complete DB schema
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🗄️ Database Schema

### Tables
- `users` — Extends Supabase auth with role, phone, active status
- `profiles` — Complete matrimonial profiles (JSONB sections)
- `subscription_plans` — Plan configs with features and limits
- `subscriptions` — Member subscriptions with payment tracking
- `profile_access` — Admin-to-user profile sharing
- `profile_interactions` — Views, favourites, downloads
- `audit_logs` — Complete activity trail
- `notifications` — In-app notifications
- `site_settings` — Global site configuration
- `success_stories` — Published success stories
- `testimonials` — Published testimonials
- `faqs` — Published FAQs

### Security
- Row Level Security (RLS) on all tables
- Admins can access everything
- Users can only see their own data + admin-shared profiles
- JWT-based auth via Supabase

---

## 🌐 Deployment on Vercel

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy

```bash
npm run build  # Test build locally first
```

---

## 📞 Support

Built for matrimonial offices in India. For customization or support, contact your developer.

---

*© 2024 Saptapadi Matrimony — Where Souls Unite*
