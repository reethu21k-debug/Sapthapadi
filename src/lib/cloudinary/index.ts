import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// Upload folder structure
export const CLOUDINARY_FOLDERS = {
  profilePhotos: "saptapadi/profiles/photos",
  biodataPDFs: "saptapadi/profiles/biodatas",
  horoscopePDFs: "saptapadi/profiles/horoscopes",
  documents: "saptapadi/profiles/documents",
  saForms: "saptapadi/profiles/sa-forms", // admin-only "SA Form" uploads
  banners: "saptapadi/site/banners",
  successStories: "saptapadi/site/success-stories",
  testimonials: "saptapadi/site/testimonials",
};

export interface UploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
}

export async function uploadImage(
  file: Buffer | string,
  folder: string,
  publicId?: string,
  options?: Record<string, unknown>
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      public_id: publicId,
      resource_type: "image" as const,
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
      ...options,
    };

    if (typeof file === "string") {
      // Base64 or URL
      cloudinary.uploader.upload(file, uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result as UploadResult);
      });
    } else {
      // Buffer
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result as UploadResult);
        })
        .end(file);
    }
  });
}

export async function uploadPDF(
  file: Buffer | string,
  folder: string,
  publicId?: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      public_id: publicId,
      resource_type: "raw" as const,
      format: "pdf",
    };

    if (typeof file === "string") {
      cloudinary.uploader.upload(file, uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result as UploadResult);
      });
    } else {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result as UploadResult);
        })
        .end(file);
    }
  });
}

export async function deleteAsset(publicId: string, resourceType: "image" | "raw" = "image") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Generic uploader for admin-only documents that may be a PDF or an
 * image in any format (the "SA Form" upload). Cloudinary requires
 * resource_type "image" for image files and "raw" for PDFs/other
 * binary files, so this picks the right one based on the mime type.
 */
export async function uploadAnyFile(
  file: Buffer,
  mimeType: string,
  folder: string,
  publicId?: string
): Promise<UploadResult> {
  const isImage = mimeType.startsWith("image/");
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      public_id: publicId,
      resource_type: (isImage ? "image" : "raw") as "image" | "raw",
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result as UploadResult);
      })
      .end(file);
  });
}

export function getOptimizedImageUrl(
  publicId: string,
  width?: number,
  height?: number
): string {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: "fill",
    quality: "auto",
    fetch_format: "auto",
  });
}

export function getSignedUploadUrl(folder: string) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  };
}