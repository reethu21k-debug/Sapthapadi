"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart } from "lucide-react";

// ─── Love Stories ─────────────────────────────────────────────
// Showcases real couple photography (love-18.png / love-19.png,
// each 1085×1450) as a staggered, gold-framed collage — an
// invitation-card treatment rather than a stock hero banner.
// Drop this between the Hero/Testimonials and FAQ sections.

export function LoveStoriesSection() {
  const stats = [
    { value: "2,400+", label: "Matches Made" },
    { value: "18", label: "Years of Trust" },
    { value: "94%", label: "Family Approved" },
  ];

  return (
    <section className="py-24 lg:py-32 bg-[#faf9f6] relative overflow-hidden">
      {/* Ambient warmth in the corner, echoes the Contact section's glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#E8871E]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* ── Text side ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8871E]/10 border border-[#E8871E]/20 text-[#C8631C] text-[11px] font-medium tracking-[0.2em] uppercase mb-4">
              <Sparkles className="w-3 h-3" />
              <span>Real Journeys</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#341014] mb-6 leading-tight">
              Every Forever
              <br />
              Starts With a Story
            </h2>

            <p className="text-gray-600 font-light text-base sm:text-lg leading-relaxed mb-10 max-w-md">
              Behind every match is a family that trusted us, and a couple who
              found each other because of it. These are the moments we work
              for &mdash; rooted in tradition, bound by trust.
            </p>

            <div className="flex flex-wrap gap-x-10 gap-y-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-serif text-3xl font-bold text-[#341014]">
                    {s.value}
                  </p>
                  <p className="text-gray-400 text-xs font-medium tracking-wide uppercase mt-1">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Image collage side ─────────────────────── */}
          <motion.div
            className="relative h-[420px] sm:h-[520px] lg:h-[560px]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {/* Back frame: love-18 */}
            <motion.div
              className="absolute left-0 top-4 w-[58%] sm:w-[54%] aspect-[1085/1450] rounded-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(52,16,20,0.35)] border-4 border-[#fffdf9] rotate-[-4deg]"
              initial={{ opacity: 0, x: -30, rotate: -10 }}
              whileInView={{ opacity: 1, x: 0, rotate: -4 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <img
                src="/Love/love-18.png"
                alt="Couple married through Sapthapadi"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Front frame: love-19, overlapping */}
            <motion.div
              className="absolute right-0 bottom-0 w-[58%] sm:w-[54%] aspect-[1085/1450] rounded-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(52,16,20,0.4)] border-4 border-[#fffdf9] rotate-[3deg]"
              initial={{ opacity: 0, x: 30, rotate: 9 }}
              whileInView={{ opacity: 1, x: 0, rotate: 3 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.35 }}
            >
              <img
                src="/Love/love-19.png"
                alt="Couple who found their forever"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Floating gold tag, the collage's signature element */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 bottom-6 sm:bottom-10 z-10 flex items-center gap-2 bg-[#341014] text-white pl-3 pr-4 py-2.5 rounded-full shadow-xl border border-[#C9982D]/40"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="w-6 h-6 rounded-full bg-[#E8871E]/20 flex items-center justify-center shrink-0">
                <Heart className="w-3 h-3 text-[#F3E5AB] fill-[#F3E5AB]" />
              </div>
              <span className="font-serif text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap">
                Where traditions connect
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}