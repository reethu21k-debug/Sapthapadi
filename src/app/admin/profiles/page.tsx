import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfilesTable } from "@/components/admin/ProfilesTable";
import { ProfileFilters } from "@/components/admin/ProfileFiltersBar";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export const metadata: Metadata = { title: "Manage Profiles" };

interface SearchParams {
  gender?: string;
  status?: string;
  verified?: string;
  religion?: string;
  caste?: string;
  state?: string;
  district?: string;
  marital_status?: string;
  search?: string;
  page?: string;
  age_min?: string;
  age_max?: string;
  dob_year?: string;
}

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = parseInt(params.page || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.gender) query = query.eq("gender", params.gender);
  if (params.status) query = query.eq("status", params.status);
  if (params.verified) query = query.eq("is_verified", params.verified === "true");
  if (params.religion) query = query.ilike("religion", `%${params.religion}%`);
  if (params.caste) {
    // Community names have alternate spellings (e.g. Modollu/Modikallu,
    // Namdarlu/Namdharis) — match on any of them so the filter catches
    // profiles regardless of which spelling the admin used when saving.
    const casteAliases: Record<string, string[]> = {
      Modollu: ["Modollu", "Modikallu"],
      Namdarlu: ["Namdarlu", "Namdharis"],
    };
    const terms = casteAliases[params.caste] || [params.caste];
    query = query.or(terms.map((t) => `caste.ilike.%${t}%`).join(","));
  }
  if (params.state) query = query.ilike("state", `%${params.state}%`);
  if (params.district) query = query.ilike("district", `%${params.district}%`);
  if (params.marital_status) query = query.eq("marital_status", params.marital_status);

  // Age range filter: convert age (years) into a date_of_birth range.
  // An older max age = an earlier (smaller) date_of_birth lower-bound.
  if (params.age_min) {
    const maxDob = new Date();
    maxDob.setFullYear(maxDob.getFullYear() - parseInt(params.age_min));
    query = query.lte("date_of_birth", maxDob.toISOString().slice(0, 10));
  }
  if (params.age_max) {
    const minDob = new Date();
    minDob.setFullYear(minDob.getFullYear() - parseInt(params.age_max) - 1);
    query = query.gte("date_of_birth", minDob.toISOString().slice(0, 10));
  }

  // Birth year filter: matches any date_of_birth within that calendar year.
  if (params.dob_year) {
    const year = params.dob_year;
    query = query.gte("date_of_birth", `${year}-01-01`).lte("date_of_birth", `${year}-12-31`);
  }

  if (params.search) {
    query = query.or(
      `personal->>first_name.ilike.%${params.search}%,personal->>last_name.ilike.%${params.search}%,profile_id.ilike.%${params.search}%`
    );
  }

  const { data: profiles, count } = await query;

  // Completed match-meeting counts for just this page of profiles, pulled
  // from the profile_match_meeting_counts view in one query instead of one
  // query per row.
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-dark">Profiles</h1>
          <p className="text-gray-500 text-sm mt-1">
            {count ?? 0} total profiles
          </p>
        </div>
        <Link href="/admin/profiles/create" className="btn-gold w-fit">
          <UserPlus className="w-4 h-4" />
          Add Profile
        </Link>
      </div>

      <ProfileFilters />
      <ProfilesTable
        profiles={profiles || []}
        total={count || 0}
        page={page}
        limit={limit}
        matchMeetingCounts={matchMeetingCounts}
      />
    </div>
  );
}