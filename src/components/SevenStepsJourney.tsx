"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * The Seven Steps (Saptapadi) — the signature element of the About page.
 *
 * Each of the seven traditional vows exchanged during the ceremony is
 * reframed as a promise the platform keeps. A golden thread winds down
 * the section and ties a ceremonial knot at every step.
 */

const STEPS = [
  {
    numeral: "I",
    sanskrit: "Anna",
    meaning: "Nourishment",
    title: "We nourish new beginnings",
    body: "Every profile is reviewed by hand before it ever reaches you — never an algorithm skimming for a swipe.",
  },
  {
    numeral: "II",
    sanskrit: "Bala",
    meaning: "Strength",
    title: "Strength for the journey",
    body: "A dedicated relationship manager walks with your family from the first introduction to the final blessing.",
  },
  {
    numeral: "III",
    sanskrit: "Dhana",
    meaning: "Prosperity",
    title: "Built to protect what matters",
    body: "Contact details are shared only with active members. Your family's information is never sold, never rented.",
  },
  {
    numeral: "IV",
    sanskrit: "Sukha",
    meaning: "Harmony",
    title: "Two families, one path",
    body: "Designed for parents and elders as much as for the couple — because a match is a meeting of households.",
  },
  {
    numeral: "V",
    sanskrit: "Praja",
    meaning: "Legacy",
    title: "For the years that follow",
    body: "We weigh compatibility that lasts well past the wedding season — values, temperament, and long-term fit.",
  },
  {
    numeral: "VI",
    sanskrit: "Ritu",
    meaning: "Wellbeing",
    title: "Care, without pressure",
    body: "No countdown timers, no manufactured urgency. Matchmaking moves at the pace a family is comfortable with.",
  },
  {
    numeral: "VII",
    sanskrit: "Sakhya",
    meaning: "Lifetime Friendship",
    title: "Friendship that lasts a lifetime",
    body: "Over 2,500 families have walked these seven steps with us — a community built on introductions, not swipes.",
  },
];

export default function SevenStepsJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion() ?? false;

  // Tracks scroll progress through the timeline to draw the golden thread dynamically
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const threadHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={containerRef}
      className="relative bg-[#faf9f6] py-28 lg:py-36 px-4 sm:px-6 overflow-hidden"
      aria-label="The seven steps of Saptapadi"
    >
      {/* Ambient background glow motes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C9982D]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-3xl mx-auto text-center mb-20 lg:mb-28">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8871E]/10 border border-[#E8871E]/20 text-[#C8631C] text-[11px] font-medium tracking-[0.2em] uppercase mb-4 shadow-2xs">
            <Sparkles className="w-3 h-3" />
            <span>Saptapadi · The Seven Steps</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1a2540] tracking-tight leading-tight">
            Seven Vows, <span className="italic font-light text-[#C8631C]">Walked Together</span>
          </h2>

          <p className="text-gray-600 font-light mt-5 leading-relaxed text-base sm:text-lg max-w-xl mx-auto">
            In tradition, a couple circles the sacred fire seven times, one vow spoken at each step. We built our platform the same way — one deliberate promise at a time.
          </p>
        </motion.div>
      </div>

      {/* Timeline Container */}
      <div className="relative max-w-3xl mx-auto pl-[48px] sm:pl-24">
        {/* Base Background Thread (Unlit) */}
        <div className="absolute left-[24px] sm:left-10 top-6 bottom-12 w-[2px] bg-[#1a2540]/10 -translate-x-1/2 pointer-events-none" />

        {/* Animated Golden Thread (Lit by Scroll Progress) */}
        <motion.div
          style={{ height: reduceMotion ? "100%" : threadHeight }}
          className="absolute left-[24px] sm:left-10 top-6 w-[2px] bg-gradient-to-b from-[#C9982D] via-[#E8871E] to-[#A6193C] -translate-x-1/2 pointer-events-none origin-top shadow-[0_0_12px_rgba(201,152,45,0.6)]"
        />

        <ol className="relative flex flex-col gap-8 sm:gap-10">
          {STEPS.map((step, i) => {
            const isHovered = hoveredIndex === i;

            return (
              <motion.li
                key={step.numeral}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: reduceMotion ? 0 : i * 0.08 }}
                className="group relative flex items-start cursor-default"
              >
                {/* Ceremonial Knot Marker */}
                <div className="absolute left-[-48px] sm:left-[-96px] top-1.5 z-10 flex items-center justify-center">
                  {/* Expanding outer pulse ring on reveal/hover */}
                  <motion.div
                    animate={
                      reduceMotion
                        ? {}
                        : {
                            scale: isHovered ? 1.25 : [1, 1.15, 1],
                            opacity: isHovered ? 1 : [0.4, 0.8, 0.4],
                          }
                    }
                    transition={{ duration: isHovered ? 0.3 : 3, repeat: isHovered ? 0 : Infinity, ease: "easeInOut" }}
                    className="absolute w-11 h-11 sm:w-16 sm:h-16 rounded-full border border-[#C9982D]/40 bg-[#C9982D]/5"
                  />

                  {/* Main Knot Medallion */}
                  <motion.div
                    animate={reduceMotion ? {} : { scale: isHovered ? 1.08 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#1a2540] border-2 border-[#C9982D] shadow-md flex flex-col items-center justify-center transition-colors duration-300 group-hover:border-[#E8871E]"
                  >
                    <span className="font-serif text-[#F3E5AB] text-sm sm:text-lg font-semibold tracking-wider leading-none">
                      {step.numeral}
                    </span>
                    
                    {/* Glowing Sindoor Dot */}
                    <span
                      className={`block w-1.5 h-1.5 rounded-full mt-1 transition-all duration-300 ${
                        isHovered
                          ? "bg-[#A6193C] shadow-[0_0_8px_#A6193C] scale-125"
                          : "bg-[#C8631C]/80"
                      }`}
                      aria-hidden="true"
                    />
                  </motion.div>
                </div>

                {/* Step Content Card */}
                <motion.div
                  animate={reduceMotion ? {} : { x: isHovered ? 8 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="w-full bg-[#fffdf9] border border-[#1a2540]/8 rounded-2xl p-4 sm:p-7 shadow-[0_4px_20px_-10px_rgba(26,37,64,0.06)] transition-all duration-300 group-hover:border-[#C9982D]/40 group-hover:shadow-[0_12px_30px_-12px_rgba(26,37,64,0.12)] group-hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3 sm:gap-4 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[#A6193C] text-xs font-bold uppercase tracking-[0.2em]">
                        {step.sanskrit}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-500 font-serif italic text-xs">
                        {step.meaning}
                      </span>
                    </div>

                    {/* Microanimation: Expanding ornamental line on card hover */}
                    <span className="h-[1px] w-0 bg-gradient-to-r from-[#C9982D] to-transparent transition-all duration-500 ease-out group-hover:w-12 sm:group-hover:w-20 hidden sm:block" />
                  </div>

                  <h3 className="font-serif font-bold text-[#1a2540] text-lg sm:text-2xl tracking-tight mb-2.5 transition-colors duration-200 group-hover:text-[#C8631C]">
                    {step.title}
                  </h3>

                  <p className="text-gray-600 font-light text-sm sm:text-base leading-relaxed">
                    {step.body}
                  </p>
                </motion.div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}