import { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Heart, FileText, Bell, AlertTriangle, CheckCircle, BadgeCheck, CalendarHeart } from "lucide-react";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { formatDate, getDaysRemaining, PLAN_LABELS } from "@/lib/utils";

export const metadata: Metadata = { title: "My Dashboard" };

export default async function UserDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: subscription },
    { data: sharedCount },
    { data: favouriteCount },
    { data: recentNotifications },
    { data: recentViewed },
    { data: completedMeetings },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("subscriptions").select("*, subscription_plans(*)").eq("user_id", user.id).eq("status", "active").single(),
    supabase.from("profile_access").select("id", { count: "exact" }).eq("granted_to_user_id", user.id).eq("is_active", true),
    supabase.from("profile_interactions").select("id", { count: "exact" }).eq("user_id", user.id).eq("interaction_type", "favourite"),
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("profile_interactions").select("*, profiles(profile_id, personal, images, is_verified)").eq("user_id", user.id).eq("interaction_type", "view").order("created_at", { ascending: false }).limit(4),
    supabase.from("match_meeting_requests").select("id", { count: "exact" }).eq("requested_by_user_id", user.id).eq("status", "completed"),
  ]);

  const personal = profile?.personal as Record<string, string> | null;
  const daysLeft = subscription?.expiry_date ? getDaysRemaining(subscription.expiry_date) : null;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-navy-gradient rounded-2xl p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 50%)", backgroundSize: "15px 15px" }}
        />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-9 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-gold text-sm font-semibold">Welcome back,</p>
              <h1 className="text-2xl font-serif font-bold text-white mt-1">
                {personal?.first_name || user.email?.split("@")[0] || "Member"}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {profile?.status === "approved"
                  ? "Your profile is active and visible to admins."
                  : profile?.status === "pending"
                  ? "Your profile is under review."
                  : "Create your profile to get started."}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {profile?.is_verified && (
                <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-xl px-4 py-2">
                  <BadgeCheck className="w-4 h-4 text-blue-300" />
                  <span className="text-blue-200 text-sm font-medium">Verified</span>
                </div>
              )}
              {profile?.status === "approved" ? (
                <div className="flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-xl px-4 py-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-sm font-medium">Profile Approved</span>
                </div>
              ) : profile?.status === "pending" ? (
                <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-400/30 rounded-xl px-4 py-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 text-sm font-medium">Under Review</span>
                </div>
              ) : (
                <Link href="/user/profile/create" className="btn-gold py-2.5 text-sm">
                  Create My Profile
                </Link>
              )}
            </div>
          </div>

          {/* Decorative portrait accent — hidden on smaller screens to keep the banner uncluttered */}
          <div className="hidden lg:flex lg:col-span-3 justify-end">
            <div className="relative w-20 aspect-[1085/1449] rounded-xl overflow-hidden ring-2 ring-gold/30 shadow-lg">
              <Image
                src="/Love/love-11.png"
                alt="Find your partner, for a lifetime of togetherness"
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {[
          { icon: Users, label: "Shared Profiles", value: sharedCount?.length || 0, href: "/user/profiles", color: "text-blue-600 bg-blue-50" },
          { icon: Heart, label: "Favourites", value: favouriteCount?.length || 0, href: "/user/favorites", color: "text-pink-600 bg-pink-50" },
          { icon: CalendarHeart, label: "Completed Meetings", value: completedMeetings?.length || 0, href: "/user/match-meetings", color: "text-emerald-600 bg-emerald-50" },
          { icon: FileText, label: "My Biodata", value: profile ? 1 : 0, href: "/user/biodata", color: "text-purple-600 bg-purple-50" },
          { icon: Bell, label: "Notifications", value: recentNotifications?.filter((n) => !n.is_read).length || 0, href: "/user/notifications", color: "text-gold-dark bg-gold/10" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="luxury-card p-5 hover:shadow-card-hover">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold font-serif text-navy-dark">{stat.value}</p>
            <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription card */}
        <div className="luxury-card p-6">
          <h2 className="font-serif font-semibold text-navy-dark mb-4 flex items-center gap-2">
            Subscription Status
          </h2>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="badge badge-gold text-sm">
                  {PLAN_LABELS[subscription.plan as string] || String(subscription.plan)}
                </span>
                <span className={`text-sm font-medium ${daysLeft && daysLeft <= 30 ? "text-orange-600" : "text-green-600"}`}>
                  {daysLeft !== null && daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs">Valid Until</p>
                  <p className="font-medium text-navy-dark mt-0.5">{formatDate(String(subscription.expiry_date))}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs">Profile Views</p>
                  <p className="font-medium text-navy-dark mt-0.5">
                    {(subscription.subscription_plans as Record<string, unknown>)?.profile_view_limit === null
                      ? "Unlimited"
                      : String((subscription.subscription_plans as Record<string, unknown>)?.profile_view_limit || 0)}
                  </p>
                </div>
              </div>
              {daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
                <Link href="/user/subscription" className="btn-gold w-full justify-center py-2.5 text-sm">
                  Renew Now
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm mb-4">No active subscription</p>
              <Link href="/plans" className="btn-gold py-2.5 text-sm">
                View Plans
              </Link>
            </div>
          )}
        </div>

        {/* Profile completion */}
        <div className="luxury-card p-6">
          <h2 className="font-serif font-semibold text-navy-dark mb-4">Profile Completion</h2>
          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="url(#pct)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34 * (profile?.profile_completion || 0) / 100} 999`}
                />
                <defs>
                  <linearGradient id="pct" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#F4D78C" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gold">{profile?.profile_completion || 0}%</span>
              </div>
            </div>
            <div>
              <p className="font-medium text-navy-dark">
                {(profile?.profile_completion || 0) === 100 ? "Profile Complete!" : "Complete your profile"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {(profile?.profile_completion || 0) < 100
                  ? "Add more details to improve your matches"
                  : "Great! Your profile is fully complete."}
              </p>
            </div>
          </div>
          {profile ? (
            <Link href={`/user/biodata`} className="btn-navy w-full justify-center py-2.5 text-sm">
              Edit Profile
            </Link>
          ) : (
            <Link href="/user/profile/create" className="btn-navy w-full justify-center py-2.5 text-sm">
              Create My Profile
            </Link>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="luxury-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-serif font-semibold text-navy-dark">Recent Notifications</h2>
            <Link href="/user/notifications" className="text-xs text-gold font-medium">View all</Link>
          </div>
          {recentNotifications && recentNotifications.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentNotifications.map((n) => (
                <div key={n.id} className={`px-5 py-4 flex items-start gap-3 ${!n.is_read ? "bg-gold/5" : ""}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.is_read ? "bg-gray-200" : "bg-gold"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-dark truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-300 mt-1">{formatDate(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400 text-sm">No notifications yet</div>
          )}
        </div>

        {/* Recently Viewed */}
        <div className="luxury-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-serif font-semibold text-navy-dark">Recently Viewed</h2>
            <Link href="/user/profiles" className="text-xs text-gold font-medium">View all</Link>
          </div>
          {recentViewed && recentViewed.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentViewed.map((interaction: Record<string, unknown>) => {
                const profile = interaction.profiles as Record<string, unknown> | null;
                const personal = profile?.personal as Record<string, string> | null;
                const images = profile?.images as Record<string, string | null> | null;
                const name = [personal?.first_name, personal?.last_name].filter(Boolean).join(" ");
                return (
                  <div key={String(interaction.id)} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gold/10 flex-shrink-0">
                      {images?.profile_photo ? (
                        <img src={images.profile_photo} alt={name ? `${name}'s profile photo` : "Profile photo"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gold font-bold text-sm">{personal?.first_name?.[0] || "?"}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-navy-dark flex items-center gap-1 truncate">
                        {name || "—"}
                        {Boolean(profile?.is_verified) && <VerifiedBadge size="sm" />}
                      </p>
                      <p className="text-xs text-gold font-mono truncate">{String(profile?.profile_id || "")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400 text-sm">No profiles viewed yet</div>
          )}
        </div>
      </div>
    </div>
  );
}