import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { ProfileGalleryGrid } from "@/components/admin/ProfileGalleryGrid";
import { Profile } from "@/types";

export const metadata: Metadata = { title: "Profile Gallery" };

interface SearchParams {
  gender?: string;
  status?: string;
  page?: string;
}

const LIMIT = 24;

export default async function ProfileGalleryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  // Same reasoning as the main profiles table: the regular session client
  // is subject to RLS, which silently filters rows the admin should be
  // able to see here — use the service-role client instead.
  const supabase = await createAdminClient();

  const page = parseInt(params.page || "1");
  const offset = (page - 1) * LIMIT;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + LIMIT - 1);

  if (params.gender) query = query.eq("gender", params.gender);
  if (params.status) query = query.eq("status", params.status);

  const { data: profiles, count } = await query;

  const totalPages = Math.max(1, Math.ceil((count || 0) / LIMIT));

  // ── Match meeting counts — identical query pattern to
  // app/admin/profiles/page.tsx, scoped to just this page of profiles.
  const profileIds = (profiles || []).map((p) => p.id);
  const matchMeetingCounts: Record<string, number> = {};
  if (profileIds.length > 0) {
    const { data: counts } = await supabase
      .from("profile_match_meeting_counts")
      .select("profile_id, completed_match_meetings")
      .in("profile_id", profileIds);
    (counts || []).forEach((c) => {
      matchMeetingCounts[c.profile_id] = c.completed_match_meetings || 0;
    });
  }

  // ── Active subscriptions — identical logic to app/admin/profiles/page.tsx:
  // a subscription can be linked via profile_id directly, or via the
  // profile's user_id (subscriptions created from the standalone
  // Subscriptions page only store user_id).
  const userIds = (profiles || [])
    .map((p) => p.user_id)
    .filter((id): id is string => Boolean(id));

  const subscriptionsByProfile: Record<
    string,
    { id: string; plan: string; status: string; expiry_date: string }
  > = {};

  if (profileIds.length > 0 || userIds.length > 0) {
    const orParts: string[] = [];
    if (profileIds.length > 0) orParts.push(`profile_id.in.(${profileIds.join(",")})`);
    if (userIds.length > 0) orParts.push(`user_id.in.(${userIds.join(",")})`);

    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select("id, user_id, profile_id, plan, status, expiry_date")
      .eq("status", "active")
      .or(orParts.join(","));

    type ActiveSub = {
      id: string;
      user_id: string | null;
      profile_id: string | null;
      plan: string;
      status: string;
      expiry_date: string;
    };

    const byUserId: Record<string, ActiveSub> = {};
    const byProfileId: Record<string, ActiveSub> = {};
    ((activeSubs || []) as ActiveSub[]).forEach((s) => {
      if (s.user_id) byUserId[s.user_id] = s;
      if (s.profile_id) byProfileId[s.profile_id] = s;
    });

    (profiles || []).forEach((p) => {
      const sub = byProfileId[p.id] || (p.user_id ? byUserId[p.user_id] : undefined);
      if (sub) {
        subscriptionsByProfile[p.id] = {
          id: sub.id,
          plan: sub.plan,
          status: sub.status,
          expiry_date: sub.expiry_date,
        };
      }
    });
  }

  const genderLabel =
    params.gender === "male" ? "Male" : params.gender === "female" ? "Female" : "All";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gold-dark transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-serif font-bold text-navy-dark">
            {genderLabel} Profiles
          </h1>
          <p className="text-gray-500 text-sm mt-1">{count ?? 0} profiles</p>
        </div>

        {/* Simple gender toggle so admins can flip between the two views
            without going back to the dashboard. */}
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
          <Link
            href="/admin/profiles/gallery?gender=male"
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              params.gender === "male"
                ? "bg-white text-navy-dark shadow-2xs"
                : "text-gray-500 hover:text-navy-dark"
            }`}
          >
            Male
          </Link>
          <Link
            href="/admin/profiles/gallery?gender=female"
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              params.gender === "female"
                ? "bg-white text-navy-dark shadow-2xs"
                : "text-gray-500 hover:text-navy-dark"
            }`}
          >
            Female
          </Link>
        </div>
      </div>

      <ProfileGalleryGrid
        profiles={(profiles || []) as Profile[]}
        total={count || 0}
        page={page}
        limit={LIMIT}
        totalPages={totalPages}
        matchMeetingCounts={matchMeetingCounts}
        subscriptionsByProfile={subscriptionsByProfile}
      />
    </div>
  );
}