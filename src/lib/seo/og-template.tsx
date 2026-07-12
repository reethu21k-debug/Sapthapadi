import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/**
 * Shared visual template for per-route Open Graph images. Each route's
 * opengraph-image.tsx calls this with its own title/eyebrow so every
 * public page gets a distinct, on-brand social share card instead of
 * reusing one generic image for every URL.
 */
export function renderOgImage(eyebrow: string, title: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 96px",
          background: "linear-gradient(135deg, #2A0A0F 0%, #5A0F1D 55%, #2A0A0F 100%)",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: "#D4AF37",
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 24,
            display: "flex",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: 72,
            color: "#FAF6EF",
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 950,
            display: "flex",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #F4D78C, #D4AF37, #B8860B)",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 28, color: "#F7EFE1", display: "flex" }}>Saptapadi</div>
        </div>
      </div>
    ),
    { ...ogSize }
  );
}
