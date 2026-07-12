import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";
import { Toaster } from "react-hot-toast";
import { JsonLd } from "@/components/shared/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";
import { siteConfig } from "@/lib/seo/config";

// ─── Font Optimization ─────────────────────────────────────────────
// Next.js automatically self-hosts these fonts, preventing layout shifts
// and removing the need for external network requests to Google Fonts.

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

// ─── Metadata & Viewport ───────────────────────────────────────────

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.backgroundColor },
    { media: "(prefers-color-scheme: dark)", color: siteConfig.themeColor },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // 1 previously blocked pinch-zoom, an accessibility (WCAG 1.4.4) issue
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.titleDefault,
    template: siteConfig.titleTemplate,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  referrer: "strict-origin-when-cross-origin",
  authors: [{ name: siteConfig.legalName, url: siteConfig.url }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/logo-icon.png", type: "image/png" }],
    apple: [{ url: "/logo-icon.png" }],
    shortcut: ["/logo-icon.png"],
  },
  openGraph: {
    title: siteConfig.titleDefault,
    description: siteConfig.description,
    type: "website",
    url: siteConfig.url,
    locale: siteConfig.locale,
    siteName: siteConfig.legalName,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: siteConfig.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.titleDefault,
    description: siteConfig.description,
    images: ["/opengraph-image"],
    ...(siteConfig.twitterHandle
      ? { site: siteConfig.twitterHandle, creator: siteConfig.twitterHandle }
      : {}),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  ...(siteConfig.googleSiteVerification || siteConfig.bingSiteVerification
    ? {
        verification: {
          ...(siteConfig.googleSiteVerification
            ? { google: siteConfig.googleSiteVerification }
            : {}),
          ...(siteConfig.bingSiteVerification
            ? { other: { "msvalidate.01": siteConfig.bingSiteVerification } }
            : {}),
        },
      }
    : {}),
};

// ─── Root Layout ───────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* 
        Apply font CSS variables directly to the body.
        Added default background and text colors to prevent flash of unstyled content. 
      */}
      <body 
        className={`${inter.variable} ${cormorant.variable} antialiased bg-[#FAF6EF] text-[#1a2233] min-h-screen flex flex-col`}
      >
        {/* Google Tag Manager (noscript fallback) — only rendered once
            NEXT_PUBLIC_GTM_ID is set. See src/lib/seo/config.ts. */}
        {siteConfig.gtmContainerId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${siteConfig.gtmContainerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        )}

        {/* Site-wide structured data: one Organization + WebSite graph, referenced
            by @id from every page-level schema (see src/lib/seo/schema.ts) so
            Google resolves them as a single connected knowledge graph rather than
            duplicate, conflicting entities per page. */}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />

        {/* Google Tag Manager — loads after the page is interactive so it never
            blocks LCP/TTI. Only injected when NEXT_PUBLIC_GTM_ID is configured. */}
        {siteConfig.gtmContainerId && (
          <Script id="gtm-init" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${siteConfig.gtmContainerId}');
            `}
          </Script>
        )}

        {/* GA4 — only injected when NEXT_PUBLIC_GA4_ID is configured. If GTM is
            also configured, GA4 is typically fired through GTM instead of here
            to avoid double-counting pageviews; keep at most one of the two live
            in production. */}
        {siteConfig.ga4MeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${siteConfig.ga4MeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${siteConfig.ga4MeasurementId}');
              `}
            </Script>
          </>
        )}
        <Providers>
          {children}
          
          {/* Enhanced Toaster UI */}
          <Toaster
            position="top-center" // Top-center is generally better UX for modern web apps
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(42, 10, 15, 0.95)", // #2A0A0F with slight opacity
                backdropFilter: "blur(10px)", // Modern glassmorphism touch
                color: "#FAF6EF",
                border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: "9999px", // Modern pill-shape
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 500,
                letterSpacing: "0.02em",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.3)", // Deeper, softer shadow
              },
              success: {
                iconTheme: { primary: "#D4AF37", secondary: "#2A0A0F" },
              },
              error: {
                iconTheme: { primary: "#EF4444", secondary: "#fff" },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}