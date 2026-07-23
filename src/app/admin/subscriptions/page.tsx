import { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { SubscriptionsManager } from "@/components/admin/SubscriptionsManager";

export const metadata: Metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage() {
  // Uses the admin (service-role) client rather than the session-based
  // client — this page is already gated to admins only, and reading with
  // the regular client meant RLS silently filtered out subscriptions rows
  // (e.g. any not directly owned by the logged-in admin's own user_id),
  // so newly assigned subscriptions never showed up here despite the
  // insert (via the admin API route) succeeding.
  const supabase = await createAdminClient();

  const [
    { data: subscriptions, error: subscriptionsError },
    { data: users, error: usersError },
    { data: plans, error: plansError },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      // `subscriptions` has two foreign keys into `users` (user_id and
      // created_by), so PostgREST can't infer which one "users(...)" means
      // on its own (PGRST201: "more than one relationship was found").
      // `users!subscriptions_user_id_fkey` pins it to the user_id FK
      // specifically. If your actual constraint name differs, run:
      //   select conname from pg_constraint
      //   where conrelid = 'subscriptions'::regclass and contype = 'f';
      // and swap the name below to match.
      .select("*, users!subscriptions_user_id_fkey(full_name, email, phone), profiles(profile_id, personal)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("users").select("id, full_name, email").eq("role", "user").eq("is_active", true),
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order"),
  ]);

  // These queries were previously allowed to fail silently — any Supabase
  // error just meant `data` came back null, which `|| []` quietly turned
  // into an empty list with no indication anything had gone wrong. Logging
  // here means a broken join, an ambiguous embed, or an RLS rejection shows
  // up in the server terminal instead of just looking like "no data".
  if (subscriptionsError) {
    console.error("[/admin/subscriptions] subscriptions query failed:", subscriptionsError);
  }
  if (usersError) {
    console.error("[/admin/subscriptions] users query failed:", usersError);
  }
  if (plansError) {
    console.error("[/admin/subscriptions] plans query failed:", plansError);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Subscriptions</h1>
        <p className="text-gray-500 text-sm mt-1">Manage member subscriptions and payments</p>
      </div>
      {subscriptionsError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Failed to load subscriptions: {subscriptionsError.message}. Check the server terminal for the full error.
        </div>
      )}
      <SubscriptionsManager
        subscriptions={subscriptions || []}
        users={users || []}
        plans={plans || []}
      />
    </div>
  );
}