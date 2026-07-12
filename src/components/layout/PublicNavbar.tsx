"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight, LayoutDashboard, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/plans", label: "Membership" },
  { href: "/success-stories", label: "Success Stories" },
  { href: "/about", label: "About" },
  { href: "#contact", label: "Contact" },
];

// Harmonized Color Palette
const GOLD = "#C9972E";
const GOLD_LIGHT = "#E9CD8C";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

type NavAuthState = "loading" | "guest" | "user" | "admin";

function useAuthNav(): NavAuthState {
  const [state, setState] = useState<NavAuthState>("loading");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const resolveRole = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (cancelled) return;
        if (userError || !user) {
          setState("guest");
          return;
        }

        const { data: userData, error: dbError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
          
        if (cancelled) return;
        if (dbError) {
          setState("user");
          return;
        }
        
        setState(userData?.role === "admin" ? "admin" : "user");
      } catch (err) {
        if (!cancelled) setState("guest");
      }
    };

    resolveRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      resolveRole();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function PublicNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(pathname);
  
  const reducedMotion = useReducedMotion();
  const authState = useAuthNav();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && mobileOpen) {
      setMobileOpen(false);
    }
  }, [mobileOpen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [mobileOpen]);

  useEffect(() => {
    setHoveredPath(pathname);
    setMobileOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        scrolled
          ? "bg-[#FBF3E6]/95 backdrop-blur-lg shadow-[0_8px_30px_rgba(58,10,19,0.06)] border-b border-[#C9972E]/20 py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 transition-all duration-300">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9972E] rounded-xl p-1 -ml-1">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 rounded-full"
                style={{ background: `radial-gradient(circle, ${GOLD_LIGHT}60 0%, transparent 70%)` }}
                animate={
                  reducedMotion
                    ? { opacity: 0.5 }
                    : { opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }
                }
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative w-full h-full transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) group-hover:scale-105">
                <Image
                  src="/logo-icon.png"
                  alt="Saptapadi Emblem"
                  fill
                  sizes="48px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#5A0F1D] block leading-none tracking-wide">
                Saptapadi
              </span>
              <span className="text-[#C9972E] text-[8.5px] sm:text-[10px] tracking-[0.2em] uppercase font-semibold mt-1">
                Vivaha Parichaya Vedika
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div
            className="hidden md:flex items-center gap-2 lg:gap-4"
            onMouseLeave={() => setHoveredPath(pathname)}
          >
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const isHighlighted = link.href === hoveredPath;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredPath(link.href)}
                  onFocus={() => setHoveredPath(link.href)}
                  className={`relative px-4 py-2 text-[14px] transition-colors duration-300 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9972E] ${
                    isActive ? "text-[#5A0F1D] font-bold" : "text-[#2B1B14]/75 font-medium hover:text-[#5A0F1D]"
                  }`}
                >
                  {link.label}
                  {isHighlighted && (
                    <motion.div
                      layoutId="nav-thread"
                      className="absolute left-4 right-4 -bottom-0.5 h-[2px] rounded-full"
                      style={{ background: `linear-gradient(90deg, transparent, ${GOLD} 20%, ${GOLD} 80%, transparent)` }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                      <span className="absolute -left-0.5 -top-[1.5px] w-1 h-1 rounded-full bg-[#C9972E]" />
                      <span className="absolute -right-0.5 -top-[1.5px] w-1 h-1 rounded-full bg-[#C9972E]" />
                    </motion.div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-4 min-w-[200px] justify-end">
            {authState === "loading" ? (
              <div className="w-36 h-10 rounded-full bg-[#5A0F1D]/5 animate-pulse" aria-hidden="true" />
            ) : authState === "admin" ? (
              <Link
                href="/admin/dashboard"
                className="group flex items-center gap-2 bg-gradient-to-b from-[#5A0F1D] to-[#3A0A13] text-white py-2.5 px-6 text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9972E]"
              >
                <ShieldCheck className="w-4 h-4 text-[#E9CD8C] group-hover:scale-110 transition-transform" />
                Admin Panel
              </Link>
            ) : authState === "user" ? (
              <Link
                href="/user/dashboard"
                className="group flex items-center gap-2 bg-gradient-to-b from-[#5A0F1D] to-[#3A0A13] text-white py-2.5 px-6 text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9972E]"
              >
                <LayoutDashboard className="w-4 h-4 text-[#E9CD8C] group-hover:scale-110 transition-transform" />
                My Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[#5A0F1D]/80 hover:text-[#5A0F1D] text-sm font-semibold transition-colors px-3 py-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9972E]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="relative overflow-hidden bg-gradient-to-b from-[#5A0F1D] to-[#3A0A13] text-white py-2.5 px-7 text-sm font-semibold rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(90,15,29,0.2)] hover:shadow-[0_6px_16px_rgba(90,15,29,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9972E]"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden relative p-2 text-[#5A0F1D] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9972E] active:bg-[#5A0F1D]/5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
          >
            <motion.div animate={{ rotate: mobileOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 top-[60px] bg-[#3A0A13]/30 backdrop-blur-sm z-40"
              aria-hidden="true"
            />

            <motion.div
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
              className="md:hidden fixed top-[60px] left-0 right-0 max-h-[calc(100vh-60px)] bg-[#FBF3E6] border-b border-[#C9972E]/20 overflow-y-auto pb-8 shadow-[0_20px_40px_rgba(58,10,19,0.15)] z-50 rounded-b-3xl"
            >
              <svg aria-hidden="true" className="absolute -top-10 -right-10 w-72 h-72 opacity-5 pointer-events-none text-[#5A0F1D]" viewBox="0 0 200 200">
                <path d="M100 20c40 0 60 30 55 65-4 28-30 40-30 65 0 15 12 22 25 20-10 20-38 25-55 10-18-16-16-42-5-60 10-17 25-28 22-50-3-20-20-32-40-30-25 2-40 25-35 50 4 20 20 30 15 45C40 155 20 130 20 100 20 55 55 20 100 20z" fill="currentColor" />
              </svg>

              <div className="relative px-5 py-6 flex flex-col min-h-full">
                <nav className="space-y-1.5" aria-label="Mobile links">
                  {NAV_LINKS.map((link, i) => {
                    const isActive = pathname === link.href;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                      >
                        <Link
                          href={link.href}
                          className={`flex items-center justify-between p-4 rounded-2xl text-[15px] font-serif transition-all ${
                            isActive
                              ? "bg-[#C9972E]/10 text-[#5A0F1D] font-bold border border-[#C9972E]/20 shadow-sm"
                              : "text-[#2B1B14]/80 font-medium hover:bg-[#5A0F1D]/5 hover:text-[#5A0F1D]"
                          }`}
                          onClick={() => setMobileOpen(false)}
                        >
                          <span>{link.label}</span>
                          <ChevronRight className={`w-4 h-4 transition-colors ${isActive ? "text-[#C9972E]" : "opacity-40"}`} />
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="space-y-3 mt-8"
                >
                  {authState === "loading" ? (
                    <div className="w-full h-14 rounded-2xl bg-[#5A0F1D]/5 animate-pulse" aria-hidden="true" />
                  ) : authState === "admin" ? (
                    <Link
                      href="/admin/dashboard"
                      className="bg-gradient-to-b from-[#5A0F1D] to-[#3A0A13] text-white flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[13px] tracking-widest uppercase w-full transition-transform active:scale-[0.98] shadow-md"
                      onClick={() => setMobileOpen(false)}
                    >
                      <ShieldCheck className="w-4 h-4 text-[#E9CD8C]" /> Admin Panel
                    </Link>
                  ) : authState === "user" ? (
                    <Link
                      href="/user/dashboard"
                      className="bg-gradient-to-b from-[#5A0F1D] to-[#3A0A13] text-white flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[13px] tracking-widest uppercase w-full transition-transform active:scale-[0.98] shadow-md"
                      onClick={() => setMobileOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#E9CD8C]" /> My Dashboard
                    </Link>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/login"
                        className="flex items-center justify-center py-3.5 rounded-2xl border-2 border-[#5A0F1D]/20 text-[#5A0F1D] font-bold text-[13px] tracking-widest uppercase transition-colors hover:bg-[#5A0F1D]/5 active:scale-[0.98]"
                        onClick={() => setMobileOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="bg-gradient-to-b from-[#5A0F1D] to-[#3A0A13] text-white flex items-center justify-center py-3.5 rounded-2xl font-bold text-[13px] tracking-widest uppercase transition-transform active:scale-[0.98] shadow-md"
                        onClick={() => setMobileOpen(false)}
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}