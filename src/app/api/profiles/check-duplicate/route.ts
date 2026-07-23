import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { duplicateCheckSchema } from "@/lib/validations";
import { normalizeNameForComparison } from "@/lib/utils";
import { DuplicateCandidateMatch } from "@/types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  return userData?.role === "admin" ? user : null;
}

// ─── POST /api/profiles/check-duplicate ────────────────────────
// A candidate is treated as a duplicate when both:
//   - full name (first + last, case/whitespace-insensitive) matches exactly, AND
//   - date of birth matches exactly
// Used both for the live check while the admin types and as a hard block
// immediately before save in ProfileForm.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = duplicateCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "first_name, last_name, and date_of_birth are required" }, { status: 400 });
  }
  const { first_name, last_name, date_of_birth, exclude_id } = parsed.data;

  const supabase = await createAdminClient();

  // date_of_birth is an exact filter we can push to the DB (cheap + selective);
  // full-name comparison is done in-memory since it's normalized (case/whitespace
  // insensitive) and profiles is not expected to be large enough to need a
  // dedicated generated column/index for this.
  const { data: candidates, error } = await supabase
    .from("profiles")
    .select("id, profile_id, personal, status")
    .eq("personal->>date_of_birth", date_of_birth);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const targetName = normalizeNameForComparison(`${first_name} ${last_name}`);

  const matches: DuplicateCandidateMatch[] = (candidates || [])
    .filter((c) => c.id !== exclude_id)
    .filter((c) => {
      const p = c.personal as { first_name?: string; last_name?: string } | null;
      const candidateName = normalizeNameForComparison(`${p?.first_name || ""} ${p?.last_name || ""}`);
      return candidateName === targetName;
    })
    .map((c) => {
      const p = c.personal as { first_name?: string; last_name?: string; date_of_birth?: string } | null;
      return {
        id: c.id,
        profile_id: c.profile_id,
        full_name: [p?.first_name, p?.last_name].filter(Boolean).join(" "),
        date_of_birth: p?.date_of_birth || date_of_birth,
        status: c.status,
      };
    });

  return NextResponse.json({ isDuplicate: matches.length > 0, matches });
}