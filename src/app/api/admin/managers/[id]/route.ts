import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireTrueAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, status: 401 as const };

  const { data: userData } = await supabase
    .from("users")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    return { error: "Only Admins can manage Manager accounts" as const, status: 403 as const };
  }
  return { user, actorName: userData.full_name || userData.email };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTrueAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const { is_active } = await request.json();

  const admin = createAdminClient();
  const { data: manager, error } = await admin
    .from("users")
    .update({ is_active })
    .eq("id", id)
    .eq("role", "manager") // guardrail: this endpoint can't touch admins
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("audit_logs").insert({
    actor_id: auth.user.id,
    actor_role: "admin",
    actor_name: auth.actorName,
    action: is_active ? "manager_activated" : "manager_deactivated",
    entity_type: "user",
    entity_id: id,
    entity_name: manager?.email,
    new_value: { is_active },
  });

  return NextResponse.json({ manager });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTrueAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: manager } = await admin
    .from("users")
    .select("email")
    .eq("id", id)
    .eq("role", "manager")
    .single();

  if (!manager) {
    return NextResponse.json({ error: "Manager not found" }, { status: 404 });
  }

  // Deleting the auth user cascades to public.users (ON DELETE CASCADE),
  // which in turn cascades to manager_profile_assignments.
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("audit_logs").insert({
    actor_id: auth.user.id,
    actor_role: "admin",
    actor_name: auth.actorName,
    action: "manager_deleted",
    entity_type: "user",
    entity_id: id,
    entity_name: manager.email,
  });

  return NextResponse.json({ success: true });
}