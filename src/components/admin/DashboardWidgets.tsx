"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, Share2, CreditCard, Settings, ChevronRight, Activity, TrendingUp, Calendar } from "lucide-react";
import { AuditLog } from "@/types";
import { formatRelativeTime, titleCase } from "@/lib/utils";

// ─── Revenue Chart ─────────────────────────────────────────────

interface RevenueChartProps {
  data: { month: string; revenue: number; count: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [range, setRange] = useState<7 | 12>(7);
  const chartData = data.slice(-range);
  const hasRevenue = chartData.some((d) => d.revenue > 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="luxury-card p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between h-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold" />
            <h3 className="font-serif font-bold text-navy-dark text-xl tracking-tight">
              Revenue Overview
            </h3>
          </div>
          <p className="text-gray-400 text-xs font-medium mt-1">
            Monthly subscription revenue performance
          </p>
        </div>

        {/* Custom Styled Select Dropdown */}
        <div className="relative">
          <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value) as 7 | 12)}
            className="appearance-none pl-8 pr-8 py-1.5 text-xs font-semibold border border-gray-200/80 rounded-xl bg-gray-50/50 text-gray-700 hover:bg-gray-100/50 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all cursor-pointer shadow-2xs"
          >
            <option value={7}>Last 7 months</option>
            <option value={12}>Last 12 months</option>
          </select>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
        </div>
      </div>

      {hasRevenue ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barSize={32} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} strokeOpacity={0.8} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#64748B", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              cursor={{ fill: "rgba(212, 175, 55, 0.06)" }}
              contentStyle={{
                background: "#1E1810",
                border: "1px solid rgba(212,175,55,0.4)",
                borderRadius: 12,
                color: "#FAF6EF",
                fontSize: 12,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
              }}
              formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
            />
            <Bar
              dataKey="revenue"
              radius={[6, 6, 0, 0]}
              fill="url(#goldGradient)"
            />
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F4D78C" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[240px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200/80 rounded-2xl bg-gray-50/40">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5 text-gold-dark" />
          </div>
          <p className="text-navy-dark font-semibold text-sm">No Revenue Recorded</p>
          <p className="text-gray-400 text-xs mt-0.5 max-w-xs">
            There are no subscription transactions logged for the selected billing period.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Quick Actions ─────────────────────────────────────────────

interface QuickActionsProps {
  pendingCount: number;
}

const ACTIONS = [
  {
    href: "/admin/profiles/create",
    icon: UserPlus,
    label: "Add Profile",
    desc: "Create a new matrimonial profile",
    color: "text-blue-600",
    bg: "bg-blue-50/80",
    border: "border-blue-100/80",
  },
  {
    href: "/admin/shared-profiles",
    icon: Share2,
    label: "Share Profiles",
    desc: "Share profiles with members",
    color: "text-purple-600",
    bg: "bg-purple-50/80",
    border: "border-purple-100/80",
  },
  {
    href: "/admin/subscriptions",
    icon: CreditCard,
    label: "Add Subscription",
    desc: "Manage member subscriptions",
    color: "text-emerald-600",
    bg: "bg-emerald-50/80",
    border: "border-emerald-100/80",
  },
  {
    href: "/admin/settings",
    icon: Settings,
    label: "Site Settings",
    desc: "Configure platform settings",
    color: "text-gold-dark",
    bg: "bg-gold/15",
    border: "border-gold/30",
  },
];

export function QuickActions({ pendingCount }: QuickActionsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif font-bold text-navy-dark text-lg tracking-tight">
          Quick Actions
        </h3>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {pendingCount} pending review
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACTIONS.map((action, i) => (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
          >
            <Link
              href={action.href}
              className={`luxury-card p-4 bg-white rounded-2xl border ${action.border} flex items-center justify-between gap-3 shadow-2xs hover:shadow-md transition-all duration-200 group relative overflow-hidden`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div 
                  className={`w-11 h-11 rounded-xl ${action.bg} border ${action.border} flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200`}
                >
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-navy-dark text-sm group-hover:text-gold-dark transition-colors truncate">
                    {action.label}
                  </p>
                  <p className="text-gray-400 text-xs truncate mt-0.5">
                    {action.desc}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Recent Activity ───────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  profile_created: "bg-blue-50 text-blue-700 border-blue-200/60",
  profile_approved: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  profile_rejected: "bg-rose-50 text-rose-700 border-rose-200/60",
  subscription_created: "bg-purple-50 text-purple-700 border-purple-200/60",
  biodata_generated: "bg-gold/15 text-gold-dark border-gold/30",
  profile_shared: "bg-teal-50 text-teal-700 border-teal-200/60",
  login: "bg-slate-50 text-slate-600 border-slate-200/60",
};

interface RecentActivityProps {
  logs: AuditLog[];
}

export function RecentActivity({ logs }: RecentActivityProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="luxury-card bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col h-full"
    >
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gold" />
          <h3 className="font-serif font-bold text-navy-dark text-lg tracking-tight">
            Recent Activity
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-150">
          Live Audit Feed
        </span>
      </div>

      <div className="p-5 flex-1 overflow-y-auto max-h-[340px] custom-scrollbar">
        {logs.length > 0 ? (
          <div className="relative space-y-4 before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-5 flex items-start justify-between gap-3 group">
                {/* Timeline Dot Indicator */}
                <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-300 group-hover:border-gold transition-colors" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-navy-dark text-xs truncate">
                      {log.actor_name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                      ACTION_COLORS[log.action] || "bg-gray-50 text-gray-600 border-gray-200"
                    }`}>
                      {titleCase(log.action.replace(/_/g, " "))}
                    </span>
                  </div>
                  
                  {log.entity_name && (
                    <p className="text-gray-500 text-xs mt-1 truncate">
                      Target: <span className="font-medium text-gray-700">{log.entity_name}</span>
                    </p>
                  )}
                </div>

                <span className="text-gray-400 text-[10px] font-medium whitespace-nowrap pt-0.5">
                  {formatRelativeTime(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[220px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-200/80 rounded-2xl bg-gray-50/40">
            <Activity className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-navy-dark font-semibold text-sm">No Audit Logs Yet</p>
            <p className="text-gray-400 text-xs mt-0.5">
              System actions and user updates will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}