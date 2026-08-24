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
  "/Baneers/banner-16.png",
  "/Baneers/banner-15.png",
  "/Baneers/banner-12.png",
  "/Baneers/banner-1.png",
  "/Baneers/banner-2.png",
  "/Baneers/banner-3.png",
  "/Baneers/banner-4.png",
  "/Baneers/banner-14.png",
  "/Baneers/banner-5.png",
  "/Baneers/banner-6.png",
  "/Baneers/banner-7.png",
  "/Baneers/banner-8.png",
  "/Baneers/banner-9.png",
  "/Baneers/banner-10.png",
  "/Baneers/banner-11.png",
  "/Baneers/banner-13.png",
];

const STATS = [
  { icon: Users, value: "10,000+", label: "Profiles" },
  { icon: HeartHandshake, value: "5,000+", label: "Matches Made" },
  { icon: ShieldCheck, value: "98%", label: "Satisfaction" },
];

const SLIDE_DURATION = 5500;

// Banners are authored at 2172 × 724 px (3:1). Keep this ratio identical
// at every breakpoint so object-cover never has to crop — the box and the
// image are always the same shape, on phones, tablets, and desktops alike.
const BANNER_ASPECT = "aspect-[2172/724]";
const BANNER_NATIVE_WIDTH = 2172;

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
        className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80 opacity-[0.06] text-[var(--maroon)]"
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
      <div className="relative z-10 flex items-center justify-center gap-3 pb-5 sm:pb-6 px-6">
        <span className="h-px flex-1 max-w-[120px] sm:max-w-[180px] bg-gradient-to-r from-transparent to-[var(--gold)]" />
        <Flame className="w-4 h-4 text-[var(--gold)] shrink-0" strokeWidth={1.75} />
        <span className="h-px flex-1 max-w-[120px] sm:max-w-[180px] bg-gradient-to-l from-transparent to-[var(--gold)]" />
      </div>

      {/* Banner Carousel */}
      <div className="relative w-full">
        {/* Pillarbox backdrop — on ultra-wide monitors the capped-width banner
            sits centered on this band instead of being stretched past its
            native resolution. On phones/tablets this band is invisible
            because the banner fills the full width anyway. */}
        <div className="relative w-full bg-[var(--maroon-deep)]">
          <div
            className={`relative w-full max-w-[${BANNER_NATIVE_WIDTH}px] mx-auto ${BANNER_ASPECT} overflow-hidden group sm:rounded-xl lg:rounded-2xl`}
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
                        // Box ratio === image ratio at every breakpoint, so
                        // object-cover never needs to crop — it just fills.
                        className="object-cover"
                        sizes={`(min-width: ${BANNER_NATIVE_WIDTH}px) ${BANNER_NATIVE_WIDTH}px, 100vw`}
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
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2.5 rounded-full bg-black/25 hover:bg-[var(--maroon)] border border-[var(--gold-light)]/40 text-[var(--gold-light)] hover:text-white backdrop-blur-sm transition-all duration-300 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={nextSlide}
              aria-label="Next banner"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2.5 rounded-full bg-black/25 hover:bg-[var(--maroon)] border border-[var(--gold-light)]/40 text-[var(--gold-light)] hover:text-white backdrop-blur-sm transition-all duration-300 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            </button>

            {/* Progress-bar dots */}
            <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 z-10 px-2 max-w-full overflow-x-auto no-scrollbar">
              {BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Show banner ${i + 1}`}
                  className="relative h-1.5 w-4 sm:w-5 rounded-full bg-white/30 overflow-hidden shrink-0"
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-[var(--gold)] rounded-full"
                    style={{ width: i === active ? `${progress}%` : "0%" }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Trust Badge */}
        <div className="hidden md:flex absolute -bottom-6 lg:-bottom-7 left-4 lg:left-6 z-20 items-center gap-3 bg-[var(--ivory)] border border-[var(--gold)]/40 shadow-lg rounded-2xl px-4 lg:px-5 py-2.5 lg:py-3 max-w-[calc(100%-2rem)]">
          <ShieldCheck className="w-5 h-5 text-[var(--saffron)] shrink-0" strokeWidth={1.75} />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[var(--maroon)] whitespace-nowrap">
              100% Verified Profiles
            </p>
            <p className="text-xs text-[var(--ink)]/60 whitespace-nowrap">
              Manually reviewed by our team
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Home.png arch-photo section — sits below the carousel        */}
      {/* ============================================================ */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 md:pt-24 pb-14 sm:pb-16">
        <div className="grid md:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <motion.div
            className="text-center md:text-left"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 text-[11px] sm:text-sm tracking-[0.15em] sm:tracking-[0.25em] uppercase text-[var(--maroon)] font-semibold mb-4 sm:mb-5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--saffron)] shrink-0" />
              Seven Steps, One Lifetime
            </p>

            <h1 className="font-serif text-[clamp(2rem,7vw,4.25rem)] leading-[1.12] sm:leading-[1.05] text-[var(--maroon)]">
              Your <span className="text-[var(--saffron)]">Saptapadi</span>
              <br />
              Begins Here
            </h1>

            <svg
              aria-hidden
              viewBox="0 0 160 14"
              className="w-28 sm:w-32 h-3.5 mt-5 sm:mt-6 text-[var(--gold)] mx-auto md:mx-0"
            >
              <path
                d="M2 7c14-10 26 10 40 0s26-10 40 0 26 10 40 0 26-10 36 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            <p className="mt-5 sm:mt-6 text-[clamp(0.95rem,2.2vw,1.125rem)] text-[var(--ink)]/75 leading-relaxed font-light max-w-md mx-auto md:mx-0">
              Trusted by thousands of Hindu families to find a life partner
              rooted in shared faith, values, and tradition.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4 mt-8 sm:mt-9">
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
                  <Heart className="w-4 h-4 fill-current text-[var(--gold)] shrink-0 transition-transform duration-300 group-hover:scale-125" />
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
            className="relative mx-auto w-full max-w-[320px] xs:max-w-[360px] sm:max-w-[420px] md:max-w-none"
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
                sizes="(min-width: 1024px) 42vw, (min-width: 640px) 420px, 90vw"
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
              className="relative md:absolute md:-bottom-10 md:left-1/2 md:-translate-x-1/2 mt-6 md:mt-0 w-[92%] max-w-sm sm:max-w-md bg-[var(--ivory)] border border-[var(--gold)]/30 shadow-xl rounded-2xl px-4 sm:px-6 py-4 sm:py-5 mx-auto md:mx-0"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex flex-wrap items-center justify-center sm:justify-between gap-x-4 sm:gap-x-5 gap-y-3">
                {STATS.map((stat, i) => (
                  <React.Fragment key={stat.label}>
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <stat.icon className="w-4 h-4 text-[var(--saffron)] shrink-0" strokeWidth={1.75} />
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