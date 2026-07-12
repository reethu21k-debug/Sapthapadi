import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// ─── Auth guard helper ────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return userData?.role === "admin" ? user : null;
}

// ─── GET /api/subscriptions ──────────────────────────────────
// Query params: user_id, status, plan, page, limit
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  const supabase = await createAdminClient();

  let query = supabase
    .from("subscriptions")
    .select(
      `
      *,
      users(id, full_name, email, phone),
      profiles(id, profile_id, personal),
      subscription_plans(name, plan, price, duration_days)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) query = query.eq("user_id", userId);
  if (status) query = query.eq("status", status);
  if (plan) query = query.eq("plan", plan);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page, limit },
  });
}

// ─── POST /api/subscriptions ─────────────────────────────────
// Create a new subscription (admin only)
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { user_id, plan, amount_paid, payment_mode, notes, expiry_date } = body;

  if (!user_id || !plan) {
    return NextResponse.json(
      { error: "user_id and plan are required" },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient();

  // Deactivate any existing active subscription for this user
  await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("user_id", user_id)
    .eq("status", "active");

  // Resolve plan config for duration/price (also required as the FK for plan_config_id)
  const { data: planConfig } = await supabase
    .from("subscription_plans")
    .select("id, duration_days, price")
    .eq("plan", plan)
    .single();

  // plan_config_id and expiry_date are both NOT NULL columns. Without a resolved
  // plan config we have neither a valid FK nor a way to derive an expiry date
  // (unless the caller explicitly supplied one), so fail fast instead of
  // letting the insert hit a not-null constraint violation.
  if (!planConfig && !expiry_date) {
    return NextResponse.json(
      { error: `No subscription plan config found for plan "${plan}", and no expiry_date was provided` },
      { status: 400 }
    );
  }

  const startDate = new Date();
  const computedExpiry =
    expiry_date ??
    (planConfig && planConfig.duration_days > 0
      ? new Date(
          startDate.getTime() + planConfig.duration_days * 24 * 60 * 60 * 1000
        ).toISOString()
      : null);

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id,
      plan,
      plan_config_id: planConfig?.id,
      status: "active",
      start_date: startDate.toISOString(),
      expiry_date: computedExpiry,
      amount_paid: amount_paid ?? planConfig?.price ?? 0,
      payment_mode: payment_mode ?? "cash",
      notes: notes ?? null,
      created_by: admin.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

// ─── PATCH /api/subscriptions ────────────────────────────────
// Update subscription status, expiry, or notes
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 }
    );
  }

  // Whitelist updatable fields
  const allowed: Record<string, unknown> = {};
  const whitelist = [
    "status",
    "expiry_date",
    "amount_paid",
    "payment_mode",
    "notes",
    "plan",
  ] as const;

  for (const key of whitelist) {
    if (key in updates) {
      allowed[key] = updates[key];
    }
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
