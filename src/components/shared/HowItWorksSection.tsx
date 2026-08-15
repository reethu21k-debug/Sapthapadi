"use client";

import React, { useRef, useId } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import Link from "next/link";

const MARIGOLD = "#E8871E";
const SINDOOR = "#A6193C";

/**
 * Each step now points at a pre-designed card image (public/Process/CardN.png)
 * instead of being built from an icon + heading + paragraph. `imageWidth` /
 * `imageHeight` are the image's real intrinsic dimensions — used to lock the
 * card's aspect ratio so next/image can render responsively (fill + object-cover)
 * with zero cropping and zero layout shift while loading.
 */
const STEPS = [
  {
    step: "01",
    title: "Register & Profile",
    accent: "marigold" as const,
    image: "/Process/Card1.png",
    imageWidth: 1329,
    imageHeight: 942,
  },
  {
    step: "02",
    title: "Curated Matches",
    accent: "sindoor" as const,
    image: "/Process/Card2.png",
    imageWidth: 1346,
    imageHeight: 968,
  },
  {
    step: "03",
    title: "Connect & Meet",
    accent: "marigold" as const,
    image: "/Process/Card3.png",
    imageWidth: 1347,
    imageHeight: 1016,
  },
  {
    step: "04",
    title: "Premium Biodata",
    accent: "sindoor" as const,
    image: "/Process/Card4.png",
    imageWidth: 1339,
    imageHeight: 985,
  },
];

/* =========================================================================
   SSR-SAFE REDUCED MOTION HOOK
   - framer-motion's useReducedMotion() reads window.matchMedia, which is
     unavailable during SSR and can resolve differently on the client's
     very first paint (e.g. OS-level "reduce motion" settings, or timing
     quirks in framer's internal isomorphic effect).
   - To guarantee the server-rendered HTML and the client's first render
     are byte-identical, we always report `false` (i.e. "motion enabled")
     until after mount, then swap in the real value on a subsequent
     client-only render. This matches the pattern React/Next.js expects
     for anything that depends on browser-only APIs.
   ========================================================================= */
function useSafeReducedMotion() {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? !!reduceMotion : false;
}

/* =========================================================================
   MAGNETIC BUTTON
   - respects reduced motion
   - has a real focus-visible state (magnetic buttons are notorious for
     losing keyboard affordance)
   ========================================================================= */

function MagneticButton({ children, href }: { children: React.ReactNode; href: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useSafeReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || !ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    x.set(middleX * 0.3);
    y.set(middleY * 0.3);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={reduceMotion ? {} : { x: springX, y: springY }}
      className="relative z-20 flex justify-center"
    >
      <Link
        href={href}
        className="group relative inline-flex items-center gap-3 bg-[#1a2540] text-white px-8 py-4 rounded-full font-medium text-base overflow-hidden
                   transition-shadow duration-500 hover:shadow-[0_12px_40px_rgba(200,160,80,0.4)]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a050] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
      >
        <div
          className="absolute inset-0 bg-[#c8a050] translate-y-full group-hover:translate-y-0 group-focus-visible:translate-y-0 transition-transform duration-500"
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
        <span className="relative z-10 transition-colors duration-300 group-hover:text-[#1a2540] group-focus-visible:text-[#1a2540]">
          {children}
        </span>
        <svg
          className="w-5 h-5 relative z-10 group-hover:translate-x-1 group-hover:text-[#1a2540] group-focus-visible:text-[#1a2540] transition-transform duration-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </motion.div>
  );
}

/* =========================================================================
   CEREMONIAL COMPONENTS (SVG DRAWING & BLOOMING)
   All decorative — marked aria-hidden so screen readers don't announce
   unlabelled <svg> elements before ever reaching the step content.
   ========================================================================= */

