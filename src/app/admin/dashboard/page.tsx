import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { RecentActivity, QuickActions, RevenueChart } from "@/components/admin/DashboardWidgets";
import { formatDate, getMonthlyRevenue } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);

  const [
    { data: statsData },
    { data: recentSubscriptions },
    { data: auditLogs },
    { data: pendingProfiles },
    { data: unverifiedProfiles },
    { data: revenueSubscriptions },
  ] = await Promise.all([
    supabase.from("dashboard_stats").select("*").single(),
    supabase
      .from("subscriptions")
      .select("id, plan, status, amount_paid, created_at, users(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("id, profile_id, personal, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("id, profile_id, personal, created_at")
      .eq("status", "approved")
      .eq("is_verified", false)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("subscriptions")
      .select("amount_paid, created_at")
      .gte("created_at", twelveMonthsAgo.toISOString()),
  ]);

  const revenueByMonth = getMonthlyRevenue(revenueSubscriptions || [], 12);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview as of {formatDate(new Date().toISOString(), "dd MMMM yyyy, HH:mm")}
        </p>
      </div>

      {/* Stats Grid */}
      <DashboardStats stats={statsData} />

      {/* Quick Actions */}
      <QuickActions pendingCount={statsData?.pending_profiles || 0} />

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueByMonth} />
        </div>
        <div>
          <RecentActivity logs={auditLogs || []} />
        </div>
      </div>

      {/* Recent sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Profiles */}
        <div className="luxury-card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-serif font-semibold text-navy-dark">Pending Approvals</h2>
            <span className="badge badge-yellow">
              {statsData?.pending_profiles || 0} pending
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingProfiles && pendingProfiles.length > 0 ? (
              pendingProfiles.map((p) => (
                <div key={p.id} className="px-5 py-4 flex items-center justify-between hover:bg-gold/5 transition-colors">
                  <div>
                    <p className="font-medium text-navy-dark text-sm">
                      {(p.personal as { first_name?: string; last_name?: string })?.first_name}{" "}
                      {(p.personal as { first_name?: string; last_name?: string })?.last_name}
                    </p>
                    <p className="text-gray-400 text-xs">{p.profile_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">{formatDate(p.created_at)}</span>
                    <a
                      href={`/admin/profiles/${p.id}`}
                      className="text-xs text-gold hover:text-gold-dark font-medium"
                    >
                      Review →
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No pending profiles
              </div>
            )}
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="luxury-card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-serif font-semibold text-navy-dark">Recent Subscriptions</h2>
            <a href="/admin/subscriptions" className="text-xs text-gold font-medium">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {recentSubscriptions && recentSubscriptions.length > 0 ? (
              (recentSubscriptions as Array<{
                id: string;
                plan: string;
                status: string;
                amount_paid: number;
                created_at: string;
                users?: { full_name?: string; email?: string } | null;
              }>).map((s) => (
                <div key={s.id} className="px-5 py-4 flex items-center justify-between hover:bg-gold/5 transition-colors">
                  <div>
                    <p className="font-medium text-navy-dark text-sm">
                      {s.users?.full_name || s.users?.email || "—"}
                    </p>
                    <p className="text-gray-400 text-xs capitalize">
                      {s.plan?.replace("_", " ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-navy-dark">
                      ₹{s.amount_paid?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-gray-400 text-xs">{formatDate(s.created_at)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No recent subscriptions
              </div>
            )}
          </div>
        </div>

        {/* Awaiting Verification */}
        <div className="luxury-card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-serif font-semibold text-navy-dark">Awaiting Verification</h2>
            <Link href="/admin/profiles?status=approved&verified=false" className="text-xs text-gold font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {unverifiedProfiles && unverifiedProfiles.length > 0 ? (
              unverifiedProfiles.map((p) => (
                <div key={p.id} className="px-5 py-4 flex items-center justify-between hover:bg-gold/5 transition-colors">
                  <div>
                    <p className="font-medium text-navy-dark text-sm">
                      {(p.personal as { first_name?: string; last_name?: string })?.first_name}{" "}
                      {(p.personal as { first_name?: string; last_name?: string })?.last_name}
                    </p>
                    <p className="text-gray-400 text-xs">{p.profile_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">{formatDate(p.created_at)}</span>
                    <a
                      href={`/admin/profiles/${p.id}`}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Verify →
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                All approved profiles are verified
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}