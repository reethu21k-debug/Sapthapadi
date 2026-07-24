import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!userData || !["admin", "manager"].includes(userData.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = request.nextUrl.searchParams.get("q") || "";
  const admin = createAdminClient();

  // Only plain members are relevant as a "party" in a match meeting —
  // admin/manager accounts should never show up in this picker.
  let query = admin
    .from("users")
    .select("id, full_name, email")
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(25);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data: users, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users });
}