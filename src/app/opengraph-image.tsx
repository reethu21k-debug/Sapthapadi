import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo/config";

export const runtime = "edge";
export const alt = "Saptapadi — Where Sacred Unions Begin";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // 1. Fetch a premium Serif font (Playfair Display) for consistent rendering
  let playfairFont: ArrayBuffer | null = null;
  try {
    const fontRes = await fetch(
      "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.ttf"
    );
    if (fontRes.ok) {
      playfairFont = await fontRes.arrayBuffer();
    }
  } catch (e) {
    console.error("Failed to load font for OG image", e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "40px", // Outer frame padding
          backgroundColor: "#1c060a", // Darker border area
          fontFamily: playfairFont ? '"Playfair"' : "serif",
        }}
      >
        {/* Inner "Wedding Card" Frame */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #2A0A0F 0%, #5A0F1D 55%, #2A0A0F 100%)",
            border: "2px solid #D4AF37", // Gold border
            borderRadius: "16px",
            boxShadow: "inset 0 0 80px rgba(0,0,0,0.5)",
            position: "relative",
          }}
        >
          {/* Emblem */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 104,
              height: 104,
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #F4D78C, #D4AF37, #B8860B)",
              marginBottom: 40,
              boxShadow: "0 4px 20px rgba(212, 175, 55, 0.3)",
            }}
          >
            <div style={{ fontSize: 50, color: "#2A0A0F", display: "flex", marginTop: "-4px" }}>
              ✦
            </div>
          </div>

          {/* Brand Name */}
          <div
            style={{
              fontSize: 76,
              color: "#FAF6EF",
              fontWeight: 700,
              letterSpacing: -1,
              display: "flex",
              textAlign: "center",
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            {siteConfig.name}
          </div>

          {/* Tagline */}
          <div
            style={{
              marginTop: 24,
              fontSize: 28,
              color: "#D4AF37",
              letterSpacing: 6,
              textTransform: "uppercase",
              display: "flex",
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            Where Sacred Unions Begin
          </div>

          {/* Bottom URL string for brand visibility when shared */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              fontSize: 20,
              color: "#FAF6EF",
              opacity: 0.6,
              letterSpacing: 2,
              display: "flex",
            }}
          >
            {siteConfig.url ? siteConfig.url.replace(/^https?:\/\//, "") : "saptapadi.com"}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: playfairFont
        ? [
            {
              name: "Playfair",
              data: playfairFont,
              style: "normal",
              weight: 400,
            },
            {
              name: "Playfair",
              data: playfairFont,
              style: "normal",
              weight: 700,
            },
          ]
        : undefined,
    }
  );
}