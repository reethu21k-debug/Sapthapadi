import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PlansManager } from "@/components/admin/PlansManager";

export const metadata: Metadata = { title: "Manage Plans" };

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Subscription Plans</h1>
        <p className="text-gray-500 text-sm mt-1">Configure pricing and features for each plan</p>
      </div>
      <PlansManager plans={plans || []} />
    </div>
  );
}