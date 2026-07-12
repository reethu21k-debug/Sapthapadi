import type { NextConfig } from "next";

const securityHeaders = [
  // Prevents MIME-sniffing attacks
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy clickjacking protection (frame-ancestors in CSP is the modern equivalent)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Controls how much referrer info is sent cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restricts powerful browser features this site doesn't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

// ─── Content Security Policy ──────────────────────────────────────
// Built from this project's actual external origins:
//   • Supabase   — auth/DB/storage calls (fetch + websocket realtime)
//   • Cloudinary — profile photo delivery (res.cloudinary.com); the
//     Cloudinary Node SDK is used server-side only (src/lib/cloudinary),
//     no next-cloudinary upload widget script is loaded client-side, so
//     no additional Cloudinary script-src origin is required.
//   • Google Fonts — NOT needed. src/app/layout.tsx self-hosts Inter and
//     Cormorant Garamond via next/font, which inlines the font files at
//     build time with no runtime request to fonts.googleapis.com.
//   • GA4 / GTM — analytics origins added from step 2, only relevant once
//     NEXT_PUBLIC_GA4_ID / NEXT_PUBLIC_GTM_ID are actually set.
//
// 'unsafe-inline' is included in script-src because this app renders
// inline <script type="application/ld+json"> blocks (src/components/shared/JsonLd.tsx)
// and inline GA4/GTM bootstrap snippets (src/app/layout.tsx); CSP applies
// to inline scripts regardless of their `type`. The stricter fix is a
// per-request nonce threaded through middleware — worth doing before
// enforcing, but out of scope for this pass.
const cspDirectives = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'self'`,
  `object-src 'none'`,
  // Next.js dev/HMR and the inline JSON-LD + GA4/GTM bootstrap snippets need 'unsafe-inline';
  // 'unsafe-eval' is only required in development (Fast Refresh / webpack eval sourcemaps).
  `script-src 'self' 'unsafe-inline'${
    process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""
  } https://www.googletagmanager.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://www.googletagmanager.com https://www.google-analytics.com`,
  `font-src 'self' data:`,
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://*.analytics.google.com`,
  `frame-src 'self' https://www.googletagmanager.com`,
  `worker-src 'self' blob:`,
];

const cspHeader = {
  // Ship as report-only first. Once deployed, monitor the browser
  // console (and/or wire a report-uri/report-to endpoint) in production
  // for a period with zero violations, then rename this key to
  // "Content-Security-Policy" to actually enforce it. Flipping it blind
  // risks silently breaking Supabase auth/session calls or Cloudinary
  // image loads.
  key: "Content-Security-Policy-Report-Only",
  value: cspDirectives.join("; "),
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Serve modern formats when the browser supports them (smaller payload -> better LCP)
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  compress: true,
  poweredByHeader: false, // don't leak "X-Powered-By: Next.js"
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, cspHeader],
      },
      {
        // Long-cache static, hashed Next.js build assets
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Admin & authenticated app areas must never be cached or indexed by
        // intermediary caches/proxies, even though robots.txt already
        // disallows crawling them.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/user/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
