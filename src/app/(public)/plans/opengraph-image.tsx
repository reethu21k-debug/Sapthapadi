import { renderOgImage, ogSize, ogContentType } from "@/lib/seo/og-template";

export const runtime = "edge";
export const alt = "Membership Plans | Saptapadi Matrimony";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return renderOgImage("Choose Your Plan", "Membership Plans");
}
