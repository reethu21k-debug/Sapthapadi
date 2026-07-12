import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SharedProfilesManager } from "@/components/admin/SharedProfilesManager";

export const metadata: Metadata = { title: "Share Profiles" };

export default async function SharedProfilesPage() {
  const supabase = await createClient();

  const [{ data: accesses }, { data: users }, { data: profiles }] = await Promise.all([
    supabase
      .from("profile_access")
      .select("*, users!granted_to_user_id(full_name, email), profiles(profile_id, personal, images)")
      .order("granted_at", { ascending: false })
      .limit(200),
    supabase
      .from("users")
      .select("id, full_name, email, subscriptions(status, expiry_date, plan)")
      .eq("role", "user")
      .eq("is_active", true),
    supabase
      .from("profiles")
      .select("id, profile_id, personal, images, status")
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Share Profiles</h1>
        <p className="text-gray-500 text-sm mt-1">
          Grant members access to specific profiles. Members can only view profiles you share.
        </p>
      </div>
      <SharedProfilesManager
        accesses={accesses || []}
        users={users || []}
        profiles={profiles || []}
      />
    </div>
  );
}