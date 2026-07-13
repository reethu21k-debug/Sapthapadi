"use client";

import React, { useRef, useId } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import { UserPlus, Search, Heart, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

const MARIGOLD = "#E8871E";
const SINDOOR = "#A6193C";

const STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Register & Profile",
    description:
      "Begin your journey by creating a comprehensive profile. Share your values, family background, and aspirations to help us understand what you seek in a life partner.",
    accent: "marigold" as const,
  },
  {
    icon: Search,
    step: "02",
    title: "Curated Matches",
    description:
      "Our matchmakers meticulously handpick profiles that align with your deepest preferences. Experience a refined search with zero spam and absolute privacy.",
    accent: "sindoor" as const,
  },
  {
    icon: Heart,
    step: "03",
    title: "Connect & Meet",
    description:
      "Express interest in the profiles that resonate with you. We facilitate respectful introductions, allowing families to connect organically and meaningfully.",
    accent: "marigold" as const,
  },
  {
    icon: FileText,
    step: "04",
    title: "Premium Biodata",
    description:
      "Generate a stunning, elegantly designed biodata PDF. Easily share your details with families through a modern layout complete with a secure QR code.",
    accent: "sindoor" as const,
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
        <ArrowRight
          className="w-5 h-5 relative z-10 group-hover:translate-x-1 group-hover:text-[#1a2540] group-focus-visible:text-[#1a2540] transition-transform duration-300"
          aria-hidden="true"
        />
      </Link>
    </motion.div>
  );
}

/* =========================================================================
   CEREMONIAL COMPONENTS (SVG DRAWING & BLOOMING)
   All decorative — marked aria-hidden so screen readers don't announce
   four unlabelled <svg> elements before ever reaching the step content.
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
   WAX-SEAL STEP CARD WITH DYNAMIC SHEEN
   ========================================================================= */

function SealMedallion({ icon: Icon, accentColor }: { icon: React.ElementType; accentColor: string }) {
  const gradId = useId();
  const scallops = Array.from({ length: 16 });

  return (
    <div className="relative w-20 h-20 flex items-center justify-center" aria-hidden="true">
      <div className="absolute inset-0 bg-black/10 rounded-full blur-md translate-y-2" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-10">
        <defs>
          <linearGradient id={gradId} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="50%" stopColor={accentColor} />
            <stop offset="100%" stopColor="#6b0015" />
          </linearGradient>
        </defs>
        {scallops.map((_, i) => (
          <circle
            key={i}
            cx="50"
            cy="4"
            r="8.5"
            fill={`url(#${gradId})`}
            transform={`rotate(${i * (360 / 16)} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="38" fill={`url(#${gradId})`} />
        <path d="M 15 50 A 35 35 0 0 1 85 50 Q 80 30 50 20 Q 20 30 15 50" fill="white" opacity="0.15" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="white" strokeWidth="1" strokeDasharray="3 4" opacity="0.3" />
      </svg>
      <Icon className="relative z-20 w-7 h-7 text-white drop-shadow-md" strokeWidth={1.5} />
    </div>
  );
}

function StepCard({ step, isEven }: { step: (typeof STEPS)[number]; isEven: boolean }) {
  const accentColor = step.accent === "marigold" ? MARIGOLD : SINDOOR;
  const cardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useSafeReducedMotion();

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const tiltX = useSpring(useTransform(mouseY, [0, 1], [6, -6]), { stiffness: 400, damping: 30 });
  const tiltY = useSpring(useTransform(mouseX, [0, 1], [-6, 6]), { stiffness: 400, damping: 30 });

  const sheenGradient = useMotionTemplate`radial-gradient(
    circle at ${useTransform(mouseX, [0, 1], [0, 100])}% ${useTransform(mouseY, [0, 1], [0, 100])}%,
    rgba(255,255,255,0.4) 0%,
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

  // Desktop alternates the seal's clipped corner left/right; on mobile the
  // card is always left-aligned to the timeline, so it should always read
  // as the same "left" cut regardless of index — otherwise every other
  // card looks visually broken once the layout collapses to one column.
  const clipCorner = isEven
    ? "polygon(0 0, 100% 0, 100% 100%, 36px 100%, 0 calc(100% - 36px))"
    : "polygon(36px 0, 100% 0, 100% calc(100% - 36px), calc(100% - 36px) 100%, 0 100%, 0 36px)";
  const clipCornerMobile = "polygon(0 0, 100% 0, 100% 100%, 36px 100%, 0 calc(100% - 36px))";

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={reduceMotion ? {} : { rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
      className="relative z-10 w-full [perspective:1200px] cursor-crosshair"
    >
      <div
        className="group relative pt-20 pb-12 px-8 sm:pt-24 sm:pb-14 sm:px-12 bg-[#FFFCF8] overflow-hidden"
        style={{
          clipPath: `var(--clip-mobile, ${clipCornerMobile})`,
          boxShadow: `0 20px 50px -12px ${accentColor}25, 0 4px 15px -4px rgba(0,0,0,0.08)`,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      >
        <style>{`@media (min-width: 768px) { .step-card-${step.step} { clip-path: ${clipCorner} !important; } }`}</style>

        {!reduceMotion && (
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            style={{ background: sheenGradient }}
            aria-hidden="true"
          />
        )}

        <div className="absolute inset-2 border border-[#E5DFD3]/80 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-3 border border-dashed border-[#E5DFD3]/80 pointer-events-none" aria-hidden="true" />

        <div className="relative z-30 flex flex-col items-center text-center gap-6" style={{ transform: "translateZ(40px)" }}>
          <div className="relative -mt-16 transition-transform duration-500 group-hover:-translate-y-2">
            <SealMedallion icon={step.icon} accentColor={accentColor} />
          </div>

          <div className="space-y-4 max-w-sm">
            <h3 className="font-serif text-3xl font-semibold text-[#1a2540] tracking-tight">{step.title}</h3>
            <p className="text-[#5a657c] leading-relaxed text-sm sm:text-[0.95rem]">{step.description}</p>
          </div>

          <div className="flex items-center gap-3 w-full max-w-[10rem] opacity-70 mt-2" aria-hidden="true">
            <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#A6193C]" />
            <span className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: accentColor }} />
            <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#A6193C]" />
          </div>
        </div>
      </div>
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

          <ol className="space-y-24 md:space-y-40 pt-16 list-none">
            {STEPS.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <li key={step.step} className="relative flex items-center w-full">
                  <div className="absolute left-[36px] md:left-1/2 -translate-x-1/2 z-20">
                    <MarigoldNode number={step.step} accent={step.accent} />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-150px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full pl-[96px] md:pl-0 md:w-[calc(50%-6rem)] ${isEven ? "md:mr-auto" : "md:ml-auto"} step-card-${step.step}`}
                  >
                    <StepCard step={step} isEven={isEven} />
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