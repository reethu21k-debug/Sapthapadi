import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { UserSidebar } from "@/components/user/UserSidebar";
import { UserTopbar } from "@/components/user/UserTopbar";
import type { Metadata } from "next";

// Members' private dashboards/profile pages must never be indexed —
// see matching note in admin/layout.tsx.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Self-heal: if the auth user exists but has no matching row in
  // public.users (e.g. the `handle_new_user` trigger wasn't installed, or
  // the row was deleted), create it now instead of bouncing the user back
  // to /login forever (that bounce is what was causing the redirect loop).
  if (!userData) {
    const admin = await createAdminClient();
    const { data: created, error: createError } = await admin
      .from("users")
      .insert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name ?? user.email,
        phone: user.user_metadata?.phone ?? null,
      })
      .select("*")
      .single();

    if (createError) {
      console.error("Failed to self-heal missing public.users row:", createError.message);
    }
    userData = created;
  }

  if (!userData) redirect("/login");
  if (userData.role === "admin") redirect("/admin/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, profile_id, profile_completion, status, is_verified, images")
    .eq("user_id", user.id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, subscription_plans(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const { data: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact" })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <UserSidebar user={userData} profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <UserTopbar user={userData} subscription={subscription} unreadCount={unreadCount?.length || 0} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}