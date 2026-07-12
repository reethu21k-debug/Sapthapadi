import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const [{ data: stats }, { data: recentSubs }] = await Promise.all([
    supabase.from("dashboard_stats").select("*").single(),
    supabase
      .from("subscriptions")
      .select("plan, amount_paid, created_at, status")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // Group revenue by month
  const revenueByMonth: Record<string, { revenue: number; count: number }> = {};
  (recentSubs || []).forEach((s) => {
    const month = new Date(s.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    if (!revenueByMonth[month]) revenueByMonth[month] = { revenue: 0, count: 0 };
    revenueByMonth[month].revenue += Number(s.amount_paid || 0);
    revenueByMonth[month].count++;
  });

  // Plan distribution
  const planDist: Record<string, number> = {};
  (recentSubs || []).forEach((s) => {
    planDist[s.plan] = (planDist[s.plan] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Platform performance and insights</p>
      </div>
      <AnalyticsDashboard
        stats={stats}
        revenueByMonth={Object.entries(revenueByMonth).map(([month, data]) => ({ month, ...data }))}
        planDistribution={Object.entries(planDist).map(([plan, count]) => ({ plan, count }))}
      />
    </div>
  );
}