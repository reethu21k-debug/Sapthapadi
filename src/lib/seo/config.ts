/**
 * Central SEO / site configuration.
 *
 * Single source of truth for the site's canonical domain, brand name,
 * social profiles, and organization details used across metadata and
 * JSON-LD structured data. Update the placeholders (marked TODO) with
 * real production values before/at launch.
 */

const rawSiteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://sapthapadiatp.com";

export const siteConfig = {
  name: "Saptapadi",
  legalName: "Saptapadi Matrimony",
  // Canonical, production URL. Set NEXT_PUBLIC_APP_URL in your environment
  // (e.g. https://sapthapadiatp.com) — do not leave this pointing at localhost in prod.
  url: rawSiteUrl,
  titleDefault: "Saptapadi — Where Sacred Unions Begin",
  titleTemplate: "%s | Saptapadi Matrimony",
  description:
    "Saptapadi is a premium, family-first matrimonial platform connecting verified profiles across India for sacred, lifelong unions. Trusted matchmaking, complete privacy, dedicated relationship managers.",
  locale: "en_IN",
  themeColor: "#5A0F1D",
  backgroundColor: "#FAF6EF",
  keywords: [
    "matrimony",
    "matrimonial site",
    "shaadi",
    "vivah",
    "biodata",
    "matchmaking",
    "Telugu matrimony",
    "Indian matrimony",
    "Hyderabad matrimony",
    "Saptapadi",
  ],
  // TODO: replace with the real registered office / support address.
  address: {
    streetAddress: "Banjara Hills",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    postalCode: "500034",
    addressCountry: "IN",
  },
  // TODO: confirm this is the correct public support number.
  telephone: "+91-40-88889999",
  // TODO: replace with the real support inbox.
  email: "support@sapthapadiatp.com",
  founder: "Stryvenix",
  foundingDate: "2023",
  // TODO: fill in real, live social profile URLs (remove any that don't exist —
  // sameAs entries pointing at dead/placeholder profiles hurt Organization schema trust).
  sameAs: [] as string[],
  // TODO: replace with real IDs once available. Leaving these unset (rather than
  // fake placeholder IDs) avoids shipping broken analytics/verification tags.
  googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  bingSiteVerification: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "",
  ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_ID || "",
  gtmContainerId: process.env.NEXT_PUBLIC_GTM_ID || "",
  ogImageAlt: "Saptapadi — a premium matrimonial platform for sacred unions",
  twitterHandle: "", // TODO: e.g. "@saptapadi" once the account exists
} as const;

export function absoluteUrl(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${p === "/" ? "" : p}`;
}
