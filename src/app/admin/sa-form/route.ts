import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadAnyFile, deleteAsset, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";

// ─── Auth guard ────────────────────────────────────────────────
// The "SA Form" is admin-only. This route is the only way to write
// to profile_admin_documents, and it double-checks the caller's role
// server-side before doing anything (the RLS policy on the table
// enforces this too, as defense in depth).
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return userData?.role === "admin" ? user : null;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB — SA Form can be a scanned PDF/image

// ─── POST /api/admin/sa-form ─────────────────────────────────────
// Uploads (or replaces) the SA Form for a profile. Accepts PDF or
// image in any format. Optional — profiles work fine without one.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const profileId = formData.get("profile_id") as string | null;

    if (!file || !profileId) {
      return NextResponse.json({ error: "Missing file or profile_id" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Confirm the profile exists before uploading anything to Cloudinary.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // If a previous SA Form exists, delete the old Cloudinary asset so
    // we don't accumulate orphaned files when the admin replaces it.
    const { data: existing } = await supabase
      .from("profile_admin_documents")
      .select("sa_form_public_id, sa_form_format")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (existing?.sa_form_public_id) {
      const oldResourceType = existing.sa_form_format === "pdf" ? "raw" : "image";
      try {
        await deleteAsset(existing.sa_form_public_id, oldResourceType);
      } catch {
        // Non-fatal — proceed with the new upload even if cleanup of the
        // old asset fails (e.g. it was already removed on Cloudinary).
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicId = `sa-form-${profileId}-${Date.now()}`;
    const result = await uploadAnyFile(buffer, file.type, CLOUDINARY_FOLDERS.saForms, publicId);

    const format = result.format || (file.type.startsWith("image/") ? file.type.split("/")[1] : "pdf");

    const { error: upsertError } = await supabase
      .from("profile_admin_documents")
      .upsert(
        {
          profile_id: profileId,
          sa_form_url: result.secure_url,
          sa_form_public_id: result.public_id,
          sa_form_format: format,
          sa_form_uploaded_at: new Date().toISOString(),
          sa_form_uploaded_by: admin.id,
        },
        { onConflict: "profile_id" }
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ url: result.secure_url, format });
  } catch (error) {
    console.error("SA Form upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/sa-form?profile_id=... ────────────────────
// Removes the SA Form for a profile (both the DB row's file fields
// and the underlying Cloudinary asset).
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profile_id");

    if (!profileId) {
      return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("profile_admin_documents")
      .select("sa_form_public_id, sa_form_format")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (existing?.sa_form_public_id) {
      const resourceType = existing.sa_form_format === "pdf" ? "raw" : "image";
      try {
        await deleteAsset(existing.sa_form_public_id, resourceType);
      } catch {
        // Non-fatal — still clear the DB record even if Cloudinary cleanup fails.
      }
    }

    const { error } = await supabase
      .from("profile_admin_documents")
      .update({
        sa_form_url: null,
        sa_form_public_id: null,
        sa_form_format: null,
        sa_form_uploaded_at: null,
        sa_form_uploaded_by: null,
      })
      .eq("profile_id", profileId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SA Form delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}