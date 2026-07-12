import { createClient } from "@/lib/supabase/client";
import { AuditAction } from "@/types";

/**
 * Best-effort audit log write for an admin action taken in the browser.
 * Never throws — a logging failure should never block the action itself
 * (e.g. verifying or deleting a profile must still succeed even if, say,
 * the audit_logs insert is rejected for some unrelated reason).
 */
export async function logAuditAction(params: {
  action: AuditAction;
  entityType: "profile" | "user" | "subscription" | "plan" | "setting" | "match_meeting";
  entityId: string;
  entityName?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: actor } = await supabase
      .from("users")
      .select("role, full_name, email")
      .eq("id", user.id)
      .single();

    await supabase.from("audit_logs").insert([
      {
        actor_id: user.id,
        actor_role: actor?.role || "admin",
        actor_name: actor?.full_name || actor?.email || "Admin",
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName,
        old_value: params.oldValue,
        new_value: params.newValue,
      },
    ]);
  } catch {
    // Swallow — audit logging is best-effort and must never block the UI.
  }
}

/**
 * Best-effort in-app notification for the owner of a profile, e.g. when
 * their profile is verified, approved, etc. No-ops if the profile has no
 * linked user account (admin-created "shadow" profiles).
 */
export async function notifyProfileOwner(params: {
  userId: string | null | undefined;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  actionUrl?: string;
}): Promise<void> {
  if (!params.userId) return;
  try {
    const supabase = createClient();
    await supabase.from("notifications").insert([
      {
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || "success",
        action_url: params.actionUrl,
      },
    ]);
  } catch {
    // Swallow — notifications are best-effort.
  }
}

/**
 * Best-effort in-app notification for every admin user, e.g. when a member
 * submits a new match meeting request that needs admin attention.
 */
export async function notifyAdmins(params: {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  actionUrl?: string;
}): Promise<void> {
  try {
    const supabase = createClient();
    const { data: admins } = await supabase.from("users").select("id").eq("role", "admin");
    if (!admins || admins.length === 0) return;

    await supabase.from("notifications").insert(
      admins.map((admin) => ({
        user_id: admin.id,
        title: params.title,
        message: params.message,
        type: params.type || "info",
        action_url: params.actionUrl,
      }))
    );
  } catch {
    // Swallow — notifications are best-effort.
  }
}

/**
 * Best-effort transactional email. Silently no-ops on failure (e.g. SMTP
 * credentials not configured in this environment) so it never blocks the
 * admin action that triggered it.
 */
export async function sendBestEffortEmail(params: {
  to?: string | null;
  name?: string | null;
  template: "profile_verified" | "profile_approved" | "profile_rejected";
  data?: Record<string, unknown>;
}): Promise<void> {
  if (!params.to) return;
  try {
    await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: params.to,
        name: params.name || "there",
        template: params.template,
        data: params.data || {},
      }),
    });
  } catch {
    // Swallow — email is best-effort.
  }
}
