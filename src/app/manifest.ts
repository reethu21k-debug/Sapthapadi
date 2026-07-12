import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Unique identifier for the OS to prevent duplicate installations
    id: "/",
    name: siteConfig.legalName || siteConfig.name,
    // short_name is used on mobile home screens. Ideally keep under 12 characters.
    short_name: siteConfig.name, 
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: siteConfig.backgroundColor || "#FAF6EF",
    theme_color: siteConfig.themeColor || "#1C0A10", 
    orientation: "portrait-primary",
    dir: "ltr",
    icons: [
      // CRITICAL: You must ensure you have these perfectly square files 
      // in your /public directory for the app to be installable.
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable", // Allows Android to crop it into circles/squarcles safely
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any", // Standard icon for iOS/Desktop
      },
    ],
    categories: ["lifestyle", "social"],
    lang: "en-IN",
  };
}