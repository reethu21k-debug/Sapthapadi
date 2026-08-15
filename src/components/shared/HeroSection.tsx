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
  ClipboardList,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";

const BANNERS = [
  "/Baneers/banner-12.png",
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
  "/Baneers/banner-13.png",
  "/Baneers/banner-1.png",
];

const STATS = [
  { icon: Users, value: "10,000+", label: "Profiles" },
  { icon: HeartHandshake, value: "5,000+", label: "Matches Made" },
  { icon: ShieldCheck, value: "98%", label: "Satisfaction" },
];

const SLIDE_DURATION = 5500;

// Ogee / temple-finial arch mask for the portrait hero photo.
// Percentage-based viewBox so it scales cleanly at any container size —
// tuned for a tall portrait crop like Home.png (1122 x 1402, ~4:5).
const ARCH_MASK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'>
      <path d='M200,0
        C255,58 258,62 318,92
        C378,122 400,182 400,262
        C400,380 380,442 320,472
        C280,494 242,500 200,500
        C158,500 120,494 80,472
        C20,442 0,380 0,262
        C0,182 22,122 82,92
        C142,62 145,58 200,0 Z' fill='black'/>
    </svg>`
  );

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
      className="relative pt-16 sm:pt-20 overflow-hidden"
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
          className="relative w-full aspect-[4/5] sm:aspect-[16/9] lg:aspect-[2172/724] overflow-hidden group"
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

      {/* ============================================================ */}
      {/* NEW: Home.png arch-photo section — sits below the carousel   */}
      {/* ============================================================ */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-sm tracking-[0.15em] sm:tracking-[0.25em] uppercase text-[var(--maroon)] font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--saffron)] shrink-0" />
              Seven Steps, One Lifetime
            </p>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[4.25rem] leading-[1.1] sm:leading-[1.05] text-[var(--maroon)]">
              Your <span className="text-[var(--saffron)]">Saptapadi</span>
              <br />
              Begins Here
            </h1>

            <svg
              aria-hidden
              viewBox="0 0 160 14"
              className="w-32 h-3.5 mt-6 text-[var(--gold)]"
            >
              <path
                d="M2 7c14-10 26 10 40 0s26-10 40 0 26 10 40 0 26-10 36 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            <p className="mt-6 text-base sm:text-lg text-[var(--ink)]/75 leading-relaxed font-light max-w-md">
              Trusted by thousands of Hindu families to find a life partner
              rooted in shared faith, values, and tradition.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-9">
              <motion.div
                className="w-full sm:w-auto"
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Link
                  href="/register"
                  className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 overflow-hidden bg-[var(--maroon)] text-white font-medium text-[13px] sm:text-sm tracking-wide sm:tracking-wider uppercase px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl shadow-lg shadow-[var(--maroon)]/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-[var(--maroon)]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ivory)] whitespace-nowrap"
                >
                  {/* Gold shimmer sweep on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-[120%] skew-x-12 bg-gradient-to-r from-transparent via-[var(--gold-light)]/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[120%]"
                  />
                  <Heart
                    className="w-4 h-4 fill-current text-[var(--gold)] shrink-0 transition-transform duration-300 group-hover:scale-125"
                  />
                  <span className="relative">Begin Your Journey</span>
                </Link>
              </motion.div>

              <motion.div
                className="w-full sm:w-auto"
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Link
                  href="/plans"
                  className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[var(--gold)] text-[var(--maroon)] font-medium text-[13px] sm:text-sm tracking-wide sm:tracking-wider uppercase px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-all duration-300 hover:bg-[var(--gold)]/10 hover:border-[var(--gold-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ivory)] whitespace-nowrap"
                >
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  <span>View Membership Plans</span>
                  <ArrowRight className="w-4 h-4 shrink-0 -mr-1 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Right — arch-masked portrait photo (Home.png, 1122×1402) */}
          <motion.div
            className="relative mx-auto w-full max-w-[420px] lg:max-w-none"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div
              className="relative w-full aspect-[1122/1402]"
              style={{
                WebkitMaskImage: `url("${ARCH_MASK}")`,
                maskImage: `url("${ARCH_MASK}")`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
              }}
            >
              <Image
                src="/Home.png"
                alt="Couple beginning their Saptapadi journey together"
                fill
                sizes="(min-width: 1024px) 42vw, 90vw"
                className="object-cover"
              />
              {/* Gold outline echoing the arch silhouette */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  WebkitMaskImage: `url("${ARCH_MASK}")`,
                  maskImage: `url("${ARCH_MASK}")`,
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                  boxShadow: "inset 0 0 0 2px rgba(201,151,46,0.55)",
                }}
              />
            </div>

            {/* Stats bar — overlaps the base of the arch image */}
            <motion.div
              className="relative sm:absolute sm:-bottom-10 sm:left-1/2 sm:-translate-x-1/2 mt-6 sm:mt-0 w-[92%] max-w-sm sm:max-w-md bg-[var(--ivory)] border border-[var(--gold)]/30 shadow-xl rounded-2xl px-5 sm:px-6 py-4 sm:py-5 mx-auto sm:mx-0"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex flex-wrap items-center justify-center sm:justify-between gap-x-5 gap-y-3">
                {STATS.map((stat, i) => (
                  <React.Fragment key={stat.label}>
                    <div className="flex items-center gap-2.5">
                      <stat.icon
                        className="w-4 h-4 text-[var(--saffron)] shrink-0"
                        strokeWidth={1.75}
                      />
                      <div className="text-left leading-tight">
                        <p className="text-base sm:text-lg font-serif font-bold text-[var(--maroon)]">
                          {stat.value}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-[var(--ink)]/60 uppercase tracking-wider whitespace-nowrap">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                    {i < STATS.length - 1 && (
                      <span className="hidden sm:block h-8 w-px bg-[var(--gold)]/25" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}