import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBiodataPDF } from "@/lib/pdf/biodata-generator";
import { Profile } from "@/types";
import { filterProfileByVisibility, isFieldVisible, type VisibleFieldsMap } from "@/lib/profile-privacy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handlePDFRequest(await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handlePDFRequest(await params);
}

async function handlePDFRequest({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    // For non-admin users, check if they have access to this profile, and
    // capture the admin's per-field privacy settings for this specific share.
    let visibleFields: VisibleFieldsMap | null = null;
    if (userData?.role !== "admin") {
      const { data: access } = await supabase
        .from("profile_access")
        .select("id, visible_fields")
        .eq("granted_to_user_id", user.id)
        .eq("profile_id", id)
        .eq("is_active", true)
        .single();

      if (!access) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      visibleFields = access.visible_fields as VisibleFieldsMap | null;
      if (!isFieldVisible(visibleFields, "documents", "biodata_pdf")) {
        return NextResponse.json(
          { error: "The admin has not made a downloadable biodata available for this profile" },
          { status: 403 }
        );
      }
    }

    // Fetch profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Apply the admin's privacy controls before anything is baked into the PDF.
    const restrictedProfile = filterProfileByVisibility(profile, visibleFields);

    // Generate PDF
    const pdfBuffer = await generateBiodataPDF(restrictedProfile as Profile);

    // Log to audit
    const { data: actorData } = await supabase
      .from("users")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    await supabase.from("audit_logs").insert([{
      actor_id: user.id,
      actor_role: actorData?.role || "user",
      actor_name: actorData?.full_name || user.email,
      action: "biodata_downloaded",
      entity_type: "profile",
      entity_id: id,
      entity_name: profile.profile_id,
    }]);

    // Track download interaction (for non-admins)
    if (userData?.role !== "admin") {
      await supabase.from("profile_interactions").upsert({
        user_id: user.id,
        profile_id: id,
        interaction_type: "download",
      });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${profile.profile_id}-biodata.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}