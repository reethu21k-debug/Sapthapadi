import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileDetailView } from "@/components/admin/ProfileDetailView";

export const metadata: Metadata = { title: "Profile Details" };

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !profile) notFound();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, subscription_plans(*)")
    .eq("profile_id", id)
    .eq("status", "active")
    .single();

  const { data: accessList } = await supabase
    .from("profile_access")
    .select("*, users(full_name, email)")
    .eq("profile_id", id)
    .eq("is_active", true);

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Admin-only "SA Form" document — never exposed to the profile owner
  // (see migration 0005_sa_form_admin_document.sql for the RLS design).
  const { data: adminDocuments } = await supabase
    .from("profile_admin_documents")
    .select("*")
    .eq("profile_id", id)
    .maybeSingle();

  const { data: matchMeetingCount } = await supabase
    .from("profile_match_meeting_counts")
    .select("completed_match_meetings")
    .eq("profile_id", id)
    .maybeSingle();

  return (
    <ProfileDetailView
      profile={profile}
      subscription={subscription}
      accessList={accessList || []}
      auditLogs={auditLogs || []}
      adminDocuments={adminDocuments || null}
      completedMatchMeetings={matchMeetingCount?.completed_match_meetings || 0}
    />
  );
}