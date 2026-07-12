import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProfileDetailView } from "@/components/user/UserProfileDetailView";
import { filterProfileByVisibility, type VisibleFieldsMap } from "@/lib/profile-privacy";

export const metadata: Metadata = { title: "Profile Details" };

export default async function UserProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check access
  const { data: access } = await supabase
    .from("profile_access")
    .select("*")
    .eq("granted_to_user_id", user.id)
    .eq("profile_id", id)
    .eq("is_active", true)
    .single();

  if (!access) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (!profile) notFound();

  // Apply the admin's per-field privacy controls for this share before the
  // profile ever reaches the client — restricted fields are stripped here,
  // not merely hidden in the UI.
  const visibleProfile = filterProfileByVisibility(
    profile,
    access.visible_fields as VisibleFieldsMap | null
  );

  const { data: isFav } = await supabase
    .from("profile_interactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("profile_id", id)
    .eq("interaction_type", "favourite")
    .single();

  // Most recent match meeting request the current user has made for this
  // profile, if any — drives the "Request Match Meeting" button state.
  const { data: matchMeeting } = await supabase
    .from("match_meeting_requests")
    .select("*")
    .eq("requested_by_user_id", user.id)
    .eq("profile_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Track view — there's no unique constraint on (user_id, profile_id) for
  // interaction_type = 'view' (only 'favourite' has one), so upsert() with
  // onConflict on that triple has nothing to match against and would either
  // silently insert a duplicate every time or throw, depending on the
  // Supabase version. Check for an existing view record first instead.
  const { data: existingView } = await supabase
    .from("profile_interactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("profile_id", id)
    .eq("interaction_type", "view")
    .single();

  if (!existingView) {
    await supabase.from("profile_interactions").insert({
      user_id: user.id,
      profile_id: id,
      interaction_type: "view",
    });
  }

  return (
    <UserProfileDetailView
      profile={visibleProfile}
      isFavourite={!!isFav}
      currentUserId={user.id}
      visibleFields={access.visible_fields as VisibleFieldsMap | null}
      initialMatchMeeting={matchMeeting || null}
    />
  );
}