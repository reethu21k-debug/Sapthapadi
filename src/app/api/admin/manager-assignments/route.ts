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

// Read-only: Admins and Managers can both check who's assigned to what.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!userData || !["admin", "manager"].includes(userData.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const managerId = request.nextUrl.searchParams.get("manager_id");
  const profileId = request.nextUrl.searchParams.get("profile_id");

  const admin = createAdminClient();
  let query = admin.from("manager_profile_assignments").select("*");
  if (managerId) query = query.eq("manager_id", managerId);
  if (profileId) query = query.eq("profile_id", profileId);

  const { data: assignments, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assignments });
}

// Replaces the full set of managers assigned to ONE profile — used from
// the Profiles list's "Assign to Manager(s)" row action.
export async function POST(request: NextRequest) {
  const auth = await requireTrueAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { profile_id, manager_ids } = await request.json();
  if (!profile_id || !Array.isArray(manager_ids)) {
    return NextResponse.json({ error: "profile_id and manager_ids[] are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("manager_profile_assignments")
    .select("id, manager_id")
    .eq("profile_id", profile_id);

  const existingManagerIds = new Set((existing || []).map((a) => a.manager_id));
  const nextManagerIds = new Set(manager_ids as string[]);

  const toRemove = (existing || []).filter((a) => !nextManagerIds.has(a.manager_id));
  const toAdd = [...nextManagerIds].filter((id) => !existingManagerIds.has(id));

  if (toRemove.length > 0) {
    await admin.from("manager_profile_assignments").delete().in("id", toRemove.map((a) => a.id));
  }
  if (toAdd.length > 0) {
    await admin.from("manager_profile_assignments").insert(
      toAdd.map((manager_id) => ({ profile_id, manager_id, assigned_by: auth.user.id }))
    );
  }

  if (toRemove.length > 0 || toAdd.length > 0) {
    const { data: profile } = await admin.from("profiles").select("profile_id").eq("id", profile_id).single();
    await admin.from("audit_logs").insert({
      actor_id: auth.user.id,
      actor_role: "admin",
      actor_name: auth.actorName,
      action: toAdd.length > 0 ? "profile_assigned_to_manager" : "profile_unassigned_from_manager",
      entity_type: "profile",
      entity_id: profile_id,
      entity_name: profile?.profile_id,
      new_value: { manager_ids: [...nextManagerIds] },
    });
  }

  return NextResponse.json({ success: true });
}