"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users, UserCheck, UserX, CreditCard, Gift,
  AlertTriangle, Clock, FileText, UserPlus, TrendingUp, BadgeCheck, CalendarHeart,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DashboardStats as Stats } from "@/types";

interface Props {
  stats: Stats | null;
}

const STAT_CARDS = (s: Stats) => [
  {
    label: "Total Users",
    value: formatNumber(s.total_users),
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50/80",
    border: "border-blue-100/80",
    change: "+12%",
    up: true,
  },
  {
    label: "Male Profiles",
    value: formatNumber(s.male_profiles),
    icon: UserCheck,
    color: "text-indigo-600",
    bg: "bg-indigo-50/80",
    border: "border-indigo-100/80",
    href: "/admin/profiles/gallery?gender=male",
  },
  {
    label: "Female Profiles",
    value: formatNumber(s.female_profiles),
    icon: UserCheck,
    color: "text-pink-600",
    bg: "bg-pink-50/80",
    border: "border-pink-100/80",
    href: "/admin/profiles/gallery?gender=female",
  },
  {
    label: "Paid Members",
    value: formatNumber(s.paid_users),
    icon: CreditCard,
    color: "text-emerald-600",
    bg: "bg-emerald-50/80",
    border: "border-emerald-100/80",
    change: "+8%",
    up: true,
  },
  {
    label: "Free Members",
    value: formatNumber(s.free_users),
    icon: Gift,
    color: "text-slate-600",
    bg: "bg-slate-50/80",
    border: "border-slate-200/80",
  },
  {
    label: "Expired Plans",
    value: formatNumber(s.expired_subscriptions),
    icon: UserX,
    color: "text-rose-600",
    bg: "bg-rose-50/80",
    border: "border-rose-100/80",
  },
  {
    label: "Expiring (30d)",
    value: formatNumber(s.expiring_within_30_days),
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50/80",
    border: "border-amber-100/80",
  },
  {
    label: "Pending Review",
    value: formatNumber(s.pending_profiles),
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50/80",
    border: "border-yellow-100/80",
  },
  {
    label: "Verified Profiles",
    value: formatNumber(s.verified_profiles),
    icon: BadgeCheck,
    color: "text-sky-600",
    bg: "bg-sky-50/80",
    border: "border-sky-100/80",
  },
  {
    label: "Total Biodatas",
    value: formatNumber(s.total_biodatas),
    icon: FileText,
    color: "text-purple-600",
    bg: "bg-purple-50/80",
    border: "border-purple-100/80",
  },
  {
    label: "Today's Joins",
    value: formatNumber(s.today_registrations),
    icon: UserPlus,
    color: "text-teal-600",
    bg: "bg-teal-50/80",
    border: "border-teal-100/80",
    change: "Today",
    up: true,
  },
  {
    label: "Completed Meetings",
    value: formatNumber(s.total_completed_match_meetings),
    icon: CalendarHeart,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50/80",
    border: "border-fuchsia-100/80",
  },
  {
    label: "Total Revenue",
    value: formatCurrency(s.total_revenue),
    icon: TrendingUp,
    color: "text-gold-dark",
    bg: "bg-gold/15",
    border: "border-gold/30",
    change: "+15%",
    up: true,
    wide: true,
  },
];

export function DashboardStats({ stats }: Props) {
  // Skeleton Loading State aligned to the new responsive grid
  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 13 }).map((_, i) => (
          <div 
            key={i} 
            className={`p-5 rounded-2xl bg-white border border-gray-100 shadow-2xs space-y-4 animate-pulse ${
              i === 12 ? "col-span-1 sm:col-span-2 xl:col-span-2 2xl:col-span-3" : "col-span-1"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="w-11 h-11 rounded-xl bg-gray-100" />
              <div className="w-12 h-5 rounded-full bg-gray-100" />
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="w-24 h-7 rounded-md bg-gray-100" />
              <div className="w-16 h-3.5 rounded-md bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = STAT_CARDS(stats);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
      {cards.map((card, i) => {
        // Responsive spanning: Revenue spans 2 columns on most desktops, 3 on ultra-wide screens
        const spanClass = card.wide
          ? "col-span-1 sm:col-span-2 xl:col-span-2 2xl:col-span-3"
          : "col-span-1";

        const cardBody = (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03, ease: "easeOut" }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className={`stat-card relative h-full p-5 bg-white rounded-2xl border shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group overflow-hidden ${
              card.border
            } ${
              card.wide ? "bg-gradient-to-br from-white via-white to-amber-50/30 border-amber-200/60" : ""
            } ${card.href ? "cursor-pointer" : ""}`}
          >
            {/* Top Row: Icon & Status Badge */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div
                className={`w-11 h-11 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200`}
              >
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>

              {card.change && (
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shadow-2xs flex items-center gap-0.5 ${
                    card.up
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                      : card.change === "Today"
                      ? "bg-teal-50 text-teal-700 border-teal-200/60"
                      : "bg-rose-50 text-rose-700 border-rose-200/60"
                  }`}
                >
                  {card.change}
                </span>
              )}
            </div>

            {/* Bottom Row: Clean Sans-Serif Metrics & Label */}
            <div className="mt-auto space-y-1">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-sans leading-none">
                {card.value}
              </p>
              
              <div className="flex items-center justify-between pt-1">
                <p className="text-slate-500 font-medium text-xs truncate">
                  {card.label}
                </p>
                
                {card.href && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity">
                    <span>Tap to view</span>
                    <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );

        return card.href ? (
          <Link key={card.label} href={card.href} className={`block h-full ${spanClass}`}>
            {cardBody}
          </Link>
        ) : (
          <div key={card.label} className={`block h-full ${spanClass}`}>
            {cardBody}
          </div>
        );
      })}
    </div>
  );
}