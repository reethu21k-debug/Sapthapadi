"use client";

import React, { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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
   CEREMONIAL COMPONENTS & TIMELINE NODES
   ========================================================================= */

const nodeTriggerVariants = {
  rest: {},
  hover: {},
};

const petalVariants = {
  rest: { scale: 1, opacity: 0.88 },
  hover: (i: number) => ({
    scale: 1.12,
    opacity: 1,
    transition: { type: "spring", stiffness: 260, damping: 14, delay: i * 0.02 },
  }),
};

const numberVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.15, transition: { type: "spring", stiffness: 400, damping: 12 } },
};

function MarigoldNode({ number, accent }: { number: string; accent: "marigold" | "sindoor" }) {
  const color = accent === "marigold" ? MARIGOLD : SINDOOR;
  const petals = Array.from({ length: 8 });

  return (
    <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center">
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full drop-shadow-sm"
        animate={{ rotate: [0, 4, -4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        {petals.map((_, i) => (
          <g key={i} transform={`rotate(${i * 45} 50 50)`}>
            <motion.ellipse
              custom={i}
              variants={petalVariants}
              cx="50"
              cy="20"
              rx="10"
              ry="19"
              fill={color}
              style={{ transformOrigin: "50px 20px" }}
            />
          </g>
        ))}
        <circle cx="50" cy="50" r="23" fill="#faf9f6" stroke={color} strokeWidth="2" />
      </motion.svg>
      <motion.span
        variants={numberVariants}
        className="relative z-10 text-navy-dark font-bold text-xs sm:text-sm tracking-wider"
      >
        {number}
      </motion.span>
    </div>
  );
}

function KalashIcon({ className = "" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 40 44"
      className={className}
      fill="none"
      animate={{ rotate: [-2, 2, -2], y: [0, -1.5, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "20px 40px" }}
    >
      <path d="M8 8 L14 8 M26 8 L32 8" stroke={MARIGOLD} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 6 C12 12 8 12 8 18 M28 6 C28 12 32 12 32 18" stroke="#4b7a3a" strokeWidth="2" strokeLinecap="round" fill="none" />
      <motion.circle
        cx="20"
        cy="8"
        r="3.5"
        fill={SINDOOR}
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <path
        d="M11 15 C11 15 9 24 12 32 C14 38 26 38 28 32 C31 24 29 15 29 15 C29 15 25 18 20 18 C15 18 11 15 11 15 Z"
        fill="#faf9f6"
        stroke={SINDOOR}
        strokeWidth="2"
      />
      <path d="M13 22 H27" stroke={SINDOOR} strokeWidth="1.5" opacity="0.6" />
    </motion.svg>
  );
}

function DiyaIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 32" className={className} fill="none">
      <motion.path
        d="M20 4 C22 8 23 11 20 14 C17 11 18 8 20 4 Z"
        fill={MARIGOLD}
        animate={{
          scaleY: [1, 1.12, 0.95, 1.08, 1],
          scaleX: [1, 0.95, 1.05, 0.98, 1],
          opacity: [0.9, 1, 0.85, 1, 0.9],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "20px 12px" }}
      />
      <path
        d="M4 18 C4 18 10 26 20 26 C30 26 36 18 36 18 C36 18 32 22 20 22 C8 22 4 18 4 18 Z"
        fill="#faf9f6"
        stroke={SINDOOR}
        strokeWidth="2"
      />
      <ellipse cx="20" cy="18" rx="16" ry="4" fill="none" stroke={SINDOOR} strokeWidth="2" />
    </svg>
  );
}

function ScrollProgressDot() {
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: MARIGOLD }}
        animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="relative w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full"
        style={{ background: MARIGOLD, boxShadow: `0 0 10px 3px ${MARIGOLD}88` }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* =========================================================================
   WEDDING INVITATION / WAX-SEAL STEP CARD
   ========================================================================= */

const cardContentVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 26 },
  },
};

