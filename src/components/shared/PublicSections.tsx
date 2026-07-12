"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, ChevronDown, Phone, Mail, MapPin, Sparkles } from "lucide-react";
import { Testimonial, FAQ } from "@/types";

// ─── Testimonials ─────────────────────────────────────────────

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className="py-24 lg:py-32 bg-[#fffdf9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8871E]/10 border border-[#E8871E]/20 text-[#C8631C] text-[11px] font-medium tracking-[0.2em] uppercase mb-4">
            <Sparkles className="w-3 h-3" />
            <span>Testimonials</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#341014]">
            What Families Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              className="bg-white border border-[#341014]/10 rounded-2xl p-7 shadow-[0_8px_30px_-12px_rgba(52,16,20,0.08)] flex flex-col justify-between"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`w-4 h-4 ${j < t.rating ? "text-[#C9982D] fill-[#C9982D]" : "text-gray-200"}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-sm font-light leading-relaxed mb-6 italic">
                  &ldquo;{t.content}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#341014]/5">
                {t.image_url ? (
                  <img
                    src={t.image_url}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#C9982D]/40 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#E8871E]/10 border border-[#C9982D]/40 flex items-center justify-center shrink-0">
                    <span className="text-[#C8631C] font-serif font-bold text-sm">
                      {t.name[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-serif font-semibold text-[#341014] text-sm leading-snug">{t.name}</p>
                  {t.location && (
                    <p className="text-gray-400 font-light text-xs">{t.location}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────

export function FAQSection({ faqs }: { faqs: FAQ[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="py-24 lg:py-32 bg-[#faf9f6] border-t border-b border-[#341014]/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8871E]/10 border border-[#E8871E]/20 text-[#C8631C] text-[11px] font-medium tracking-[0.2em] uppercase mb-4">
            <Sparkles className="w-3 h-3" />
            <span>Clarity & Guidance</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#341014]">
            Common Questions
          </h2>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <motion.div
                key={faq.id}
                className="bg-[#fffdf9] border border-[#341014]/10 rounded-2xl overflow-hidden shadow-sm transition-all"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-[#341014]/[0.02]"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                >
                  <span className="font-serif font-semibold text-[#341014] pr-4 text-base">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#C8631C] shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 border-t border-[#341014]/5">
                    <p className="text-gray-600 font-light text-sm leading-relaxed pt-2">{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────

export function ContactSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#341014] relative overflow-hidden" id="contact">
      {/* Subtle ambient gradient glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#C8631C]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8871E]/15 border border-[#E8871E]/30 text-[#F3E5AB] text-[11px] font-medium tracking-[0.2em] uppercase mb-6">
              <Sparkles className="w-3 h-3" />
              <span>Personal Concierge</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6 leading-tight">
              We&apos;re Here to Help
            </h2>
            <p className="text-white/70 font-light text-base sm:text-lg leading-relaxed mb-10 max-w-md">
              Have questions about membership or need bespoke assistance finding the perfect match? Our dedicated team is ready to guide you.
            </p>

            <div className="space-y-6">
              {[
                { 
                  icon: Phone, 
                  label: "Phone Support", 
                  value: "9440733232",
                  href: "tel:9440733232"
                },
                { 
                  icon: Mail, 
                  label: "Confidential Email", 
                  value: "contact.sapathapadiatp@gmail.com",
                  href: "mailto:contact.sapathapadiatp@gmail.com"
                },
                { 
                  icon: MapPin, 
                  label: "Concierge Desk", 
                  value: "Ananthapur, Andhra Pradesh, India",
                  // Making the location an actual link stops iOS from forcing it blue, 
                  // while being genuinely helpful if clicked.
                  href: "https://www.google.com/maps/search/?api=1&query=Ananthapur,+Andhra+Pradesh,+India"
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-[#F3E5AB]" />
                  </div>
                  <div>
                    <p className="text-white/50 uppercase tracking-wider text-[10px] font-semibold mb-0.5">{item.label}</p>
                    <a 
                      href={item.href}
                      target={item.icon === MapPin ? "_blank" : undefined}
                      rel={item.icon === MapPin ? "noopener noreferrer" : undefined}
                      className="text-white font-medium text-sm transition-colors hover:text-[#C8631C] decoration-transparent outline-none"
                    >
                      {item.value}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-7 sm:p-9 shadow-2xl">
            <h3 className="font-serif text-2xl font-bold text-white mb-6">Send us a Message</h3>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 uppercase tracking-wider text-[11px] font-semibold mb-1.5 block">First Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8631C] transition-all"
                    placeholder="Arjun"
                  />
                </div>
                <div>
                  <label className="text-white/70 uppercase tracking-wider text-[11px] font-semibold mb-1.5 block">Last Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8631C] transition-all"
                    placeholder="Reddy"
                  />
                </div>
              </div>
              <div>
                <label className="text-white/70 uppercase tracking-wider text-[11px] font-semibold mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  className="w-full bg-black/30 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8631C] transition-all"
                  placeholder="arjun@example.com"
                />
              </div>
              <div>
                <label className="text-white/70 uppercase tracking-wider text-[11px] font-semibold mb-1.5 block">Message</label>
                <textarea
                  rows={4}
                  className="w-full bg-black/30 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8631C] resize-none transition-all"
                  placeholder="Tell us how we can help..."
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-[#341014] font-bold text-xs uppercase tracking-[0.2em] py-4 rounded-xl shadow-lg hover:opacity-95 active:scale-[0.99] transition-all duration-200"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}