function MarigoldNode({ number, accent }: { number: string; accent: "marigold" | "sindoor" }) {
  const color = accent === "marigold" ? MARIGOLD : SINDOOR;
  const reduceMotion = useSafeReducedMotion();
  const petals = Array.from({ length: 8 });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
  };
  const petalVariants = {
    hidden: { scale: 0, opacity: 0 },
    show: { scale: 1, opacity: 0.9, transition: { type: "spring" as const, stiffness: 200, damping: 15 } },
  };

  return (
    <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center group" aria-hidden="true">
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full drop-shadow-md"
        animate={reduceMotion ? {} : { rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
      >
        {petals.map((_, i) => (
          <g key={i} transform={`rotate(${i * 45} 50 50)`}>
            <motion.ellipse
              variants={petalVariants}
              cx="50"
              cy="16"
              rx="12"
              ry="24"
              fill={color}
              style={{ transformOrigin: "50px 16px" }}
              className="transition-transform duration-300 group-hover:scale-110"
            />
          </g>
        ))}
        <motion.circle
          cx="50"
          cy="50"
          r="26"
          fill="#faf9f6"
          stroke={color}
          strokeWidth="3"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", delay: 0.5 }}
        />
      </motion.svg>
      <span className="relative z-10 text-[#1a2540] font-bold text-sm sm:text-lg tracking-widest drop-shadow-sm">
        {number}
      </span>
    </div>
  );
}

function KalashIcon() {
  return (
    <svg viewBox="0 0 40 44" className="w-10 h-10" fill="none" aria-hidden="true">
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        d="M8 8 L14 8 M26 8 L32 8"
        stroke={MARIGOLD}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <motion.path
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
        d="M12 6 C12 12 8 12 8 18 M28 6 C28 12 32 12 32 18"
        stroke="#4b7a3a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <motion.circle
        cx="20"
        cy="8"
        r="4"
        fill={SINDOOR}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1 }}
      />
      <motion.path
        initial={{ pathLength: 0, fill: "transparent" }}
        whileInView={{ pathLength: 1, fill: "#faf9f6" }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        d="M11 15 C11 15 9 24 12 32 C14 38 26 38 28 32 C31 24 29 15 29 15 C29 15 25 18 20 18 C15 18 11 15 11 15 Z"
        stroke={SINDOOR}
        strokeWidth="2.5"
      />
    </svg>
  );
}

/**
 * The diya's flame now ignites only once the timeline (the kalava thread)
 * has actually reached the bottom — driven by `lit`, passed from the
 * parent's scroll progress. Previously it pulsed on mount regardless of
 * scroll position, so the "final step reached" moment had no payoff.
 */
function DiyaIcon({ lit }: { lit: boolean }) {
  const reduceMotion = useSafeReducedMotion();
  return (
    <svg viewBox="0 0 40 32" className="w-10 h-8" fill="none" aria-hidden="true">
      <motion.path
        d="M20 4 C22 8 23 11 20 14 C17 11 18 8 20 4 Z"
        fill={MARIGOLD}
        initial={{ scale: 0, opacity: 0 }}
        animate={
          lit
            ? reduceMotion
              ? { scale: 1, opacity: 1 }
              : { scale: [1, 1.15, 0.9, 1.1, 1], opacity: [0.8, 1, 0.7, 1, 0.8] }
            : { scale: 0, opacity: 0 }
        }
        transition={lit ? { duration: 1.8, repeat: reduceMotion ? 0 : Infinity } : { duration: 0.4 }}
        style={{ transformOrigin: "20px 14px", filter: "drop-shadow(0 0 6px rgba(232,135,30,0.8))" }}
      />
      <motion.path
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        d="M4 18 C4 18 10 26 20 26 C30 26 36 18 36 18 C36 18 32 22 20 22 C8 22 4 18 4 18 Z"
        fill="#faf9f6"
        stroke={SINDOOR}
        strokeWidth="2.5"
      />
      <motion.ellipse
        cx="20"
        cy="18"
        rx="16"
        ry="4"
        stroke={SINDOOR}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      />
    </svg>
  );
}

/* =========================================================================
   IMAGE STEP CARD
   - Renders the pre-designed CardN.png as the entire card face.
   - The wrapper's aspect-ratio is locked to the image's real intrinsic
     dimensions so next/image (fill + object-cover) never crops or
     letterboxes, and never shifts layout while loading.
   - Keeps the same tilt / sheen hover polish as the original text cards.
   ========================================================================= */

