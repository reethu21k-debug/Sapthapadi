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

  return (
    <section className="relative py-24 lg:py-36 bg-[#faf9f6] overflow-hidden">
      {/* Ambient decorative background glows 
        Multiple colored orbs are essential for glassmorphism to show refraction/blur
      */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#E8871E]/15 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#1a2540]/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#C9982D]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-sm text-[#C8631C] text-[11px] font-medium tracking-[0.25em] uppercase mb-5">
              <Sparkles className="w-3 h-3" />
              <span>Sacred Unions</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1a2540] tracking-tight mb-4 drop-shadow-sm">
              Membership <span className="italic font-light text-[#C8631C]">Tiers</span>
            </h2>

            <p className="text-gray-700 text-base sm:text-lg max-w-xl mx-auto font-light leading-relaxed">
              Transparent, dignified pricing designed to support your sacred journey. Upgrade or adapt your experience at any time.
            </p>
          </motion.div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8 items-stretch">
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
                className={`relative rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
                  isHighlighted
                    ? "bg-[#1a2540]/85 text-white border-2 border-[#C9982D]/50 shadow-[0_8px_32px_rgba(26,37,64,0.25)] z-10 scale-[1.02]"
                    : "bg-white/60 text-[#1a2540] border border-white/80 shadow-[0_8px_32px_rgba(31,38,135,0.07)] hover:border-white hover:bg-white/70 hover:shadow-[0_8px_32px_rgba(31,38,135,0.12)]"
                }`}
              >
                {/* Top Badge for Highlighted Plans */}
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] px-4 py-1 rounded-full shadow-[0_4px_12px_rgba(212,175,55,0.3)]">
                    <span className="text-[#1a2540] text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 whitespace-nowrap">
                      <Sparkles className="w-3 h-3 fill-current" />
                      {isVIP ? "Most Exclusive" : "Most Popular"}
                    </span>
                  </div>
                )}

                <div>
                  {/* Plan Title & Duration */}
                  <div className="mb-6 pb-6 border-b border-current/10">
                    <h3
                      className={`font-serif text-2xl font-bold tracking-tight mb-1 drop-shadow-sm ${
                        isHighlighted ? "text-[#F3E5AB]" : "text-[#1a2540]"
                      }`}
                    >
                      {PLAN_LABELS[plan.plan] || plan.name}
                    </h3>
                    <p
                      className={`text-xs uppercase tracking-wider font-medium ${
                        isHighlighted ? "text-white/70" : "text-gray-600/80"
                      }`}
                    >
                      {plan.duration_days > 0 ? `${plan.duration_days} Days Access` : "Forever Free"}
                    </p>
                  </div>

                  {/* Price Display */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-serif font-bold tracking-tight">
                        {plan.price === 0
                          ? "Free"
                          : `₹${plan.price.toLocaleString("en-IN")}`}
                      </span>
                      {plan.price > 0 && (
                        <span
                          className={`text-xs font-light tracking-wide ${
                            isHighlighted ? "text-white/60" : "text-gray-500"
                          }`}
                        >
                          / plan
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs mt-2 font-medium tracking-wide ${
                        isHighlighted ? "text-[#F3E5AB]/90" : "text-[#C8631C]"
                      }`}
                    >
                      {plan.profile_view_limit === null
                        ? "✦ Unlimited profile views"
                        : `✦ Up to ${plan.profile_view_limit} verified views`}
                    </p>
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3.5 mb-8">
                    {(plan.features as string[]).map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 rounded-full p-0.5 shrink-0 ${
                            isHighlighted
                              ? "bg-[#D4AF37]/20 text-[#F3E5AB]"
                              : "bg-[#C8631C]/10 text-[#C8631C]"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </div>
                        <span
                          className={`text-xs sm:text-sm leading-relaxed font-light ${
                            isHighlighted ? "text-white/90" : "text-gray-700"
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
                  className={`w-full block text-center py-4 rounded-xl font-medium text-xs uppercase tracking-[0.15em] transition-all duration-200 backdrop-blur-md ${
                    isHighlighted
                      ? "bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-[#1a2540] font-semibold shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.4)] active:scale-[0.99]"
                      : "bg-[#1a2540]/80 text-white hover:bg-[#1a2540] border border-white/20 shadow-sm active:scale-[0.99]"
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
          <p className="text-gray-600 text-xs sm:text-sm font-light tracking-wide">
            All tiers include dedicated profile verification. Looking for customized matchmaking assistance?{" "}
            <Link href="#contact" className="text-[#C8631C] font-medium underline underline-offset-4 hover:text-[#1a2540] transition-colors">
              Speak with a concierge
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}