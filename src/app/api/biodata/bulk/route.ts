import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBiodataPDF } from "@/lib/pdf/biodata-generator";
import { Profile } from "@/types";
import { filterProfileByVisibility, isFieldVisible, type VisibleFieldsMap } from "@/lib/profile-privacy";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

// Hard cap to keep a single request from generating an unbounded number of
// PDFs in one Vercel function invocation (memory + execution time limits).
// Admins needing more than this should do it in batches.
const MAX_BULK_PROFILES = 100;

interface BulkBody {
  ids: string[];
  mode: "zip" | "combined";
}

export async function POST(request: NextRequest) {
  try {
    let body: BulkBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter((id) => typeof id === "string" && id))] : [];
    const mode = body.mode === "combined" ? "combined" : "zip";

    if (ids.length === 0) {
      return NextResponse.json({ error: "No profile IDs provided" }, { status: 400 });
    }
    if (ids.length > MAX_BULK_PROFILES) {
      return NextResponse.json(
        { error: `Too many profiles selected. Please select ${MAX_BULK_PROFILES} or fewer at a time.` },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    // Bulk download is an admin/manager bulk-ops tool, same as the bulk
    // selection UI it powers (which only appears on the admin profiles
    // table) — non-admins go through the single-profile route instead,
    // which already handles the profile_access / visible_fields path.
    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ids);

    if (error || !profiles || profiles.length === 0) {
      return NextResponse.json({ error: "No matching profiles found" }, { status: 404 });
    }

    // Admin sees the unrestricted view — filterProfileByVisibility with a
    // null map is a no-op passthrough, same as the single-profile route
    // does for admin requests.
    const noRestriction: VisibleFieldsMap | null = null;
    void isFieldVisible; // shared import kept for parity with the single route; unused on the admin path

    const pdfResults: { profile: Profile; buffer: Buffer }[] = [];
    const failedIds: string[] = [];

    for (const profile of profiles) {
      try {
        const restricted = filterProfileByVisibility(profile, noRestriction);
        const buffer = await generateBiodataPDF(restricted as Profile);
        pdfResults.push({ profile: profile as Profile, buffer });
      } catch (err) {
        console.error(`Bulk biodata: failed to generate PDF for profile ${profile.id}`, err);
        failedIds.push(profile.id);
      }
    }

    if (pdfResults.length === 0) {
      return NextResponse.json({ error: "Failed to generate any of the selected biodatas" }, { status: 500 });
    }

    // Audit log — one entry per profile, same action type the single route
    // uses, so bulk downloads show up identically in existing audit views.
    await supabase.from("audit_logs").insert(
      pdfResults.map(({ profile }) => ({
        actor_id: user.id,
        actor_role: userData?.role || "user",
        actor_name: userData?.full_name || user.email,
        action: "biodata_downloaded" as const,
        entity_type: "profile",
        entity_id: profile.id,
        entity_name: profile.profile_id,
        new_value: { bulk: true, mode },
      }))
    );

    const timestamp = new Date().toISOString().slice(0, 10);

    if (mode === "zip") {
      const zip = new JSZip();
      for (const { profile, buffer } of pdfResults) {
        zip.file(`${profile.profile_id}-biodata.pdf`, buffer);
      }
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      return new NextResponse(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="biodatas-${timestamp}.zip"`,
          "Content-Length": zipBuffer.length.toString(),
          ...(failedIds.length > 0 ? { "X-Failed-Profile-Ids": failedIds.join(",") } : {}),
        },
      });
    }

    // Combined mode: merge every generated PDF's pages into a single PDF,
    // in the same order the profiles were selected/returned.
    const mergedPdf = await PDFDocument.create();
    for (const { buffer } of pdfResults) {
      const srcPdf = await PDFDocument.load(buffer);
      const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    const mergedBytes = await mergedPdf.save();

    return new NextResponse(new Uint8Array(mergedBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="biodatas-combined-${timestamp}.pdf"`,
        "Content-Length": mergedBytes.length.toString(),
        ...(failedIds.length > 0 ? { "X-Failed-Profile-Ids": failedIds.join(",") } : {}),
      },
    });
  } catch (error) {
    console.error("Bulk PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate bulk biodata" }, { status: 500 });
  }
}