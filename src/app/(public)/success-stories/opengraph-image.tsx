import { renderOgImage, ogSize, ogContentType } from "@/lib/seo/og-template";

export const runtime = "edge";
export const alt = "Success Stories | Saptapadi Matrimony";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return renderOgImage("Real Unions, Real Families", "Success Stories");
}
