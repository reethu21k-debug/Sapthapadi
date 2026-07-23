"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { X, Loader2, CreditCard, CheckCircle2 } from "lucide-react";
import { PLAN_LABELS } from "@/lib/utils";

interface PlanOption {
  id: string;
  plan: string;
  name: string;
  price: number;
  duration_days: number;
  is_active: boolean;
}

// Either user_id or profile_id must be present. Profiles with no linked
// auth account (admin-created "shadow" profiles) pass profile_id only —
// the subscription is created keyed off profile_id in that case.
interface AssignTarget {
  user_id?: string;
  profile_id?: string;
  full_name?: string;
  email?: string;
}

interface Props {
  target: AssignTarget | null;
  plans: PlanOption[];
  onClose: () => void;
  onAssigned: () => void;
}

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
] as const;

export function AssignSubscriptionModal({ target, plans, onClose, onAssigned }: Props) {
  const [planConfigId, setPlanConfigId] = useState("");
  const [paymentMode, setPaymentMode] = useState<(typeof PAYMENT_MODES)[number]["value"]>("cash");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!target) return null;

  const selectedPlan = plans.find((p) => p.id === planConfigId);
  const hasLinkedUser = !!target.user_id;

  const handleSelectPlan = (id: string) => {
    setPlanConfigId(id);
    const plan = plans.find((p) => p.id === id);
    if (plan) setAmountPaid(String(plan.price));
  };

  const handleAssign = async () => {
    if (!planConfigId) {
      toast.error("Select a plan to assign");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: target.user_id || undefined,
          profile_id: target.profile_id || undefined,
          plan_config_id: planConfigId,
          payment_mode: paymentMode,
          amount_paid: amountPaid === "" ? undefined : Number(amountPaid),
          notes: notes || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to assign plan");

      toast.success(`${PLAN_LABELS[selectedPlan?.plan || ""] || selectedPlan?.name} assigned to ${target.full_name || target.email || "profile"}`);
      onAssigned();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to assign plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-navy-dark/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gold/15 text-gold-dark">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-navy-dark text-base">Assign Subscription Plan</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {target.full_name || "Unnamed Profile"} {target.email ? `· ${target.email}` : ""}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {!hasLinkedUser && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  This profile has no linked user account yet. The subscription will be attached directly to the profile and will automatically apply if the profile is later claimed by a signed-up member.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Select Plan
              </label>
              <div className="space-y-2">
                {plans.filter((p) => p.is_active).map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      planConfigId === plan.id
                        ? "border-gold bg-gold/10 shadow-sm"
                        : "border-gray-200 hover:border-gold/50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-navy-dark text-sm">
                        {PLAN_LABELS[plan.plan] || plan.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {plan.duration_days > 0 ? `${plan.duration_days} days` : "Lifetime"} · ₹{plan.price.toLocaleString("en-IN")}
                      </p>
                    </div>
                    {planConfigId === plan.id && <CheckCircle2 className="w-5 h-5 text-gold-dark flex-shrink-0" />}
                  </button>
                ))}
                {plans.filter((p) => p.is_active).length === 0 && (
                  <p className="text-xs text-gray-400 italic py-4 text-center">No active plans configured yet.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                >
                  {PAYMENT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Notes (optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all resize-none"
                placeholder="e.g. Paid in person at office"
              />
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              Assigning a new plan cancels this {hasLinkedUser ? "user's" : "profile's"} current active subscription, if any, and starts the new one from today.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/40">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={isSubmitting || !planConfigId}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gold text-navy-dark text-xs font-semibold hover:bg-gold-dark hover:text-white transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              {isSubmitting ? "Assigning..." : "Assign Plan"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}