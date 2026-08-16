"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

// ─── Config ──────────────────────────────────────────────────────────
// Minimum time the splash stays visible, so it never just "flashes" on
// fast connections. Real load time is still respected — if the page
// takes longer than this, the preloader waits for it.
const MIN_DISPLAY_MS = 1200;
// How long the fade-out transition takes (must match the CSS duration below).
const FADE_MS = 500;

export default function Preloader() {
  // `mounted` controls whether the component renders at all (fully removed
  // from the DOM once the fade-out finishes, so it never intercepts clicks
  // or affects layout/accessibility after load).
  const [mounted, setMounted] = useState(true);
  // `visible` controls the opacity transition.
  const [visible, setVisible] = useState(true);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Lock scroll while the splash is up.
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let fadeOutTimer: ReturnType<typeof setTimeout>;
    let unmountTimer: ReturnType<typeof setTimeout>;

    const beginFadeOut = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(MIN_DISPLAY_MS - elapsed, 0);

      fadeOutTimer = setTimeout(() => {
        setVisible(false);
        // Wait for the CSS opacity transition to finish, then unmount.
        unmountTimer = setTimeout(() => {
          setMounted(false);
          document.body.style.overflow = originalOverflow;
        }, FADE_MS);
      }, remaining);
    };

    if (document.readyState === "complete") {
      beginFadeOut();
    } else {
      window.addEventListener("load", beginFadeOut);
    }

    return () => {
      window.removeEventListener("load", beginFadeOut);
      clearTimeout(fadeOutTimer);
      clearTimeout(unmountTimer);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-label="Loading Sapthapadi"
      aria-live="polite"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#FDF2E6] transition-opacity ease-in-out"
      style={{
        opacity: visible ? 1 : 0,
        transitionDuration: `${FADE_MS}ms`,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/*
        Bounded on BOTH axes so it never overflows, on any screen:
        - maxWidth caps it on wide/normal screens (portrait phones, tablets, desktops)
        - maxHeight caps it on short/landscape screens (rotated phones, small laptops)
        Using next/image with intrinsic width/height + "auto" style (instead of `fill`)
        lets the browser pick whichever constraint is tighter while preserving the
        image's real aspect ratio automatically — no separate wrapper/aspect-ratio
        div needed, and no risk of the two getting out of sync.
      */}
      <Image
        src="/Preloading.png"
        alt="Sapthapadi — ATP Matrimony"
        width={1477}
        height={1065}
        priority
        sizes="(max-width: 640px) 85vw, 520px"
        className="animate-fade-in-up"
        style={{
          width: "auto",
          height: "auto",
          maxWidth: "min(85vw, 520px)",
          maxHeight: "80vh",
        }}
      />
    </div>
  );
}