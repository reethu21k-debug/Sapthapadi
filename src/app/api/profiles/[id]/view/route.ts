import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Track view — check for an existing record first so repeated calls
    // (e.g. re-opening the same profile) don't accumulate unlimited
    // duplicate rows. There's no DB unique constraint on
    // (user_id, profile_id) for interaction_type = 'view' to rely on, and
    // this mirrors the same check used on the profile detail page so both
    // view-tracking paths behave the same way.
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

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
