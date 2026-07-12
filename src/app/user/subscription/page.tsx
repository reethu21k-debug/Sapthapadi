import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate, getDaysRemaining, PLAN_LABELS, cn } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle, AlertTriangle, CreditCard } from "lucide-react";

export const metadata: Metadata = { title: "My Subscription" };

export default async function UserSubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: subscriptions }, { data: plans }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*, subscription_plans(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order"),
  ]);

  const active = subscriptions?.find((s) => s.status === "active");
  const daysLeft = active?.expiry_date ? getDaysRemaining(active.expiry_date) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">My Subscription</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your membership plan</p>
      </div>

      {/* Current plan */}
      {active ? (
        <div className="luxury-card p-6 border-l-4 border-gold">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-green-700">Active Plan</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-navy-dark">
                {PLAN_LABELS[active.plan] || active.plan}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {[
                  { label: "Start Date", value: formatDate(active.start_date) },
                  { label: "Expiry Date", value: formatDate(active.expiry_date) },
                  { label: "Days Remaining", value: daysLeft !== null ? `${daysLeft} days` : "—" },
                  {
                    label: "Profile Views",
                    value: (active.subscription_plans as Record<string, unknown>)?.profile_view_limit === null
                      ? "Unlimited"
                      : String((active.subscription_plans as Record<string, unknown>)?.profile_view_limit || 0),
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">{item.label}</p>
                    <p className="font-semibold text-navy-dark mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="text-orange-700 text-sm">
                Your plan expires in <strong>{daysLeft} days</strong>. Renew now to avoid interruption.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="luxury-card p-8 text-center">
          <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-serif text-xl font-bold text-navy-dark mb-2">No Active Plan</h3>
          <p className="text-gray-500 text-sm mb-5">
            Purchase a subscription to access profiles shared by our team.
          </p>
        </div>
      )}

      {/* Plans */}
      <div>
        <h3 className="font-serif text-xl font-bold text-navy-dark mb-5">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {(plans || []).map((plan) => {
            const isCurrentPlan = active?.plan === plan.plan;
            const isPremium = plan.plan === "premium" || plan.plan === "vip";

            return (
              <div
                key={String(plan.id)}
                className={cn(
                  "rounded-2xl p-5 border",
                  isPremium ? "bg-navy-dark border-gold/30" : "bg-white border-gray-200",
                  isCurrentPlan && "ring-2 ring-gold"
                )}
              >
                {isCurrentPlan && (
                  <div className="mb-3">
                    <span className="badge badge-gold text-xs">Current Plan</span>
                  </div>
                )}
                <h4 className={cn("font-serif text-lg font-bold mb-1", isPremium ? "text-gold" : "text-navy-dark")}>
                  {PLAN_LABELS[String(plan.plan)] || String(plan.name)}
                </h4>
                <p className={cn("text-3xl font-bold font-serif mb-1", isPremium ? "text-white" : "text-navy-dark")}>
                  {plan.price === 0 ? "Free" : `₹${Number(plan.price).toLocaleString("en-IN")}`}
                </p>
                <p className={cn("text-xs mb-4", isPremium ? "text-white/40" : "text-gray-400")}>
                  {Number(plan.duration_days) > 0 ? `${plan.duration_days} days` : "Always free"}
                </p>
                <p className={cn("text-xs mb-5", isPremium ? "text-white/60" : "text-gray-500")}>
                  {plan.profile_view_limit === null
                    ? "Unlimited profile views"
                    : `Up to ${plan.profile_view_limit} profile views`}
                </p>
                <div className="space-y-1.5 mb-5">
                  {((plan.features as string[]) || []).map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircle className={cn("w-3.5 h-3.5 flex-shrink-0 mt-0.5", isPremium ? "text-gold" : "text-green-500")} />
                      <span className={cn("text-xs", isPremium ? "text-white/70" : "text-gray-600")}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/contact"
                  className={cn(
                    "block text-center py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isCurrentPlan
                      ? "bg-gold/20 text-gold border border-gold/30 cursor-default"
                      : isPremium
                      ? "bg-gold-gradient text-navy-dark hover:shadow-gold"
                      : "bg-navy-dark text-white hover:bg-navy"
                  )}
                >
                  {isCurrentPlan ? "Current Plan" : "Contact to Upgrade"}
                </Link>
              </div>
            );
          })}
        </div>
        <p className="text-center text-gray-400 text-sm mt-4">
          Contact our team to upgrade your plan. Payment accepted via Cash, UPI, Bank Transfer.
        </p>
      </div>

      {/* History */}
      {subscriptions && subscriptions.length > 0 && (
        <div className="luxury-card overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-serif font-semibold text-navy-dark">Subscription History</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Status</th>
                <th>Start</th>
                <th>Expiry</th>
                <th>Amount</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={String(s.id)}>
                  <td className="font-medium">{PLAN_LABELS[String(s.plan)] || String(s.plan)}</td>
                  <td>
                    <span className={cn("badge",
                      s.status === "active" ? "badge-green" :
                      s.status === "expired" ? "badge-red" :
                      "badge-gray"
                    )}>
                      {String(s.status)}
                    </span>
                  </td>
                  <td className="text-sm text-gray-600">{formatDate(String(s.start_date))}</td>
                  <td className="text-sm text-gray-600">{formatDate(String(s.expiry_date))}</td>
                  <td className="text-sm font-semibold">₹{Number(s.amount_paid).toLocaleString("en-IN")}</td>
                  <td className="text-sm text-gray-500 capitalize">{String(s.payment_mode).replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
