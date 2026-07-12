import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserMatchMeetingsClient } from "@/components/user/UserMatchMeetingsClient";

export const metadata: Metadata = { title: "Match Meetings" };

export default async function UserMatchMeetingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: requests } = await supabase
    .from("match_meeting_requests")
    .select("*, profiles(id, profile_id, personal, images, is_verified)")
    .eq("requested_by_user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Match Meetings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track your match meeting requests and completed meetings
        </p>
      </div>

      <UserMatchMeetingsClient requests={requests || []} />
    </div>
  );
}