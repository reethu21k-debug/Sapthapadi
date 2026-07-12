"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { 
  Flame, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Youtube, 
  Globe, 
  MapPin, 
  Phone, 
  Mail 
} from "lucide-react";
import { siteConfig } from "@/lib/seo/config";

// Maps a sameAs URL's hostname to a display icon. Falls back to a generic
// globe icon for any platform not explicitly listed here.
function iconForUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("instagram.com")) return Instagram;
    if (host.includes("facebook.com")) return Facebook;
    if (host.includes("linkedin.com")) return Linkedin;
    if (host.includes("twitter.com") || host.includes("x.com")) return Twitter;
    if (host.includes("youtube.com")) return Youtube;
  } catch {
    // Malformed URL — fall through to the default icon below.
  }
  return Globe;
}

// The seven vows exchanged around the sacred fire — the ritual the platform is named for.
// (Wording is a common stylized rendering; traditions vary in exact order and phrasing.)
const STEPS = [
  { label: "Anna", meaning: "Nourishment" },
  { label: "Bala", meaning: "Strength" },
  { label: "Dhana", meaning: "Prosperity" },
  { label: "Sukha", meaning: "Happiness" },
  { label: "Praja", meaning: "Family" },
  { label: "Ritu", meaning: "Harmony" },
  { label: "Sakhya", meaning: "Friendship" },
] as const;

const EXPLORE_LINKS: [string, string][] = [
  ["Home", "/"],
  ["About us", "/about"],
  ["Membership plans", "/plans"],
  ["Success stories", "/success-stories"],
];

const ACCOUNT_LINKS: [string, string][] = [
  ["Create profile", "/register"],
  ["Sign in", "/login"],
  ["Privacy policy", "/privacy"],
  ["Terms of service", "/terms"],
  ["Refund policy", "/refunds"],
];

function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-2 rounded-sm text-[13.5px] text-[#F7EFE1]/60 transition-colors duration-300 hover:text-[#C9982D] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C9982D]/60"
      >
        <span className="h-px w-0 bg-[#C9982D] transition-all duration-300 group-hover:w-3" />
        {label}
      </Link>
    </li>
  );
}

