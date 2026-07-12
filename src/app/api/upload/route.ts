import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImage, uploadPDF, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "profile_photo" | "photo_2" | "photo_3" | "horoscope" | "document"
    const profileId = formData.get("profile_id") as string;

    if (!file || !type || !profileId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const isPDF = file.type === "application/pdf";

    let result;
    const publicId = `${profileId}-${type}-${Date.now()}`;

    if (isPDF) {
      result = await uploadPDF(
        buffer,
        type === "horoscope" ? CLOUDINARY_FOLDERS.horoscopePDFs : CLOUDINARY_FOLDERS.documents,
        publicId
      );
    } else {
      result = await uploadImage(
        buffer,
        CLOUDINARY_FOLDERS.profilePhotos,
        publicId,
        { width: 800, height: 1000, crop: "fill", quality: "auto:good" }
      );
    }

    // Update profile in DB
    const fieldMap: Record<string, string> = {
      profile_photo: "images.profile_photo",
      photo_2: "images.photo_2",
      photo_3: "images.photo_3",
      horoscope: "documents.horoscope_pdf",
    };

    if (fieldMap[type]) {
      const [section, field] = fieldMap[type].split(".");
      const { data: profile } = await supabase
        .from("profiles")
        .select(section)
        .eq("id", profileId)
        .single();

      const updatedSection = {
        ...((profile?.[section as keyof typeof profile] as unknown) as Record<string, unknown>),
        [field]: result.secure_url,
      };

      await supabase
        .from("profiles")
        .update({ [section]: updatedSection })
        .eq("id", profileId);
    }

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
