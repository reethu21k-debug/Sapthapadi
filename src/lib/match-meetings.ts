import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";

// A single "other person" a profile has had a COMPLETED match meeting
// with. A profile can show up on any of three sides of a
// match_meeting_requests row:
//   - as the one who was requested to meet (`profile_id` on the row)
//   - via their linked user_id, as the one who did the requesting
//     (`requested_by_user_id` on the row)
//   - directly as a profile on side A of a manually-logged meeting
//     (`requested_by_profile_id` on the row)
// `role` records which side the *subject* profile was on for that
// particular meeting.
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
  isManual?: boolean;
}

type Row = Record<string, unknown>;

function fullNameFromPersonal(personal: Record<string, unknown> | null | undefined): string {
  if (!personal) return "";
  return [personal.first_name, personal.last_name].filter(Boolean).join(" ");
}

/**
 * Fetches every COMPLETED match meeting a profile has been part of, from
 * any side of the request, and resolves it into a flat, display-ready
 * list of "who they met".
 */
export async function fetchCompletedMatchMeetings(
  profile: Pick<Profile, "id" | "user_id">
): Promise<MatchMeetingPartner[]> {
  const supabase = createClient();
  const partners: MatchMeetingPartner[] = [];

  // Side "target": meetings where this profile was the one being met
  // (profile_id on the row). The other party is either a member's user
  // account (requested_by_user_id) or, for manual entries, another
  // profile directly (requested_by_profile_id).
  const { data: asTarget } = await supabase
    .from("match_meeting_requests")
    .select(
      "id, meeting_date, meeting_location, completed_at, is_manual, requested_by_user_id, users!requested_by_user_id(id, full_name, email, avatar_url), requested_by_profile:profiles!requested_by_profile_id(id, profile_id, personal, images)"
    )
    .eq("profile_id", profile.id)
    .eq("status", "completed");

  // Side "requester" (a): meetings where this profile's OWNER was the one
  // who requested the meeting via their linked user account (only
  // possible if the profile is linked to a user account).
  let asRequesterViaUser: Row[] = [];
  if (profile.user_id) {
    const { data } = await supabase
      .from("match_meeting_requests")
      .select(
        "id, meeting_date, meeting_location, completed_at, is_manual, profile_id, profiles(id, profile_id, personal, images)"
      )
      .eq("requested_by_user_id", profile.user_id)
      .eq("status", "completed");
    asRequesterViaUser = data || [];
  }

  // Side "requester" (b): manual entries where THIS profile itself sits
  // directly on side A (requested_by_profile_id), independent of any
  // linked user account.
  const { data: asRequesterViaProfile } = await supabase
    .from("match_meeting_requests")
    .select(
      "id, meeting_date, meeting_location, completed_at, is_manual, profile_id, profiles(id, profile_id, personal, images)"
    )
    .eq("requested_by_profile_id", profile.id)
    .eq("status", "completed");

  // The "asTarget" rows only give us the requester's user account, not
  // their own dating profile (name/photo), when the requester came in via
  // requested_by_user_id. Look those up in bulk so the list can show a
  // proper name/photo instead of just an account email.
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
    const requesterProfileDirect = (Array.isArray(r.requested_by_profile) ? r.requested_by_profile[0] : r.requested_by_profile) as Row | null;
    const rp = requesterProfileDirect || requesterProfilesByUserId.get(String(r.requested_by_user_id));
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
      isManual: Boolean(r.is_manual),
    });
  });

  [...asRequesterViaUser, ...(asRequesterViaProfile || [])].forEach((r) => {
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
      isManual: Boolean(r.is_manual),
    });
  });

  // De-dupe: a manual entry where BOTH sides are profiles could theoretically
  // surface via both queries if this profile is somehow on both sides of the
  // same row (shouldn't happen in practice, but guard cheaply by requestId).
  const seen = new Set<string>();
  const deduped = partners.filter((p) => {
    const key = `${p.requestId}-${p.role}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime;
  });

  return deduped;
}