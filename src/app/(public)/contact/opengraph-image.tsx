import { renderOgImage, ogSize, ogContentType } from "@/lib/seo/og-template";

export const runtime = "edge";
export const alt = "Contact Our Concierge | Saptapadi Matrimony";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return renderOgImage("We are Here To Help", "Contact Our Concierge");
}
