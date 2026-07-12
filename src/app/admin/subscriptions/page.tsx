import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionsManager } from "@/components/admin/SubscriptionsManager";

export const metadata: Metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage() {
  const supabase = await createClient();

  const [{ data: subscriptions }, { data: users }, { data: plans }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*, users(full_name, email, phone), profiles(profile_id, personal)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("users").select("id, full_name, email").eq("role", "user").eq("is_active", true),
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Subscriptions</h1>
        <p className="text-gray-500 text-sm mt-1">Manage member subscriptions and payments</p>
      </div>
      <SubscriptionsManager
        subscriptions={subscriptions || []}
        users={users || []}
        plans={plans || []}
      />
    </div>
  );
}
