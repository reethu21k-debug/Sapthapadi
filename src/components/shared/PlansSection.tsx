"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { SubscriptionPlanConfig } from "@/types";
import { PLAN_LABELS } from "@/lib/utils";

interface Props {
  plans: SubscriptionPlanConfig[];
}

export function PlansSection({ plans }: Props) {
  const reduceMotion = useReducedMotion() ?? false;

  // Tailwind can't resolve template-string classes at build time, so the
  // column count is picked from a small set of literal class strings that
  // match how many plans actually exist — a fixed xl:grid-cols-5 left a
  // conspicuous empty gap whenever there were only 3 or 4 plans.
  const gridColsClass =
    plans.length >= 5
      ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      : plans.length === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : plans.length === 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : plans.length === 2
      ? "sm:grid-cols-2"
      : "grid-cols-1 max-w-sm mx-auto";

  return (
    <section
      className="relative py-16 sm:py-24 lg:py-36 overflow-hidden"
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
      {/* Ambient decorative background glows — maroon/gold/saffron instead of navy/blue,
        multiple colored orbs are essential for glassmorphism to show refraction/blur */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#C8631C]/15 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#5A0F1D]/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#C9972E]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 lg:mb-24">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-[#C9972E]/30 shadow-sm text-[var(--saffron)] text-[10px] sm:text-[11px] font-medium tracking-[0.15em] sm:tracking-[0.25em] uppercase mb-5">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Sacred Unions</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[var(--maroon)] tracking-tight mb-4 drop-shadow-sm">
              Membership <span className="italic font-light text-[var(--saffron)]">Tiers</span>
            </h2>

            <p className="text-[#2B1B14]/70 text-sm sm:text-lg max-w-xl mx-auto font-light leading-relaxed px-2 sm:px-0">
              Transparent, dignified pricing designed to support your sacred journey. Upgrade or adapt your experience at any time.
            </p>
          </motion.div>
        </div>

        {/* Plans Grid */}
        <div className={`grid grid-cols-1 ${gridColsClass} gap-6 lg:gap-8 items-stretch`}>
          {plans.map((plan, i) => {
            const isPremium = plan.plan === "premium";
            const isVIP = plan.plan === "vip";
            const isHighlighted = isPremium || isVIP;

            return (
              <motion.div
                key={plan.id}
                initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: reduceMotion ? 0 : i * 0.1 }}
                whileHover={reduceMotion ? {} : { y: -6 }}
                className={`relative rounded-3xl p-5 sm:p-7 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
                  isHighlighted
                    ? "bg-[#5A0F1D]/90 text-white border-2 border-[#C9972E]/50 shadow-[0_8px_32px_rgba(90,15,29,0.3)] z-10 lg:scale-[1.02]"
                    : "bg-white/60 text-[var(--maroon)] border border-white/80 shadow-[0_8px_32px_rgba(90,15,29,0.06)] hover:border-white hover:bg-white/70 hover:shadow-[0_8px_32px_rgba(90,15,29,0.1)]"
                }`}
              >
                {/* Top Badge for Highlighted Plans */}
                {isHighlighted && (
                  <div className="absolute -top-3 sm:-top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] px-3 sm:px-4 py-1 rounded-full shadow-[0_4px_12px_rgba(201,151,46,0.35)]">
                    <span className="text-[var(--maroon-deep)] text-[9px] sm:text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 whitespace-nowrap">
                      <Sparkles className="w-3 h-3 fill-current shrink-0" />
                      {isVIP ? "Most Exclusive" : "Most Popular"}
                    </span>
                  </div>
                )}

                <div>
                  {/* Plan Title & Duration */}
                  <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-current/10">
                    <h3
                      className={`font-serif text-xl sm:text-2xl font-bold tracking-tight mb-1 drop-shadow-sm ${
                        isHighlighted ? "text-[var(--gold-light)]" : "text-[var(--maroon)]"
                      }`}
                    >
                      {PLAN_LABELS[plan.plan] || plan.name}
                    </h3>
                    <p
                      className={`text-[11px] sm:text-xs uppercase tracking-wider font-medium ${
                        isHighlighted ? "text-white/70" : "text-[#2B1B14]/60"
                      }`}
                    >
                      {plan.duration_days > 0 ? `${plan.duration_days} Days Access` : "Forever Free"}
                    </p>
                  </div>

                  {/* Price Display */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-baseline gap-1 flex-nowrap">
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight whitespace-nowrap">
                        {plan.price === 0
                          ? "Free"
                          : `₹${plan.price.toLocaleString("en-IN")}`}
                      </span>
                      {plan.price > 0 && (
                        <span
                          className={`text-[11px] sm:text-xs font-light tracking-wide whitespace-nowrap ${
                            isHighlighted ? "text-white/60" : "text-[#2B1B14]/50"
                          }`}
                        >
                          / plan
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] sm:text-xs mt-2 font-medium tracking-wide ${
                        isHighlighted ? "text-[#E9CD8C]/90" : "text-[var(--saffron)]"
                      }`}
                    >
                      {plan.profile_view_limit === null
                        ? "✦ Unlimited profile views"
                        : `✦ Up to ${plan.profile_view_limit} verified views`}
                    </p>
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3 sm:space-y-3.5 mb-6 sm:mb-8">
                    {(plan.features as string[]).map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 rounded-full p-0.5 shrink-0 ${
                            isHighlighted
                              ? "bg-[#C9972E]/20 text-[var(--gold-light)]"
                              : "bg-[#C8631C]/10 text-[var(--saffron)]"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </div>
                        <span
                          className={`text-xs sm:text-sm leading-relaxed font-light ${
                            isHighlighted ? "text-white/90" : "text-[#2B1B14]/75"
                          }`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Link
                  href="/register"
                  className={`w-full block text-center py-3.5 sm:py-4 rounded-xl font-medium text-[11px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.15em] transition-all duration-200 backdrop-blur-md ${
                    isHighlighted
                      ? "bg-gradient-to-r from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] text-[var(--maroon-deep)] font-semibold shadow-[0_4px_15px_rgba(201,151,46,0.35)] hover:shadow-[0_6px_20px_rgba(201,151,46,0.45)] active:scale-[0.99]"
                      : "bg-[#5A0F1D]/90 text-white hover:bg-[var(--maroon)] border border-white/20 shadow-sm active:scale-[0.99]"
                  }`}
                >
                  {plan.price === 0 ? "Begin Free" : "Select Plan"}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-[#2B1B14]/60 text-xs sm:text-sm font-light tracking-wide">
            All tiers include dedicated profile verification. Looking for customized matchmaking assistance?{" "}
            <Link href="#contact" className="text-[var(--saffron)] font-medium underline underline-offset-4 hover:text-[var(--maroon)] transition-colors">
              Speak with a concierge
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}