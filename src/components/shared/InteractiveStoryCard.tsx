"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export interface SuccessStory {
  id: string;
  couple_names: string;
  story: string;
  wedding_date?: string | null;
  image_url?: string | null;
}

function formatWeddingDate(dateString?: string | null): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  } catch {
    return null;
  }
}

function DiyaMark({ lit }: { lit: boolean }) {
  return (
    <span
      className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gold/20 text-gold flex-shrink-0 transition-all duration-500 ease-out"
      style={{
        boxShadow: lit
          ? "0 0 22px rgba(212,175,55,0.55), 0 0 4px rgba(212,175,55,0.6)"
          : "0 0 15px rgba(212,175,55,0.3)",
        transform: lit ? "scale(1.12) rotate(6deg)" : "scale(1) rotate(0deg)",
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 2c.6 1.8-1.4 2.6-1.4 4.4 0 1 .7 1.6 1.4 1.6s1.4-.6 1.4-1.6C13.4 4.6 11.4 3.8 12 2z" />
        <path d="M4 13c0-2.8 2.7-4 8-4s8 1.2 8 4c0 3.3-3.6 6-8 6s-8-2.7-8-6z" opacity="0.85" />
      </svg>
    </span>
  );
}

interface InteractiveStoryCardProps {
  story: SuccessStory;
  className?: string;
  imageAspect?: string;
  featured?: boolean;
}

export function InteractiveStoryCard({
  story,
  className = "",
  imageAspect = "aspect-[4/3]",
  featured = false,
}: InteractiveStoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spot, setSpot] = useState({ x: 50, y: 50 });
  const formattedDate = formatWeddingDate(story.wedding_date);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    setSpot({ x: px * 100, y: py * 100 });
    setTilt({
      x: (0.5 - py) * 6,
      y: (px - 0.5) * 6,
    });
  }

  function handleLeave() {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  }

  return (
    <article
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      onMouseMove={handleMouseMove}
      className={`group relative flex flex-col h-full rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl transition-[border-color,box-shadow] duration-500 ease-out ${className}`}
      style={{
        transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${
          hovered ? -6 : 0
        }px)`,
        transition: hovered
          ? "transform 120ms ease-out, border-color 500ms, box-shadow 500ms"
          : "transform 500ms cubic-bezier(0.16,1,0.3,1), border-color 500ms, box-shadow 500ms",
        borderColor: hovered ? "rgba(212,175,55,0.3)" : undefined,
      }}
    >
      {/* Cursor-tracking spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-500"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(320px circle at ${spot.x}% ${spot.y}%, rgba(212,175,55,0.16), transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Corner frame marks */}
      <span
        className="absolute top-4 left-4 w-4 h-4 border-t border-l z-30 pointer-events-none transition-all duration-500"
        style={{ borderColor: hovered ? "rgba(212,175,55,0.9)" : "rgba(212,175,55,0.5)" }}
        aria-hidden="true"
      />
      <span
        className="absolute top-4 right-4 w-4 h-4 border-t border-r z-30 pointer-events-none transition-all duration-500"
        style={{ borderColor: hovered ? "rgba(212,175,55,0.9)" : "rgba(212,175,55,0.5)" }}
        aria-hidden="true"
      />

      {story.image_url && (
        <div className={`relative ${imageAspect} w-full overflow-hidden bg-navy-dark/40`}>
          <div
            className="absolute inset-0 z-10 transition-colors duration-500"
            style={{ background: hovered ? "transparent" : "rgba(10,14,26,0.2)" }}
          />
          <Image
            src={story.image_url}
            alt={`Wedding photo of ${story.couple_names}`}
            fill
            sizes={featured ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 1024px) 100vw, 33vw"}
            className="object-cover transition-transform duration-700 ease-out"
            style={{ transform: hovered ? "scale(1.06)" : "scale(1)" }}
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#1a2233] to-transparent z-10" />
        </div>
      )}

      <div className="relative flex flex-col flex-1 p-6 sm:p-8 pt-4 z-20">
        <div className="flex items-center gap-3 mb-3">
          <DiyaMark lit={hovered} />
          <h3
            className={`font-serif font-semibold text-white tracking-wide ${
              featured ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
            }`}
          >
            {story.couple_names}
          </h3>
        </div>

        {formattedDate && (
          <p className="inline-block w-fit text-gold/90 bg-gold/10 px-3 py-1 rounded-md text-xs font-medium uppercase tracking-wider mb-4">
            Wed on {formattedDate}
          </p>
        )}

        <p
          className={`text-white/70 leading-relaxed font-light flex-1 ${
            featured ? "text-base sm:text-lg line-clamp-4" : "text-sm sm:text-base line-clamp-3"
          }`}
        >
          &quot;{story.story}&quot;
        </p>
      </div>
    </article>
  );
}