export function PublicFooter() {
  const year = new Date().getFullYear();
  const reduceMotion = useReducedMotion();

  const fadeUp = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.6, delay, ease: "easeOut" as const },
        };

  return (
    <footer className="relative overflow-hidden bg-[#341014]">
      {/* Single hairline instead of blurred glow circles — one restrained accent, not decoration everywhere */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C9982D]/60 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-12 lg:gap-8">
          {/* Brand column */}
          <motion.div {...fadeUp()} className="md:col-span-12 lg:col-span-4 lg:pr-8">
            <div className="mb-6 flex w-fit items-center gap-4">
              <div className="relative h-14 w-14 flex-shrink-0">
                <Image src="/logo-icon.png" alt="Saptapadi" fill className="object-contain" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-serif text-3xl font-semibold leading-none tracking-wide text-[#F7EFE1]">
                  Saptapadi
                </span>
                <span className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.25em] text-[#C9982D]/80">
                  Hindu matrimony
                </span>
              </div>
            </div>

            <p className="mb-10 max-w-md text-sm leading-relaxed text-[#F7EFE1]/60 font-light">
              Matrimony built the way families actually search — verified profiles,
              shared values, and a process that respects how big this decision is.
            </p>

            {/* Signature element: the seven steps taken around the sacred fire */}
            <div>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[#F7EFE1]/40">
                सप्तपदी — the seven steps
              </p>
              <div className="flex items-center">
                {STEPS.map((step, i) => {
                  const isLast = i === STEPS.length - 1;
                  return (
                    <div key={step.label} className="flex items-center">
                      <div className="group/step relative flex flex-col items-center">
                        <button
                          type="button"
                          aria-label={`${step.label} — ${step.meaning}`}
                          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9982D]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#341014] ${
                            isLast
                              ? "border-[#C9982D] bg-[#C9982D]/10"
                              : "border-[#F7EFE1]/20 bg-transparent group-hover/step:border-[#C9982D]/60 group-focus-within/step:border-[#C9982D]/60"
                          }`}
                        >
                          <Flame
                            className={`h-3.5 w-3.5 transition-colors duration-300 ${
                              isLast
                                ? "text-[#C9982D]"
                                : "text-[#F7EFE1]/45 group-hover/step:text-[#C9982D] group-focus-within/step:text-[#C9982D]"
                            }`}
                            strokeWidth={1.75}
                          />
                          {isLast && !reduceMotion && (
                            <motion.span
                              aria-hidden="true"
                              className="absolute inset-0 rounded-full border border-[#C9982D]/50"
                              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                            />
                          )}
                        </button>

                        <div
                          role="tooltip"
                          className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-[#F7EFE1] px-2.5 py-1.5 text-[11px] font-medium text-[#341014] opacity-0 transition-all duration-200 group-hover/step:translate-y-0 group-hover/step:opacity-100 group-focus-within/step:translate-y-0 group-focus-within/step:opacity-100 shadow-xl z-20"
                        >
                          {step.label} · {step.meaning}
                        </div>
                      </div>

                      {!isLast && <div className="h-px w-3 bg-[#F7EFE1]/15 sm:w-5" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div {...fadeUp(0.1)} className="md:col-span-12 lg:col-span-3">
            <h4 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F7EFE1]/40">
              Contact Us
            </h4>
            <ul className="space-y-4 font-light">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 shrink-0 text-[#C9982D] mt-0.5" />
                <span className="text-[13.5px] text-[#F7EFE1]/60">Ananthapur, Andhra Pradesh, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-[#C9982D]" />
                <a 
                  href="tel:9440733232" 
                  className="text-[13.5px] text-[#F7EFE1]/60 transition-colors duration-300 hover:text-[#C9982D] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C9982D]/60 rounded-sm"
                >
                  9440733232
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-[#C9982D]" />
                <a 
                  href="mailto:contact.sapathapadiatp@gmail.com" 
                  className="text-[13.5px] text-[#F7EFE1]/60 transition-colors duration-300 hover:text-[#C9982D] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C9982D]/60 rounded-sm break-all"
                >
                  contact.sapathapadiatp@gmail.com
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Explore links */}
          <motion.div {...fadeUp(0.2)} className="md:col-span-6 lg:col-span-2">
            <h4 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F7EFE1]/40">
              Explore
            </h4>
            <ul className="space-y-4 font-light">
              {EXPLORE_LINKS.map(([label, href]) => (
                <FooterLink key={label} label={label} href={href} />
              ))}
            </ul>
          </motion.div>

          {/* Account & policies */}
          <motion.div {...fadeUp(0.3)} className="md:col-span-6 lg:col-span-3">
            <h4 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F7EFE1]/40">
              Account &amp; policies
            </h4>
            <ul className="space-y-4 font-light">
              {ACCOUNT_LINKS.map(([label, href]) => (
                <FooterLink key={label} label={label} href={href} />
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Social profile links */}
        {siteConfig.sameAs.length > 0 && (
          <div className="mt-12 flex items-center justify-center gap-3">
            {siteConfig.sameAs.map((url) => {
              const Icon = iconForUrl(url);
              let label = "Saptapadi on social media";
              try {
                label = `Saptapadi on ${new URL(url).hostname.replace(/^www\./, "").split(".")[0]}`;
              } catch {
                // Keep generic label for malformed URLs.
              }
              return (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F7EFE1]/15 text-[#F7EFE1]/60 transition-colors duration-300 hover:border-[#C9982D]/60 hover:text-[#C9982D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9982D]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#341014]"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </a>
              );
            })}
          </div>
        )}

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#F7EFE1]/10 pt-8 md:flex-row">
          <p className="text-xs text-[#F7EFE1]/35 font-light tracking-wide">
            © {year} Saptapadi Matrimony. All rights reserved.
          </p>
          <p className="text-xs text-[#F7EFE1]/35 font-light tracking-wide">
            Uniting families, one union at a time.
          </p>
        </div>
      </div>
    </footer>
  );
}