function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  const accentColor = step.accent === "marigold" ? MARIGOLD : SINDOOR;
  const cardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useSafeReducedMotion();
  const gradId = useId();

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const tiltX = useSpring(useTransform(mouseY, [0, 1], [5, -5]), { stiffness: 400, damping: 30 });
  const tiltY = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), { stiffness: 400, damping: 30 });

  const sheenGradient = useMotionTemplate`radial-gradient(
    circle at ${useTransform(mouseX, [0, 1], [0, 100])}% ${useTransform(mouseY, [0, 1], [0, 100])}%,
    rgba(255,255,255,0.35) 0%,
    rgba(255,255,255,0) 60%
  )`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || reduceMotion) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width);
    mouseY.set((e.clientY - top) / height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={reduceMotion ? {} : { rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
      whileHover={reduceMotion ? {} : { scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group relative w-full min-w-0 [perspective:1200px] cursor-pointer"
    >
      <div
        className="relative w-full overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] bg-[#FFFCF8]"
        style={{
          boxShadow: `0 24px 60px -16px ${accentColor}30, 0 6px 18px -6px rgba(0,0,0,0.12)`,
        }}
      >
        {/* Ornate double frame, echoing the wax-seal motif used elsewhere in the section */}
        <div
          className="absolute inset-2 sm:inset-3 z-20 rounded-2xl border border-white/70 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-3 sm:inset-4 z-20 rounded-xl border border-dashed border-white/40 pointer-events-none"
          aria-hidden="true"
        />

        {/* Responsive image — aspect-ratio locked to the source file's real dimensions */}
        <div
          className="relative w-full"
          style={{ aspectRatio: `${step.imageWidth} / ${step.imageHeight}` }}
        >
          <Image
            src={step.image}
            alt={step.title}
            fill
            sizes="(max-width: 640px) 78vw, (max-width: 768px) 82vw, (max-width: 1024px) 42vw, 460px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            priority={step.step === "01"}
          />
        </div>

        {/* Subtle gold ring on hover */}
        <div
          className="absolute inset-0 z-30 rounded-[1.75rem] sm:rounded-[2rem] ring-1 ring-inset ring-white/10 group-hover:ring-2 transition-all duration-500 pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1px ${accentColor}20` }}
          aria-hidden="true"
        />

        {/* Mouse-tracked sheen */}
        {!reduceMotion && (
          <motion.div
            className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: sheenGradient }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Decorative gradient id anchor (kept for parity with SVG defs elsewhere; unused visually) */}
      <span className="sr-only" aria-hidden="true">
        {gradId}
      </span>
    </motion.div>
  );
}

/* =========================================================================
   MAIN SECTION
   ========================================================================= */

export function HowItWorksSection() {
  const containerRef = useRef(null);
  const reduceMotion = useSafeReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Drives the diya ignition — lights once the kalava thread is ~95% drawn,
  // so the "flame at the end of the path" reads as earned rather than
  // decorative. See DiyaIcon's `lit` prop.
  const [diyaLit, setDiyaLit] = React.useState(false);
  React.useEffect(() => {
    return scrollYProgress.on("change", (v) => setDiyaLit(v > 0.95));
  }, [scrollYProgress]);

  const kalavaGradient = "repeating-linear-gradient(45deg, #A6193C 0px, #A6193C 6px, #E8871E 6px, #E8871E 12px)";

  return (
    <section
      className="relative py-24 sm:py-32 lg:py-48 bg-[#FAFAFA] overflow-hidden z-0"
      aria-labelledby="how-it-works-heading"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-24 lg:mb-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-4 mb-6 justify-center">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c8a050]" aria-hidden="true" />
              <span className="text-[#c8a050] text-[0.65rem] sm:text-xs font-bold uppercase tracking-[0.4em]">
                The Process
              </span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c8a050]" aria-hidden="true" />
            </div>

            <h2
              id="how-it-works-heading"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-[#1a2540] mb-6 tracking-tight leading-[1.1]"
            >
              The Path to <br className="md:hidden" />
              <span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-[#A6193C] via-[#E8871E] to-[#A6193C] bg-[length:200%_auto] animate-gradient">
                Forever
              </span>
            </h2>

            <p lang="hi" className="font-serif italic text-[#c8a050] text-lg sm:text-xl mb-12 tracking-wide opacity-90">
              विवाह की ओर एक शुभ कदम
            </p>

            <MagneticButton href="/register">Start Your Journey</MagneticButton>
          </motion.div>
        </div>

        <div ref={containerRef} className="relative max-w-5xl mx-auto pb-16">
          <div className="absolute left-[36px] md:left-1/2 -top-12 -translate-x-1/2 z-10">
            <KalashIcon />
          </div>

          <div
            className="absolute left-[36px] md:left-1/2 top-0 bottom-0 w-[3px] md:-translate-x-1/2 z-0 opacity-20"
            style={{ background: kalavaGradient }}
            aria-hidden="true"
          />

          <motion.div
            style={{ height: lineHeight, background: kalavaGradient }}
            className="absolute left-[36px] md:left-1/2 top-0 w-[3px] md:-translate-x-1/2 z-0 origin-top shadow-[0_0_20px_rgba(232,135,30,0.8)]"
            aria-hidden="true"
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20">
              <motion.div
                className="absolute inset-0 w-6 h-6 -left-[50%] -top-[50%] rounded-full bg-[#E8871E] blur-md"
                animate={reduceMotion ? {} : { scale: [1, 1.5, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative w-3.5 h-3.5 rounded-full bg-white border-2 border-[#E8871E] shadow-sm" />
            </div>
          </motion.div>

          <div className="absolute left-[36px] md:left-1/2 -bottom-10 -translate-x-1/2 z-10">
            <DiyaIcon lit={diyaLit} />
          </div>

          <ol className="space-y-16 md:space-y-32 pt-16 list-none">
            {STEPS.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <li key={step.step} className="relative flex items-center w-full min-w-0">
                  <div className="absolute left-[36px] md:left-1/2 -translate-x-1/2 z-20">
                    <MarigoldNode number={step.step} accent={step.accent} />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-150px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full min-w-0 pl-20 sm:pl-24 md:pl-0 md:w-[calc(50%-6rem)] ${isEven ? "md:mr-auto" : "md:ml-auto"}`}
                  >
                    <StepCard step={step} />
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}