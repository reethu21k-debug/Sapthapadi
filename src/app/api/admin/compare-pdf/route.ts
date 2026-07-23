import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateComparePDF } from "@/lib/pdf/compare-generator";
import { Profile } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // This feature is only ever exposed via the admin ProfilesTable/
    // ProfileCompareModal, so enforce admin-only here too — not just in the UI.
    const { data: userData } = await supabase
      .from("users")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const ids = body?.ids as string[] | undefined;

    if (!ids || !Array.isArray(ids) || ids.length !== 2) {
      return NextResponse.json(
        { error: "Exactly two profile ids are required" },
        { status: 400 }
      );
    }

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ids);

    if (error || !profiles || profiles.length < 2) {
      return NextResponse.json(
        { error: "Failed to load one or both profiles" },
        { status: 404 }
      );
    }

    // Preserve the caller's original a/b order rather than whatever order
    // Supabase returns them in.
    const byId = new Map(profiles.map((p) => [p.id, p as Profile]));
    const profileA = byId.get(ids[0]);
    const profileB = byId.get(ids[1]);

    if (!profileA || !profileB) {
      return NextResponse.json(
        { error: "Failed to load one or both profiles" },
        { status: 404 }
      );
    }

    const pdfBuffer = await generateComparePDF(profileA, profileB);

    await supabase.from("audit_logs").insert([{
      actor_id: user.id,
      actor_role: userData?.role || "admin",
      actor_name: userData?.full_name || user.email,
      action: "biodata_downloaded",
      entity_type: "profile",
      entity_id: `${profileA.id},${profileB.id}`,
      entity_name: `Comparison: ${profileA.profile_id} vs ${profileB.profile_id}`,
    }]);

    const filename = `compare-${profileA.profile_id}-vs-${profileB.profile_id}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Compare PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate comparison PDF" },
      { status: 500 }
    );
  }
}