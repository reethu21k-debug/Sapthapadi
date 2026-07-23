"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { 
  Plus, X, Loader2, CreditCard, AlertTriangle, 
  ShieldCheck, XOctagon, Clock, Receipt, User
} from "lucide-react";
import {
  formatDate, getDaysRemaining, cn, STATUS_COLORS, PLAN_COLORS, PLAN_LABELS, titleCase,
} from "@/lib/utils";

interface Props {
  subscriptions: Record<string, unknown>[];
  users: { id: string; full_name: string | null; email: string }[];
  plans: Record<string, unknown>[];
}

export function SubscriptionsManager({ subscriptions, users, plans }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    user_id: "",
    plan_config_id: "",
    start_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    payment_mode: "cash",
    amount_paid: 0,
    payment_reference: "",
    notes: "",
  });

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p) => String(p.id) === planId);
    if (plan) {
      const start = new Date(form.start_date);
      const expiry = new Date(start);
      expiry.setDate(expiry.getDate() + (plan.duration_days as number));
      setForm((f) => ({
        ...f,
        plan_config_id: planId,
        expiry_date: expiry.toISOString().split("T")[0],
        amount_paid: plan.price as number,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!form.user_id || !form.plan_config_id) {
      toast.error("Please select both a member and a plan.");
      return;
    }
    setIsLoading(true);
    try {
      // Goes through the admin (service-role) API route rather than a
      // direct client insert — inserting as the logged-in admin via the
      // anon-key client is still subject to RLS, which was silently
      // blocking these writes (same root cause as the read-side RLS bug
      // documented on the Subscriptions/Profiles pages).
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: form.user_id,
          plan_config_id: form.plan_config_id,
          expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : undefined,
          amount_paid: form.amount_paid,
          payment_mode: form.payment_mode,
          notes: form.notes || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create subscription");

      toast.success("Subscription created successfully!");
      setShowModal(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this subscription? This will immediately revoke access.")) return;
    try {
      // Also routed through the admin API for the same RLS reason as above.
      const res = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "cancelled" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to cancel subscription");
      toast.success("Subscription cancelled successfully");
      router.refresh();
    } catch {
      toast.error("Failed to cancel subscription");
    }
  };

  const inputClass = "w-full text-sm font-medium text-navy-dark placeholder:text-gray-400 bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all shadow-inner";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5";

  // Quick stats calculations
  const stats = [
    { 
      label: "Total Subscriptions", 
      value: subscriptions.length, 
      icon: CreditCard,
      color: "text-blue-600", 
      bg: "bg-blue-50 border-blue-100" 
    },
    { 
      label: "Active Plans", 
      value: subscriptions.filter((s) => s.status === "active").length, 
      icon: ShieldCheck,
      color: "text-emerald-600", 
      bg: "bg-emerald-50 border-emerald-100" 
    },
    { 
      label: "Expired / Cancelled", 
      value: subscriptions.filter((s) => s.status === "expired" || s.status === "cancelled").length, 
      icon: XOctagon,
      color: "text-rose-600", 
      bg: "bg-rose-50 border-rose-100" 
    },
    { 
      label: "Expiring (30d)", 
      value: subscriptions.filter((s) => s.status === "active" && getDaysRemaining(s.expiry_date as string) <= 30 && getDaysRemaining(s.expiry_date as string) > 0).length, 
      icon: Clock,
      color: "text-amber-600", 
      bg: "bg-amber-50 border-amber-100" 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="luxury-card p-5 flex items-start gap-3.5 bg-white border border-gray-100 shadow-sm"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0 ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold font-serif text-navy-dark tracking-tight leading-none">{stat.value}</p>
              <p className="text-gray-400 text-xs font-medium mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Table Card */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="luxury-card overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm"
      >
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold-dark">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-navy-dark text-lg">Billing & Subscriptions</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage user plan enrollments and payment history</p>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold text-navy-dark font-bold text-xs hover:bg-gold-dark hover:text-white transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Subscription
          </motion.button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-150 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3.5 px-5">Member</th>
                <th className="py-3.5 px-5">Plan Tier</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Billing Cycle</th>
                <th className="py-3.5 px-5">Remaining</th>
                <th className="py-3.5 px-5">Revenue</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {subscriptions.length > 0 ? (
                subscriptions.map((s) => {
                  const user = s.users as Record<string, unknown> | null;
                  const profile = s.profiles as Record<string, unknown> | null;
                  const profilePersonal = profile?.personal as Record<string, unknown> | undefined;
                  const profileName = profilePersonal
                    ? [profilePersonal.first_name, profilePersonal.last_name].filter(Boolean).join(" ")
                    : "";

                  // Prefer the linked user's name; fall back to the linked
                  // profile's name (shadow profiles with no auth account);
                  // only show "Unlinked Profile" if genuinely neither exists.
                  const displayName = String(user?.full_name || profileName || "Unlinked Profile");
                  const displaySubtitle = user?.email
                    ? String(user.email)
                    : profile
                    ? `Profile ${String(profile.profile_id || "")}`
                    : "No linked account";

                  const remaining = getDaysRemaining(s.expiry_date as string);
                  const isExpiring = remaining <= 30 && remaining > 0 && s.status === "active";
                  const initial = displayName[0]?.toUpperCase() || "?";

                  return (
                    <tr key={String(s.id)} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0 text-navy-dark font-bold text-xs">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-navy-dark text-sm truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{displaySubtitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border shadow-2xs", PLAN_COLORS[s.plan as string] || "bg-gray-50 text-gray-600 border-gray-200")}>
                          {PLAN_LABELS[s.plan as string] || String(s.plan)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap", STATUS_COLORS[s.status as string] || "bg-gray-100 text-gray-600 border-gray-200")}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", s.status === "active" ? "bg-emerald-500" : s.status === "cancelled" ? "bg-rose-500" : "bg-gray-400")} />
                          {titleCase(String(s.status))}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-gray-600">
                        <p className="text-xs font-medium">{formatDate(String(s.start_date))}</p>
                        <p className="text-[10px] text-gray-400">to {formatDate(String(s.expiry_date))}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        {s.status === "active" ? (
                          <span className={cn("text-xs font-bold flex items-center gap-1.5", isExpiring ? "text-amber-600" : "text-emerald-600")}>
                            {isExpiring && <AlertTriangle className="w-3.5 h-3.5" />}
                            {remaining > 0 ? `${remaining} Days` : "Expired"}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs font-medium">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-navy-dark text-sm">
                        ₹{Number(s.amount_paid).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {s.status === "active" ? (
                          <button
                            onClick={() => handleCancel(String(s.id))}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Cancel Subscription"
                          >
                            <XOctagon className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 bg-gray-50/30">
                    <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-navy-dark">No Subscriptions Found</p>
                    <p className="text-xs text-gray-400 mt-0.5">Active user plans and billing history will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Subscription Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isLoading && setShowModal(false)}
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gold/15 text-gold-dark">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-navy-dark">New Subscription</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Manually enroll a member into a premium tier</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} disabled={isLoading} className="p-2 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                {/* Member Selection */}
                <div>
                  <label className={labelClass}>Target Member *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select 
                      className={cn(inputClass, "pl-10 appearance-none")} 
                      value={form.user_id} 
                      onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
                    >
                      <option value="" disabled>Select a registered member</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Plan Selection */}
                <div>
                  <label className={labelClass}>Subscription Tier *</label>
                  <select 
                    className={cn(inputClass, "appearance-none")} 
                    value={form.plan_config_id} 
                    onChange={(e) => handlePlanChange(e.target.value)}
                  >
                    <option value="" disabled>Select pricing plan</option>
                    {plans.map((p) => (
                      <option key={String(p.id)} value={String(p.id)}>
                        {String(p.name)} — ₹{Number(p.price).toLocaleString("en-IN")} ({String(p.duration_days)} days)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className={labelClass}>Start Date *</label>
                    <input 
                      className={inputClass} 
                      type="date" 
                      value={form.start_date} 
                      onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Expiry Date *</label>
                    <input 
                      className={inputClass} 
                      type="date" 
                      value={form.expiry_date} 
                      onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Payment Method *</label>
                    <select 
                      className={cn(inputClass, "appearance-none")} 
                      value={form.payment_mode} 
                      onChange={(e) => setForm((f) => ({ ...f, payment_mode: e.target.value }))}
                    >
                      <option value="cash">Cash / Offline</option>
                      <option value="upi">UPI Transfer</option>
                      <option value="card">Credit / Debit Card</option>
                      <option value="bank_transfer">Direct Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Amount Settled (₹) *</label>
                    <input 
                      className={inputClass} 
                      type="number" 
                      min="0"
                      value={form.amount_paid} 
                      onChange={(e) => setForm((f) => ({ ...f, amount_paid: Number(e.target.value) }))} 
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Payment Reference / UTR</label>
                  <input 
                    className={inputClass} 
                    value={form.payment_reference} 
                    onChange={(e) => setForm((f) => ({ ...f, payment_reference: e.target.value }))} 
                    placeholder="e.g., TXN_987654321 (Optional)" 
                  />
                </div>

                <div>
                  <label className={labelClass}>Internal Notes</label>
                  <textarea 
                    className={cn(inputClass, "resize-none")} 
                    rows={2} 
                    value={form.notes} 
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} 
                    placeholder="Any administrative notes regarding this billing entry..." 
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50 flex-shrink-0">
                <button 
                  onClick={() => setShowModal(false)} 
                  disabled={isLoading}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit} 
                  disabled={isLoading} 
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gold text-navy-dark font-bold text-sm hover:bg-gold-dark hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Enrollment
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}