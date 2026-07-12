import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  // Core application paths and API routes that should never be indexed.
  // Note: In standard robots.txt protocol, a trailing slash (e.g., "/admin/")
  // automatically covers all sub-paths without needing explicit wildcards.
  const privatePaths = [
    "/admin/",
    "/user/",
    "/api/",
    "/auth/",
    "/login",
    "/register",
    "/reset-password",
    "/forgot-password",
  ];

  // Strip any trailing slash from the base URL to prevent double-slash errors
  const baseUrl = siteConfig.url.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      // Explicitly welcome the major AI/answer-engine crawlers rather than
      // leaving them to the generic "*" rule, since some default to more
      // conservative behavior without an explicit allow.
      {
        userAgent: [
          "GPTBot",
          "Google-Extended",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Applebot-Extended",
          "Omgilibot",
          "FacebookBot",
          "Diffbot"
        ],
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}