function SealMedallion({
  icon: Icon,
  accentColor,
  sealId,
  reduceMotion,
}: {
  icon: React.ElementType;
  accentColor: string;
  sealId: string;
  reduceMotion: boolean;
}) {
  const scallops = Array.from({ length: 16 });
  const gradId = `sealGrad-${sealId}`;
  const shadeId = `sealShade-${sealId}`;

  const sealStampVariants = {
    rest: { rotate: reduceMotion ? 0 : -7, scale: 1 },
    hover: {
      rotate: reduceMotion ? 0 : -2,
      scale: reduceMotion ? 1 : 1.05,
      transition: { type: "spring", stiffness: 260, damping: 14 },
    },
  };

  return (
    <motion.div
      variants={sealStampVariants}
      className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-[4.5rem] md:h-[4.5rem] flex items-center justify-center"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full drop-shadow-[0_10px_16px_rgba(26,37,64,0.24)]"
      >
        <defs>
          <radialGradient id={gradId} cx="34%" cy="26%" r="78%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="1" />
            <stop offset="60%" stopColor={accentColor} stopOpacity="0.94" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.8" />
          </radialGradient>
          <radialGradient id={shadeId} cx="50%" cy="82%" r="60%">
            <stop offset="0%" stopColor="#1a2540" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#1a2540" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Scalloped seal edge, pressed slightly irregular like a hand stamp */}
        {scallops.map((_, i) => (
          <g key={i} transform={`rotate(${i * (360 / 16)} 50 50)`}>
            <circle cx="50" cy="7.5" r="7" fill={accentColor} opacity={i % 2 === 0 ? 1 : 0.88} />
          </g>
        ))}

        {/* Body of the seal */}
        <circle cx="50" cy="50" r="34" fill={`url(#${gradId})`} />

        {/* Lower shadow to fake a pressed, embossed relief */}
        <circle cx="50" cy="50" r="34" fill={`url(#${shadeId})`} />

        {/* Emboss ring — the impression left by the die */}
        <circle cx="50" cy="50" r="27" fill="none" stroke="#faf9f6" strokeWidth="1" opacity="0.5" />
        <circle cx="50" cy="50" r="23" fill="none" stroke="#faf9f6" strokeWidth="1" strokeDasharray="1.5 3" opacity="0.4" />
      </svg>
      <Icon className="relative z-10 w-5 h-5 sm:w-6 sm:h-6 text-[#faf9f6]" strokeWidth={1.5} />
    </motion.div>
  );
}

