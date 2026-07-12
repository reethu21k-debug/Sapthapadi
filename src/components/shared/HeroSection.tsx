"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Flame,
  Users,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const BANNERS = [
  "/Baneers/banner-2.png",
  "/Baneers/banner-3.png",
  "/Baneers/banner-4.png",
  "/Baneers/banner-5.png",
  "/Baneers/banner-6.png",
  "/Baneers/banner-7.png",
  "/Baneers/banner-8.png",
  "/Baneers/banner-9.png",
  "/Baneers/banner-10.png",
  "/Baneers/banner-11.png",
  "/Baneers/banner-12.png",
  "/Baneers/banner-13.png",
  "/Baneers/banner-1.png",
];

const STATS = [
  { icon: Users, value: "10,000+", label: "Profiles" },
  { icon: Heart, value: "5,000+", label: "Matches Made" },
  { icon: ShieldCheck, value: "98%", label: "Satisfaction" },
];

const SLIDE_DURATION = 5500;

export function HeroSection() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const startRef = useRef<number>(Date.now());
  const reduceMotion = useReducedMotion();

  const nextSlide = useCallback(() => {
    setActive((i) => (i + 1) % BANNERS.length);
  }, []);

  const prevSlide = () => {
    setActive((i) => (i - 1 + BANNERS.length) % BANNERS.length);
  };

  const goTo = (i: number) => {
    setActive(i);
  };

  // Drives both the auto-advance and the visible progress indicator,
  // pausing cleanly on hover/focus instead of fighting a separate timer.
  useEffect(() => {
    if (paused || reduceMotion) return;
    startRef.current = Date.now();
    setProgress(0);
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) nextSlide();
    }, 50);
    return () => clearInterval(id);
  }, [active, paused, reduceMotion, nextSlide]);

  return (
    <section
      className="relative pt-20 overflow-hidden"
      style={
        {
          "--maroon": "#5A0F1D",
          "--maroon-deep": "#3A0A13",
          "--ivory": "#FBF3E6",
          "--gold": "#C9972E",
          "--gold-light": "#E9CD8C",
          "--saffron": "#C8631C",
          "--ink": "#2B1B14",
          backgroundColor: "var(--ivory)",
        } as React.CSSProperties
      }
    >
      {/* Subtle rangoli watermark — quiet texture, not competing for attention */}
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -top-10 -right-10 w-64 h-64 sm:w-80 sm:h-80 opacity-[0.06] text-[var(--maroon)]"
      >
        {[80, 60, 40, 20].map((r) => (
          <circle
            key={r}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        ))}
      </svg>

      {/* Ornamental top rule — framing the section like the start of a ceremony. */}
      <div className="relative z-10 flex items-center justify-center gap-3 pb-6 px-6">
        <span className="h-px flex-1 max-w-[180px] bg-gradient-to-r from-transparent to-[var(--gold)]" />
        <Flame className="w-4 h-4 text-[var(--gold)]" strokeWidth={1.75} />
        <span className="h-px flex-1 max-w-[180px] bg-gradient-to-l from-transparent to-[var(--gold)]" />
      </div>

      {/* Banner Carousel */}
      <div className="relative w-full">
        <div
          className="relative w-full aspect-[3/1] min-h-[220px] overflow-hidden group"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          role="group"
          aria-roledescription="carousel"
          aria-label="Saptapadi member and event highlights"
        >
          <AnimatePresence mode="sync">
            {BANNERS.map(
              (src, i) =>
                i === active && (
                  <motion.div
                    key={src}
                    className="absolute inset-0"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${i + 1} of ${BANNERS.length}`}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                  >
                    <Image
                      src={src}
                      alt="Saptapadi Hindu Matrimony — Seven Steps, One Lifetime"
                      fill
                      priority={i === 0}
                      className="object-cover"
                      sizes="100vw"
                    />
                  </motion.div>
                )
            )}
          </AnimatePresence>

          {/* Warm vignette so controls and dots read clearly on any banner */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(58,10,19,0.55) 0%, rgba(58,10,19,0.05) 35%, transparent 60%)",
            }}
          />

          {/* Left Arrow */}
          <button
            onClick={prevSlide}
            aria-label="Previous banner"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/25 hover:bg-[var(--maroon)] border border-[var(--gold-light)]/40 text-[var(--gold-light)] hover:text-white backdrop-blur-sm transition-all duration-300 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={nextSlide}
            aria-label="Next banner"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/25 hover:bg-[var(--maroon)] border border-[var(--gold-light)]/40 text-[var(--gold-light)] hover:text-white backdrop-blur-sm transition-all duration-300 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Progress-bar dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Show banner ${i + 1}`}
                className="relative h-1.5 w-5 rounded-full bg-white/30 overflow-hidden"
              >
                <span
                  className="absolute inset-y-0 left-0 bg-[var(--gold)] rounded-full"
                  style={{ width: i === active ? `${progress}%` : "0%" }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Floating Trust Badge */}
        <div className="hidden sm:flex absolute -bottom-7 left-6 z-20 items-center gap-3 bg-[var(--ivory)] border border-[var(--gold)]/40 shadow-lg rounded-2xl px-5 py-3">
          <ShieldCheck className="w-5 h-5 text-[var(--saffron)] shrink-0" strokeWidth={1.75} />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[var(--maroon)]">
              100% Verified Profiles
            </p>
            <p className="text-xs text-[var(--ink)]/60">
              Manually reviewed by our team
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="flex items-center justify-center gap-2 text-xs sm:text-sm tracking-[0.25em] uppercase text-[var(--saffron)] font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Seven Steps, One Lifetime
            <Sparkles className="w-3.5 h-3.5" />
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.1] text-[var(--maroon)]">
            Your <span className="text-[var(--saffron)]">Saptapadi</span>
            <br />
            Begins Here
          </h1>

          <svg
            aria-hidden
            viewBox="0 0 120 12"
            className="w-24 h-3 mx-auto mt-4 text-[var(--gold)]"
          >
            <path
              d="M2 6c10-8 20 8 30 0s20-8 30 0 20 8 30 0 20-8 26 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <p className="mt-4 text-base sm:text-lg text-[var(--ink)]/75 leading-relaxed font-light">
            Trusted by thousands of Hindu families to find a life partner
            rooted in shared faith, values, and tradition.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link 
              href="/register" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--maroon)] hover:bg-[var(--maroon-deep)] text-white font-medium text-sm tracking-wider uppercase px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Heart className="w-4 h-4 fill-current text-[var(--gold)]" />
              <span>Begin Your Journey</span>
            </Link>
            <Link
              href="/plans"
              className="w-full sm:w-auto inline-flex items-center justify-center border border-[var(--gold)] text-[var(--maroon)] hover:bg-[var(--gold)]/10 font-medium text-sm tracking-wider uppercase px-8 py-4 rounded-xl transition-all duration-200"
            >
              <span>View Membership Plans</span>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 mt-12 pt-12 border-t border-[var(--gold)]/25"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <stat.icon className="w-4 h-4 text-[var(--gold)]" strokeWidth={1.75} />
                <div className="text-left">
                  <p className="text-xl sm:text-2xl font-serif font-bold text-[var(--maroon)] leading-none">
                    {stat.value}
                  </p>
                  <p className="text-[11px] sm:text-xs text-[var(--ink)]/60 mt-1 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              </div>
              {i < STATS.length - 1 && (
                <span className="hidden sm:block h-8 w-px bg-[var(--gold)]/25" />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}