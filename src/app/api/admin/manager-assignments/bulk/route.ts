import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireTrueAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, status: 401 as const };
  const { data: userData } = await supabase
    .from("users").select("role, full_name, email").eq("id", user.id).single();
  if (userData?.role !== "admin") {
    return { error: "Only Admins can assign profiles to managers" as const, status: 403 as const };
  }
  return { user, actorName: userData.full_name || userData.email };
}

// Replaces the full set of profiles assigned to ONE manager — used from
// the Managers page's "Assign Profiles" picker.
export async function POST(request: NextRequest) {
  const auth = await requireTrueAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { manager_id, profile_ids } = await request.json();
  if (!manager_id || !Array.isArray(profile_ids)) {
    return NextResponse.json({ error: "manager_id and profile_ids[] are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("manager_profile_assignments")
    .select("id, profile_id")
    .eq("manager_id", manager_id);

  const existingProfileIds = new Set((existing || []).map((a) => a.profile_id));
  const nextProfileIds = new Set(profile_ids as string[]);

  const toRemove = (existing || []).filter((a) => !nextProfileIds.has(a.profile_id));
  const toAdd = [...nextProfileIds].filter((id) => !existingProfileIds.has(id));

  if (toRemove.length > 0) {
    await admin.from("manager_profile_assignments").delete().in("id", toRemove.map((a) => a.id));
  }
  if (toAdd.length > 0) {
    await admin.from("manager_profile_assignments").insert(
      toAdd.map((profile_id) => ({ profile_id, manager_id, assigned_by: auth.user.id }))
    );
  }

  if (toRemove.length > 0 || toAdd.length > 0) {
    await admin.from("audit_logs").insert({
      actor_id: auth.user.id,
      actor_role: "admin",
      actor_name: auth.actorName,
      action: toAdd.length > 0 ? "profile_assigned_to_manager" : "profile_unassigned_from_manager",
      entity_type: "user",
      entity_id: manager_id,
      new_value: { profile_ids: [...nextProfileIds] },
    });
  }

  return NextResponse.json({ success: true });
}