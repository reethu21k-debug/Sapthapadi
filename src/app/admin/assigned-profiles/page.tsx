import { redirect } from "next/navigation";
import { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ProfilesTable } from "@/components/admin/ProfilesTable";

export const metadata: Metadata = { title: "Assigned Profiles" };

export default async function AssignedProfilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("users").select("role").eq("id", user!.id).single();

  if (!me || !["admin", "manager"].includes(me.role)) redirect("/user/dashboard");

  const admin = createAdminClient();
  const { data: assignments } = await admin
    .from("manager_profile_assignments")
    .select("profile_id")
    .eq("manager_id", user!.id);

  const profileIds = (assignments || []).map((a) => a.profile_id);

  if (profileIds.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-navy-dark tracking-tight">Assigned Profiles</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">0 profiles currently assigned to you</p>
        </div>
        <div className="luxury-card bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 md:p-12 text-center text-gray-400 text-sm sm:text-base break-words">
          No profiles have been assigned to you yet. Check back once an Admin assigns you some.
        </div>
      </div>
    );
  }

  const { data: profiles, count } = await admin
    .from("profiles")
    .select("*", { count: "exact" })
    .in("id", profileIds)
    .order("created_at", { ascending: false });

  const { data: counts } = await admin
    .from("profile_match_meeting_counts")
    .select("profile_id, completed_match_meetings")
    .in("profile_id", profileIds);
  const matchMeetingCounts: Record<string, number> = {};
  (counts || []).forEach((c) => { matchMeetingCounts[c.profile_id] = c.completed_match_meetings || 0; });

  const { data: plans } = await admin
    .from("subscription_plans")
    .select("id, plan, name, price, duration_days, is_active")
    .order("sort_order");

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-navy-dark tracking-tight">Assigned Profiles</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">{count ?? 0} profiles currently assigned to you</p>
      </div>
      <div className="w-full">
        <ProfilesTable
          profiles={profiles || []}
          total={count || 0}
          page={1}
          limit={profileIds.length}
          matchMeetingCounts={matchMeetingCounts}
          plans={plans || []}
          subscriptionsByProfile={{}}
        />
      </div>
    </div>
  );
}