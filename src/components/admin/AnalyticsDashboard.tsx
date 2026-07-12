"use client";

import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { motion } from "framer-motion";
import { DollarSign, Users, Award, FileText, TrendingUp } from "lucide-react";
import { DashboardStats } from "@/types";
import { formatCurrency, PLAN_LABELS } from "@/lib/utils";

const CHART_COLORS = ["#D4AF37", "#5A0F1D", "#F4D78C", "#2A0A0F", "#B8860B"];

interface Props {
  stats: DashboardStats | null;
  revenueByMonth: { month: string; revenue: number; count: number }[];
  planDistribution: { plan: string; count: number }[];
}

export function AnalyticsDashboard({ stats, revenueByMonth, planDistribution }: Props) {
  const planData = planDistribution.map((d) => ({
    name: PLAN_LABELS[d.plan] || d.plan,
    value: d.count,
  }));

  const genderData = [
    { name: "Male", value: stats?.male_profiles || 0 },
    { name: "Female", value: stats?.female_profiles || 0 },
  ];

  const membershipData = [
    { name: "Paid", value: stats?.paid_users || 0 },
    { name: "Free", value: stats?.free_users || 0 },
    { name: "Expired", value: stats?.expired_subscriptions || 0 },
  ];

  const metrics = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats?.total_revenue || 0),
      sub: "All time earnings",
      icon: DollarSign,
      accent: "from-gold/20 to-gold/5 border-gold/30 text-gold-dark",
    },
    {
      label: "Total Users",
      value: stats?.total_users || 0,
      sub: "Registered accounts",
      icon: Users,
      accent: "from-navy/10 to-navy/5 border-navy/20 text-navy-dark",
    },
    {
      label: "Paid Members",
      value: stats?.paid_users || 0,
      sub: "Active subscriptions",
      icon: Award,
      accent: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-700",
    },
    {
      label: "Biodatas Generated",
      value: stats?.total_biodatas || 0,
      sub: "Total exports created",
      icon: FileText,
      accent: "from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-700",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {metrics.map((m, idx) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.07 }}
            className="luxury-card relative p-6 overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group bg-white rounded-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 font-medium text-xs tracking-wider uppercase">
                  {m.label}
                </p>
                <p className="text-3xl font-serif font-bold text-navy-dark mt-2 tracking-tight">
                  {m.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br border ${m.accent} shadow-2xs group-hover:scale-110 transition-transform duration-200`}>
                <m.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-gray-100/80">
              <TrendingUp className="w-3.5 h-3.5 text-gold" />
              <p className="text-gray-400 text-xs font-medium">{m.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Monthly Revenue Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="luxury-card p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="font-serif font-bold text-navy-dark text-xl">
              Monthly Revenue
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Financial performance over the past billing cycles
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-gold/10 text-gold-dark rounded-full border border-gold/20 w-fit">
            <span>Billing Overview</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueByMonth} barSize={36} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
              }}
              formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
            />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="url(#goldGradient)" />
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F4D78C" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Distribution Pie Charts */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Plan Distribution */}
        <div className="luxury-card p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-navy-dark text-base">Plan Distribution</h3>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">Breakdown by active tier</p>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie 
                data={planData} 
                cx="50%" 
                cy="45%" 
                innerRadius={55} 
                outerRadius={80} 
                dataKey="value" 
                paddingAngle={4}
              >
                {planData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1E1810", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 8, color: "#FAF6EF", fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Split */}
        <div className="luxury-card p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-navy-dark text-base">Gender Split</h3>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">Profile demographics</p>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie 
                data={genderData} 
                cx="50%" 
                cy="45%" 
                innerRadius={55} 
                outerRadius={80} 
                dataKey="value" 
                paddingAngle={4}
              >
                <Cell fill="#5A0F1D" stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                <Cell fill="#D4AF37" stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
              </Pie>
              <Tooltip contentStyle={{ background: "#1E1810", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 8, color: "#FAF6EF", fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Membership Status */}
        <div className="luxury-card p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-navy-dark text-base">Membership Status</h3>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">Conversion and retention</p>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie 
                data={membershipData} 
                cx="50%" 
                cy="45%" 
                innerRadius={55} 
                outerRadius={80} 
                dataKey="value" 
                paddingAngle={4}
              >
                <Cell fill="#059669" stroke="rgba(255,255,255,0.8)" strokeWidth={2} /> {/* Elegant Emerald */}
                <Cell fill="#64748B" stroke="rgba(255,255,255,0.8)" strokeWidth={2} /> {/* Slate Gray */}
                <Cell fill="#E11D48" stroke="rgba(255,255,255,0.8)" strokeWidth={2} /> {/* Rich Rose/Red */}
              </Pie>
              <Tooltip contentStyle={{ background: "#1E1810", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 8, color: "#FAF6EF", fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}