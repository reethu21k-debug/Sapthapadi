"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Loader2, Edit3, Check, X, Trash2, CheckCircle2, AlertTriangle, Infinity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PLAN_LABELS } from "@/lib/utils";

interface Props {
  plans: Record<string, unknown>[];
}

export function PlansManager({ plans }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startEdit = (plan: Record<string, unknown>) => {
    setConfirmDeleteId(null);
    setEditingId(String(plan.id));
    setEditForm({
      price: plan.price,
      duration_days: plan.duration_days,
      profile_view_limit: plan.profile_view_limit,
      features: (plan.features as string[]).join("\n"),
      is_active: plan.is_active,
    });
  };

  const handleSave = async (planId: string) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("subscription_plans").update({
        price: editForm.price,
        duration_days: editForm.duration_days,
        profile_view_limit: editForm.profile_view_limit === "" ? null : editForm.profile_view_limit,
        features: String(editForm.features).split("\n").map((f) => f.trim()).filter(Boolean),
        is_active: editForm.is_active,
      }).eq("id", planId);

      if (error) throw error;
      toast.success("Plan updated successfully!");
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    setDeletingId(planId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("subscription_plans").delete().eq("id", planId);

      if (error) {
        // Foreign key violation — subscriptions still reference this plan
        if (error.code === "23503") {
          toast.error(
            "This plan can't be deleted because members are subscribed to it. Deactivate it instead, or move those subscriptions to another plan first.",
            { duration: 6000 }
          );
        } else {
          throw error;
        }
        return;
      }
      toast.success("Plan deleted successfully!");
      setConfirmDeleteId(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete plan");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const idStr = String(plan.id);
        const isEditing = editingId === idStr;
        const isConfirmingDelete = confirmDeleteId === idStr;
        const isPremium = plan.plan === "premium" || plan.plan === "vip";

        return (
          <motion.div
            key={idStr}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-2xl border transition-shadow duration-200 flex flex-col justify-between overflow-hidden ${
              isPremium
                ? "bg-gradient-to-br from-navy-dark via-navy to-[#1a140e] border-gold/40 shadow-xl shadow-black/10"
                : "bg-white border-gray-200/80 shadow-xs hover:shadow-md"
            }`}
          >
            {/* Top Badge Accent Glow for Premium Plans */}
            {isPremium && (
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-75" />
            )}

            <div className="p-6">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h3 className={`font-serif text-xl font-bold tracking-tight ${isPremium ? "text-gold" : "text-navy-dark"}`}>
                    {PLAN_LABELS[String(plan.plan)] || String(plan.name)}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        plan.is_active
                          ? isPremium 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                            : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          : isPremium
                            ? "bg-white/5 text-white/40 border-white/10"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${plan.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {plan.is_active ? "Active Plan" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Action Controls */}
                {!isEditing ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(plan)}
                      aria-label="Edit plan"
                      className={`p-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                        isPremium
                          ? "hover:bg-white/10 text-white/70 hover:text-white"
                          : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setConfirmDeleteId(idStr);
                      }}
                      aria-label="Delete plan"
                      className={`p-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                        isPremium
                          ? "hover:bg-rose-500/20 text-white/70 hover:text-rose-400"
                          : "hover:bg-rose-50 text-gray-400 hover:text-rose-600"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSave(idStr)}
                      disabled={isLoading}
                      aria-label="Save plan changes"
                      className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-2xs transition-all disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={isLoading}
                      aria-label="Cancel editing"
                      className={`p-2 rounded-xl transition-colors ${
                        isPremium ? "bg-white/10 text-white/70 hover:bg-white/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Content Body */}
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="edit-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${isPremium ? "text-white/60" : "text-gray-500"}`}>
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          className={`w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all ${
                            isPremium
                              ? "bg-black/30 border border-white/15 text-white placeholder:text-white/30"
                              : "bg-gray-50 border border-gray-200 text-navy-dark placeholder:text-gray-400"
                          }`}
                          value={String(editForm.price || 0)}
                          onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                        />
                      </div>

                      <div>
                        <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${isPremium ? "text-white/60" : "text-gray-500"}`}>
                          Days Valid
                        </label>
                        <input
                          type="number"
                          className={`w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all ${
                            isPremium
                              ? "bg-black/30 border border-white/15 text-white"
                              : "bg-gray-50 border border-gray-200 text-navy-dark"
                          }`}
                          value={String(editForm.duration_days || 0)}
                          onChange={(e) => setEditForm({ ...editForm, duration_days: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${isPremium ? "text-white/60" : "text-gray-500"}`}>
                        Profile Views Limit <span className="normal-case opacity-70">(empty = unlimited)</span>
                      </label>
                      <input
                        type="number"
                        className={`w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all ${
                          isPremium
                            ? "bg-black/30 border border-white/15 text-white placeholder:text-white/30"
                            : "bg-gray-50 border border-gray-200 text-navy-dark placeholder:text-gray-400"
                        }`}
                        value={editForm.profile_view_limit === null ? "" : String(editForm.profile_view_limit)}
                        onChange={(e) => setEditForm({ ...editForm, profile_view_limit: e.target.value === "" ? null : Number(e.target.value) })}
                        placeholder="Unlimited"
                      />
                    </div>

                    <div>
                      <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${isPremium ? "text-white/60" : "text-gray-500"}`}>
                        Plan Features <span className="normal-case opacity-70">(one per line)</span>
                      </label>
                      <textarea
                        className={`w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-none custom-scrollbar ${
                          isPremium
                            ? "bg-black/30 border border-white/15 text-white placeholder:text-white/30"
                            : "bg-gray-50 border border-gray-200 text-navy-dark placeholder:text-gray-400"
                        }`}
                        rows={4}
                        value={String(editForm.features || "")}
                        onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                      />
                    </div>

                    <div className="pt-1">
                      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(editForm.is_active)}
                          onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                          className="w-4 h-4 rounded text-gold focus:ring-gold border-gray-300"
                        />
                        <span className={`text-sm font-medium ${isPremium ? "text-white/90" : "text-gray-700"}`}>
                          Available for new subscriptions
                        </span>
                      </label>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="read-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Price Display */}
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl font-bold font-serif tracking-tight ${isPremium ? "text-white" : "text-navy-dark"}`}>
                        {plan.price === 0 ? "Free" : `₹${Number(plan.price).toLocaleString("en-IN")}`}
                      </span>
                      {plan.price !== 0 && (
                        <span className={`text-xs font-medium ${isPremium ? "text-white/50" : "text-gray-400"}`}>
                          / {Number(plan.duration_days) > 0 ? `${plan.duration_days} days` : "lifetime"}
                        </span>
                      )}
                    </div>

                    {/* Meta Specs Grid */}
                    <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl border ${
                      isPremium ? "bg-white/5 border-white/10" : "bg-gray-50/80 border-gray-150"
                    }`}>
                      <div>
                        <span className={`block text-[11px] uppercase tracking-wider font-semibold ${isPremium ? "text-white/40" : "text-gray-400"}`}>
                          Duration
                        </span>
                        <span className={`text-sm font-semibold mt-0.5 block ${isPremium ? "text-white" : "text-navy-dark"}`}>
                          {Number(plan.duration_days) > 0 ? `${plan.duration_days} Days` : "Forever"}
                        </span>
                      </div>

                      <div>
                        <span className={`block text-[11px] uppercase tracking-wider font-semibold ${isPremium ? "text-white/40" : "text-gray-400"}`}>
                          Profile Views
                        </span>
                        <span className={`text-sm font-semibold mt-0.5 flex items-center gap-1 ${isPremium ? "text-white" : "text-navy-dark"}`}>
                          {plan.profile_view_limit === null ? (
                            <>
                              <Infinity className="w-4 h-4 text-gold inline" /> Unlimited
                            </>
                          ) : (
                            String(plan.profile_view_limit)
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-white/10">
                      <span className={`text-xs font-semibold uppercase tracking-wider block mb-3 ${isPremium ? "text-gold/80" : "text-gray-400"}`}>
                        Included Features
                      </span>
                      {((plan.features as string[]) || []).map((f: string, i: number) => (
                        <div key={i} className={`text-xs flex items-start gap-2.5 leading-relaxed ${isPremium ? "text-white/80" : "text-gray-600"}`}>
                          <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPremium ? "text-gold" : "text-emerald-600"}`} />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Inline Confirmation Delete Dialog */}
            <AnimatePresence>
              {isConfirmingDelete && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`p-4 border-t ${
                    isPremium ? "bg-rose-950/40 border-rose-500/30 text-white" : "bg-rose-50/90 border-rose-200 text-navy-dark"
                  }`}
                >
                  <div className="flex items-start gap-2.5 mb-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Confirm Deletion
                      </p>
                      <p className="text-xs mt-1 leading-normal opacity-90">
                        Permanently delete the &ldquo;{PLAN_LABELS[String(plan.plan)] || String(plan.name)}&rdquo; tier? This cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={deletingId === idStr}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isPremium ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white border border-gray-300 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(idStr)}
                      disabled={deletingId === idStr}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-2xs transition-all disabled:opacity-50"
                    >
                      {deletingId === idStr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete Plan
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}