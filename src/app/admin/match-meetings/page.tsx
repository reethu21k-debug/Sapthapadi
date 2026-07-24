import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MatchMeetingsManager } from "@/components/admin/MatchMeetingsManager";

export const metadata: Metadata = { title: "Match Meetings" };

export default async function AdminMatchMeetingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("users").select("role").eq("id", user!.id).single();

  // NOTE: match_meeting_requests now has TWO foreign keys pointing at
  // `profiles` (profile_id, and requested_by_profile_id). Once a table has
  // more than one FK to the same target, PostgREST needs an explicit FK
  // hint on every embed to that table or it can silently fail to resolve
  // the ambiguous relationship. Both joins below are hinted accordingly —
  // do not simplify either back to a bare `profiles(...)`.
  const [{ data: requests, error: requestsError }, { data: stats }] = await Promise.all([
    supabase
      .from("match_meeting_requests")
      .select(
        `*,
         profiles!match_meeting_requests_profile_id_fkey(id, profile_id, personal, images, is_verified),
         users!requested_by_user_id(id, full_name, email),
         requested_by_profile:profiles!match_meeting_requests_requested_by_profile_id_fkey(id, profile_id, personal, images)`
      )
      .order("created_at", { ascending: false }),
    supabase.from("dashboard_stats").select("pending_match_meetings, total_completed_match_meetings").single(),
  ]);

  if (requestsError) {
    // Surface this in the server terminal — a silent empty list here is
    // exactly what causes "stats say 2 completed, but list shows nothing".
    console.error("[match-meetings] failed to load requests:", requestsError);
  }

  let assignedProfileIds: string[] | undefined;
  if (me?.role === "manager") {
    const { data: assignments } = await supabase
      .from("manager_profile_assignments")
      .select("profile_id")
      .eq("manager_id", user!.id);
    assignedProfileIds = (assignments || []).map((a) => a.profile_id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Match Meetings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review requests, accept or decline meetings, and mark completed matches
        </p>
      </div>

      <MatchMeetingsManager
        requests={requests || []}
        totalCompleted={stats?.total_completed_match_meetings || 0}
        totalPending={stats?.pending_match_meetings || 0}
        currentUserRole={me?.role as "admin" | "manager"}
        assignedProfileIds={assignedProfileIds}
      />
    </div>
  );
}