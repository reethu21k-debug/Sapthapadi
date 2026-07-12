import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";

// A single "other person" a profile has had a COMPLETED match meeting
// with. A profile can show up on either side of a match_meeting_requests
// row: as the one who was requested to meet (profile_id on the row), or
// — via their linked user_id — as the one who did the requesting
// (requested_by_user_id on the row). `role` records which side the
// *subject* profile was on for that particular meeting.
export interface MatchMeetingPartner {
  requestId: string;
  name: string;
  photo: string | null;
  profileId: string | null; // the other party's profiles.id (uuid), if they have one
  profileCode: string | null; // the other party's human-readable profile_id (e.g. SPT-2026-00001)
  role: "requester" | "target";
  meetingDate: string | null;
  meetingLocation: string | null;
  completedAt: string | null;
}

type Row = Record<string, unknown>;

function fullNameFromPersonal(personal: Record<string, unknown> | null | undefined): string {
  if (!personal) return "";
  return [personal.first_name, personal.last_name].filter(Boolean).join(" ");
}

/**
 * Fetches every COMPLETED match meeting a profile has been part of, from
 * either side of the request, and resolves it into a flat, display-ready
 * list of "who they met".
 */
export async function fetchCompletedMatchMeetings(
  profile: Pick<Profile, "id" | "user_id">
): Promise<MatchMeetingPartner[]> {
  const supabase = createClient();
  const partners: MatchMeetingPartner[] = [];

  // Side A: meetings where this profile was the one being requested to meet.
  const { data: asTarget } = await supabase
    .from("match_meeting_requests")
    .select(
      "id, meeting_date, meeting_location, completed_at, requested_by_user_id, users!requested_by_user_id(id, full_name, email, avatar_url)"
    )
    .eq("profile_id", profile.id)
    .eq("status", "completed");

  // Side B: meetings where this profile's owner was the one who requested
  // the meeting (only possible if the profile is linked to a user account).
  let asRequester: Row[] = [];
  if (profile.user_id) {
    const { data } = await supabase
      .from("match_meeting_requests")
      .select(
        "id, meeting_date, meeting_location, completed_at, profile_id, profiles(id, profile_id, personal, images)"
      )
      .eq("requested_by_user_id", profile.user_id)
      .eq("status", "completed");
    asRequester = data || [];
  }

  // The "asTarget" rows only give us the requester's user account, not
  // their own dating profile (name/photo). Look those up in bulk so the
  // list can show a proper name/photo instead of just an account email.
  const requesterUserIds = Array.from(
    new Set((asTarget || []).map((r) => String(r.requested_by_user_id)).filter(Boolean))
  );
  const requesterProfilesByUserId = new Map<string, Row>();
  if (requesterUserIds.length > 0) {
    const { data: requesterProfiles } = await supabase
      .from("profiles")
      .select("id, profile_id, user_id, personal, images")
      .in("user_id", requesterUserIds);
    (requesterProfiles || []).forEach((rp) => {
      requesterProfilesByUserId.set(String(rp.user_id), rp);
    });
  }

  (asTarget || []).forEach((r) => {
    const u = (Array.isArray(r.users) ? r.users[0] : r.users) as Row | null;
    const rp = requesterProfilesByUserId.get(String(r.requested_by_user_id));
    const rpPersonal = rp?.personal as Record<string, unknown> | undefined;
    const name =
      fullNameFromPersonal(rpPersonal) ||
      String(u?.full_name || u?.email || "Member");
    const images = rp?.images as Record<string, string> | undefined;

    partners.push({
      requestId: String(r.id),
      name,
      photo: images?.profile_photo || (u?.avatar_url as string) || null,
      profileId: rp ? String(rp.id) : null,
      profileCode: rp ? String(rp.profile_id) : null,
      role: "target",
      meetingDate: (r.meeting_date as string) || null,
      meetingLocation: (r.meeting_location as string) || null,
      completedAt: (r.completed_at as string) || null,
    });
  });

  asRequester.forEach((r) => {
    const tp = (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles) as Row | null;
    const tpPersonal = tp?.personal as Record<string, unknown> | undefined;
    const images = tp?.images as Record<string, string> | undefined;

    partners.push({
      requestId: String(r.id),
      name: fullNameFromPersonal(tpPersonal) || "Profile",
      photo: images?.profile_photo || null,
      profileId: tp ? String(tp.id) : null,
      profileCode: tp ? String(tp.profile_id) : null,
      role: "requester",
      meetingDate: (r.meeting_date as string) || null,
      meetingLocation: (r.meeting_location as string) || null,
      completedAt: (r.completed_at as string) || null,
    });
  });

  partners.sort((a, b) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime;
  });

  return partners;
}