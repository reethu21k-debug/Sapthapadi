import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/config";
import { createClient } from "@/lib/supabase/server";

// Revalidate the generated sitemap at most once an hour so newly published
// success stories/plans show up without needing a full redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Strip any trailing slash from the base URL to prevent double-slash errors
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  // Note: /login, /register, and other auth/admin paths are intentionally omitted.
  // Including them here while blocking them in robots.ts causes "Submitted URL 
  // blocked by robots.txt" errors in Google Search Console.
  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/plans`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/success-stories`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/refunds`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Best-effort: individual success stories aren't on their own routes today
  // (there's no /success-stories/[slug] page), so there's nothing per-story
  // to add yet. We dynamically update the `/success-stories` directory's 
  // lastModified date so crawlers know when to re-index the list.
  try {
    const supabase = await createClient();
    const { data: stories } = await supabase
      .from("success_stories")
      .select("updated_at, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (stories?.length) {
      const latest = stories[0].updated_at || stories[0].created_at;
      const idx = staticEntries.findIndex((e) => e.url === `${baseUrl}/success-stories`);
      
      if (idx !== -1 && latest) {
        staticEntries[idx] = { 
          ...staticEntries[idx], 
          lastModified: new Date(latest) 
        };
      }
    }
  } catch {
    // Sitemap generation must never fail the build/request over a transient
    // DB error — fall back to the static `now` timestamp above.
    console.error("Failed to fetch latest success story for sitemap generation.");
  }

  return staticEntries;
}