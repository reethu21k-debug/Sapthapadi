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

export async function GET() {
  const auth = await requireTrueAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const { data: managers, error } = await admin
    .from("users")
    .select("*")
    .eq("role", "manager")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ managers });
}

export async function POST(request: NextRequest) {
  const auth = await requireTrueAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { email, password, full_name } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Creates the auth.users row. The existing on_auth_user_created trigger
  // then auto-inserts a matching public.users row with role defaulted to
  // 'user' — we immediately promote it below.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message || "Failed to create manager account" },
      { status: 400 }
    );
  }

  const { data: managerRecord, error: updateError } = await admin
    .from("users")
    .update({ role: "manager", full_name: full_name || null })
    .eq("id", created.user.id)
    .select()
    .single();

  if (updateError) {
    // Don't leave an orphaned auth account stuck at role 'user'.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    actor_id: auth.user.id,
    actor_role: "admin",
    actor_name: auth.actorName,
    action: "manager_created",
    entity_type: "user",
    entity_id: created.user.id,
    entity_name: email,
  });

  return NextResponse.json({ manager: managerRecord }, { status: 201 });
}