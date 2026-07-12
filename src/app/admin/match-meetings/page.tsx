import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MatchMeetingsManager } from "@/components/admin/MatchMeetingsManager";

export const metadata: Metadata = { title: "Match Meetings" };

export default async function AdminMatchMeetingsPage() {
  const supabase = await createClient();

  const [{ data: requests }, { data: stats }] = await Promise.all([
    supabase
      .from("match_meeting_requests")
      .select("*, profiles(id, profile_id, personal, images, is_verified), users!requested_by_user_id(id, full_name, email)")
      .order("created_at", { ascending: false }),
    supabase.from("dashboard_stats").select("pending_match_meetings, total_completed_match_meetings").single(),
  ]);

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
      />
    </div>
  );
}