function PostmarkStamp({
  step,
  accentColor,
  isHovering,
  reduceMotion,
}: {
  step: string;
  accentColor: string;
  isHovering: boolean;
  reduceMotion: boolean;
}) {
  const ticks = Array.from({ length: 24 });

  return (
    <motion.div
      animate={{ rotate: reduceMotion ? -9 : isHovering ? -3 : -9 }}
      transition={{ type: "spring", stiffness: 260, damping: 16 }}
      className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14"
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ color: `${accentColor}70` }}>
        {ticks.map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="4"
            x2="50"
            y2={i % 2 === 0 ? "10" : "8"}
            stroke="currentColor"
            strokeWidth="1"
            transform={`rotate(${i * (360 / 24)} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="50" cy="50" r="29" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1 2.5" opacity="0.7" />
      </svg>
      <div
        className="relative z-10 flex flex-col items-center justify-center leading-none"
        style={{ color: `${accentColor}c0` }}
      >
        <span className="text-[5.5px] sm:text-[6.5px] font-bold uppercase tracking-[0.2em]">Step</span>
        <span className="font-serif text-base sm:text-lg font-semibold">{step}</span>
      </div>
    </motion.div>
  );
}

interface StepCardProps {
  step: (typeof STEPS)[number];
  isEven: boolean;
}

function StepCard({ step, isEven }: StepCardProps) {
  const accentColor = step.accent === "marigold" ? MARIGOLD : SINDOOR;
  const cardRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpot({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  // Deckle-cut corner: bottom-left for even cards, bottom-right for odd
  // Use a smaller clip notch on mobile so the cut doesn't eat too much of a narrow card
  const clipCorner = isEven
    ? "polygon(0 0, 100% 0, 100% 100%, 20px 100%, 0 calc(100% - 20px))"
    : "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)";

  const clipCornerMd = isEven
    ? "polygon(0 0, 100% 0, 100% 100%, 28px 100%, 0 calc(100% - 28px))"
    : "polygon(28px 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%, 0 28px)";

  return (
    <motion.div
      ref={cardRef}
      initial="rest"
      whileHover="hover"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      animate={
        reduceMotion
          ? {}
          : {
              y: isHovering ? -8 : 0,
              rotate: isHovering ? (isEven ? -0.6 : 0.6) : 0,
            }
      }
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="group relative pt-14 pb-8 px-5 sm:pt-16 sm:pb-9 sm:px-7 md:pt-24 md:pb-12 md:px-11 shadow-[0_8px_30px_-12px_rgba(26,37,64,0.14)] transition-shadow duration-500 overflow-hidden [clip-path:var(--clip-sm)] md:[clip-path:var(--clip-md)]"
      style={
        {
          "--clip-sm": clipCorner,
          "--clip-md": clipCornerMd,
          backgroundColor: "#fffdf9",
          backgroundImage: "radial-gradient(rgba(26,37,64,0.05) 0.6px, transparent 0.6px)",
          backgroundSize: "10px 10px",
          boxShadow: isHovering
            ? `0 26px 55px -16px ${accentColor}3d, 0 8px 30px -12px rgba(26,37,64,0.14)`
            : undefined,
        } as React.CSSProperties
      }
    >
      {/* Cursor spotlight */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(340px circle at ${spot.x}% ${spot.y}%, ${accentColor}12, transparent 70%)`,
        }}
      />

      {/* Hairline outer rule */}
      <div
        className="absolute inset-1 sm:inset-[6px] pointer-events-none [clip-path:var(--clip-sm)] md:[clip-path:var(--clip-md)]"
        style={{ border: `1px solid ${accentColor}30` }}
      />
      {/* Inner dashed frame */}
      <div
        className="absolute inset-2 sm:inset-3 pointer-events-none border border-dashed"
        style={{ borderColor: `${accentColor}28` }}
      />

      {/* Postmark carrying the step number */}
      <div className={`absolute top-3 sm:top-4 md:top-6 ${isEven ? "right-4 sm:right-5 md:right-7" : "left-4 sm:left-5 md:left-7"} select-none pointer-events-none`}>
        <PostmarkStamp step={step.step} accentColor={accentColor} isHovering={isHovering} reduceMotion={reduceMotion} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center gap-4 sm:gap-5">
        {/* Wax-seal medallion */}
        <motion.div variants={cardContentVariants} className="relative -mt-8 sm:-mt-10 md:-mt-16">
          <div
            className="absolute -inset-3 rounded-full opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500 pointer-events-none"
            style={{ background: `${accentColor}30` }}
          />
          <SealMedallion icon={step.icon} accentColor={accentColor} sealId={step.step} reduceMotion={reduceMotion} />
        </motion.div>

        {/* Ornamental flanking rule */}
        <motion.div variants={cardContentVariants} className="flex items-center gap-2 sm:gap-3 justify-center" aria-hidden="true">
          <span
            className="h-px w-6 sm:w-8"
            style={{ background: `linear-gradient(90deg, transparent, ${accentColor}90)` }}
          />
          <span className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ background: accentColor }} />
          <span
            className="h-px w-6 sm:w-8"
            style={{ background: `linear-gradient(270deg, transparent, ${accentColor}90)` }}
          />
        </motion.div>

        <motion.div variants={cardContentVariants} className="space-y-2 sm:space-y-3 max-w-sm">
          <h3 className="font-serif text-xl sm:text-2xl lg:text-[1.75rem] font-semibold text-[#1a2540] tracking-tight">
            {step.title}
          </h3>
          <p className="text-gray-600 leading-relaxed text-sm sm:text-[0.97rem]">{step.description}</p>
        </motion.div>

        {/* Single kalava-striped footer rule */}
        <motion.div variants={cardContentVariants} className="flex items-center gap-2 pt-1 w-full max-w-[9rem] sm:max-w-[11rem]" aria-hidden="true">
          <span
            className="h-[2px] flex-1 rounded-full"
            style={{
              background:
                "repeating-linear-gradient(45deg, #A6193C 0px, #A6193C 3px, #E8871E 3px, #E8871E 6px)",
              opacity: 0.45,
            }}
          />
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: accentColor, boxShadow: `0 0 0 3px ${accentColor}20` }}
          />
          <span
            className="h-[2px] flex-1 rounded-full"
            style={{
              background:
                "repeating-linear-gradient(45deg, #A6193C 0px, #A6193C 3px, #E8871E 3px, #E8871E 6px)",
              opacity: 0.45,
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* =========================================================================
   SECTION CONTAINER
   ========================================================================= */

export function HowItWorksSection() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const kalavaGradient =
    "repeating-linear-gradient(45deg, #A6193C 0px, #A6193C 4px, #E8871E 4px, #E8871E 8px)";

  return (
    <section className="relative py-16 sm:py-24 lg:py-40 bg-[#faf9f6] overflow-hidden z-0">
      {/* Subtle Abstract Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-5%] left-[-10%] w-[260px] h-[260px] sm:w-[380px] sm:h-[380px] lg:w-[500px] lg:h-[500px] rounded-full bg-gold/10 blur-[80px] sm:blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-10%] right-[-5%] w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] lg:w-[600px] lg:h-[600px] rounded-full bg-navy-dark/5 blur-[90px] sm:blur-[150px]"
        />

        {/* Drifting marigold petal motes — fewer/smaller on mobile to keep the section light */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full hidden sm:block"
            style={{
              left: `${12 + i * 15}%`,
              top: `${10 + (i % 3) * 25}%`,
              width: 5 + (i % 3) * 2,
              height: 5 + (i % 3) * 2,
              background: i % 2 === 0 ? MARIGOLD : SINDOOR,
              opacity: 0.12,
            }}
            animate={{
              y: [0, -24, 0],
              x: [0, i % 2 === 0 ? 10 : -10, 0],
              opacity: [0.08, 0.2, 0.08],
            }}
            transition={{
              duration: 9 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.6,
            }}
          />
        ))}

        {/* Faint rotating Om watermark */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0.02, 0.032, 0.02] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 140, repeat: Infinity, ease: "linear" }}
            className="text-[90vw] sm:text-[70vw] leading-none font-serif text-navy-dark select-none"
            aria-hidden="true"
          >
            ॐ
          </motion.span>
        </motion.div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* CENTERED HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20 lg:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6 justify-center">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: 32 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-[1px] bg-gradient-to-r from-transparent to-gold-dark sm:!w-12"
              />
              <motion.span
                initial={{ letterSpacing: "0em", opacity: 0 }}
                whileInView={{ letterSpacing: "0.3em", opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-gold-dark text-[0.65rem] sm:text-xs font-bold uppercase whitespace-nowrap"
              >
                The Process
              </motion.span>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: 32 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-[1px] bg-gradient-to-r from-gold-dark to-transparent sm:!w-12"
              />
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-navy-dark mb-3 sm:mb-4 tracking-tight leading-tight px-2">
              The Path to <br className="md:hidden" />
              <motion.span
                className="italic font-light bg-clip-text text-transparent inline-block"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${SINDOOR}, ${MARIGOLD}, ${SINDOOR})`,
                  backgroundSize: "200% auto",
                }}
                animate={{ backgroundPosition: ["0% center", "200% center"] }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
              >
                Forever
              </motion.span>
            </h2>

            <motion.p
              lang="hi"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="font-serif italic text-gold-dark/70 text-sm sm:text-base mb-6 sm:mb-8 tracking-wide px-4"
            >
              विवाह की ओर एक शुभ कदम
            </motion.p>

            <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
              A seamless four-step journey designed to bring two families together.
              We handle the meticulous search, so you can focus entirely on the connection.
            </p>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative inline-block"
            >
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{
                  boxShadow: [
                    `0 0 0 0 ${MARIGOLD}40`,
                    `0 0 0 10px ${MARIGOLD}00`,
                  ],
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
              />
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-2.5 sm:gap-4 bg-navy-dark text-white px-6 py-3 sm:px-10 sm:py-4 rounded-full font-medium text-sm sm:text-base transition-all duration-300 hover:bg-gold-dark hover:shadow-2xl hover:shadow-gold/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <span className="relative z-10">Start Your Journey</span>
                <motion.div
                  className="relative z-10"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* TIMELINE LAYOUT */}
        <div ref={containerRef} className="relative max-w-5xl mx-auto pb-10">
          {/* Kalash cap at the start of the thread */}
          <div className="absolute left-[20px] md:left-1/2 -top-7 sm:-top-8 -translate-x-1/2 z-10">
            <KalashIcon className="w-7 h-7 sm:w-9 sm:h-9" />
          </div>

          {/* Background Thread */}
          <div
            className="absolute left-[20px] md:left-1/2 top-4 bottom-4 w-[2px] sm:w-[3px] md:-translate-x-1/2 z-0 opacity-25"
            style={{ background: kalavaGradient }}
          />

          {/* Animated Scroll Thread */}
          <motion.div
            style={{ height: lineHeight, background: kalavaGradient }}
            className="absolute left-[20px] md:left-1/2 top-4 w-[2px] sm:w-[3px] md:-translate-x-1/2 z-0 origin-top shadow-[0_0_10px_rgba(200,160,80,0.5)]"
          >
            <ScrollProgressDot />
          </motion.div>

          {/* Diya cap at the end of the thread */}
          <div className="absolute left-[20px] md:left-1/2 -bottom-5 sm:-bottom-6 -translate-x-1/2 z-10">
            <DiyaIcon className="w-8 h-6 sm:w-10 sm:h-8" />
          </div>

          <div className="space-y-10 sm:space-y-16 md:space-y-24">
            {STEPS.map((step, index) => {
              const isEven = index % 2 === 0;
              const accentColor = step.accent === "marigold" ? MARIGOLD : SINDOOR;

              return (
                <div key={step.step} className="relative flex items-center w-full">
                  {/* Marigold Timeline Node */}
                  <motion.div
                    initial="rest"
                    whileHover="hover"
                    variants={nodeTriggerVariants}
                    className="absolute left-[20px] md:left-1/2 -translate-x-1/2 z-20 cursor-default"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ type: "spring", delay: 0.2 }}
                    >
                      <motion.div
                        animate={{
                          boxShadow: [
                            `0 0 0 0 ${accentColor}66`,
                            `0 0 0 15px ${accentColor}00`,
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full"
                      />
                      <MarigoldNode number={step.step} accent={step.accent} />
                    </motion.div>
                  </motion.div>

                  {/* Card Container */}
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={{
                      hidden: { opacity: 0, x: isEven ? -30 : 30 },
                      visible: {
                        opacity: 1,
                        x: 0,
                        transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 },
                      },
                    }}
                    className={`w-full pl-[52px] sm:pl-[64px] md:pl-0 md:w-[calc(50%-4rem)] ${
                      isEven ? "md:mr-auto" : "md:ml-auto"
                    }`}
                  >
                    <StepCard step={step} isEven={isEven} />
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}