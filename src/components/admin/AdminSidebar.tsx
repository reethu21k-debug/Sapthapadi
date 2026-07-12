"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, UserCheck, CreditCard, BarChart2,
  Settings, Share2, ClipboardList, ChevronLeft, ChevronRight,
  BadgeDollarSign, CalendarHeart,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { AppUser } from "@/types";
import { useUIStore } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/profiles", icon: Users, label: "Profiles" },
  { href: "/admin/users", icon: UserCheck, label: "Users" },
  { href: "/admin/subscriptions", icon: CreditCard, label: "Subscriptions" },
  { href: "/admin/shared-profiles", icon: Share2, label: "Share Profiles" },
  { href: "/admin/match-meetings", icon: CalendarHeart, label: "Match Meetings" },
  { href: "/admin/plans", icon: BadgeDollarSign, label: "Plans" },
  { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/admin/audit-logs", icon: ClipboardList, label: "Audit Logs" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

interface Props {
  user: AppUser;
}

export function AdminSidebar({ user }: Props) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Desktop: sidebar is always visible, `sidebarOpen` toggles its width
  // between expanded (256) and icon-only (76). Mobile: sidebar is a
  // fixed-width (256) drawer that's either fully off-screen or fully
  // on-screen, controlled by `x`, not width — so the two behaviors never
  // fight over the same properties.
  const width = isDesktop ? (sidebarOpen ? 256 : 76) : 256;
  const x = isDesktop ? 0 : sidebarOpen ? 0 : -280;

  return (
    <>
      {/* Mobile backdrop overlay */}
      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 z-10"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width, x }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-y-0 left-0 lg:relative lg:flex-shrink-0 bg-navy-dark border-r border-white/10 flex flex-col z-20 shadow-xl select-none"
        style={{ minHeight: "100vh" }}
        aria-expanded={sidebarOpen}
      >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-white/10 overflow-hidden">
        <Link 
          href="/admin/dashboard" 
          className="flex items-center gap-3 min-w-0 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded-lg p-1"
        >
          {/* Custom Brand Logo PNG */}
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white/5 border border-gold/30 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 group-hover:border-gold group-hover:bg-gold/10 transition-all duration-200">
            <Image
              src="/logo-icon.png"
              alt="Saptapadi Logo"
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
              priority
            />
          </div>
          
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <p className="font-serif text-white text-base font-bold leading-tight truncate tracking-wide">
                  Saptapadi
                </p>
                <p className="text-gold/60 text-[9px] tracking-[2.5px] font-semibold uppercase">
                  Admin Panel
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {NAV_ITEMS.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          // Add subtle visual separation before system/analytics tools
          const isDivider = index === 7; 

          return (
            <div key={item.href}>
              {isDivider && (
                <div className="my-2.5 border-t border-white/5 mx-2" />
              )}
              <Link
                href={item.href}
                className={cn(
                  "sidebar-item relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-gold/50 group",
                  isActive
                    ? "text-gold sidebar-item-active"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                {/* Smooth active state background glow */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-gold/10 border border-gold/20 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <item.icon 
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-gold" : "text-white/60 group-hover:text-white"
                  )} 
                />

                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate whitespace-nowrap group-hover:translate-x-0.5 transition-transform duration-150"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Collapsed Active Indicator Pill */}
                {isActive && !sidebarOpen && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gold rounded-r-full shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                  />
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User Profile Section - Persists avatar when collapsed */}
      <div className="p-3 border-t border-white/10 bg-black/10">
        <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
          <div 
            className="w-9 h-9 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center flex-shrink-0 shadow-inner"
            title={!sidebarOpen ? `${user.full_name || "Admin"} (${user.email})` : undefined}
          >
            <span className="text-gold text-xs font-bold tracking-wider">
              {getInitials(user.full_name || user.email)}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="min-w-0 flex-1"
              >
                <p className="text-white text-sm font-medium truncate leading-snug">
                  {user.full_name || "Admin"}
                </p>
                <p className="text-white/40 text-xs truncate leading-none mt-0.5">
                  {user.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute -right-3.5 top-18 w-7 h-7 rounded-full bg-navy-dark border border-gold/40 flex items-center justify-center text-gold hover:bg-gold hover:text-navy-dark transition-all duration-200 z-30 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>
      </motion.aside>
    </>
  );
}