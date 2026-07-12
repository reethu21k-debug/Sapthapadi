import { renderOgImage, ogSize, ogContentType } from "@/lib/seo/og-template";

export const runtime = "edge";
export const alt = "About Saptapadi | Saptapadi Matrimony";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return renderOgImage("Our Story", "About Saptapadi");
}
