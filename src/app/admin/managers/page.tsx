import { redirect } from "next/navigation";
import { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ManagersManager } from "@/components/admin/ManagersManager";

export const metadata: Metadata = { title: "Manage Managers" };

export default async function ManagersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("users").select("role").eq("id", user!.id).single();

  // Page-level guard: the sidebar hides this link from Managers, but the
  // URL is still reachable directly since the layout only checks
  // admin-OR-manager. True Admin only, enforced here too.
  if (me?.role !== "admin") redirect("/admin/dashboard");

  const admin = createAdminClient();
  const { data: managers } = await admin
    .from("users")
    .select("*")
    .eq("role", "manager")
    .order("created_at", { ascending: false });

  const { data: assignments } = await admin.from("manager_profile_assignments").select("manager_id");
  const assignmentCounts: Record<string, number> = {};
  (assignments || []).forEach((a) => {
    assignmentCounts[a.manager_id] = (assignmentCounts[a.manager_id] || 0) + 1;
  });

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-navy-dark tracking-tight">
          Managers
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          {managers?.length || 0} manager accounts
        </p>
      </div>
      <div className="w-full">
        <ManagersManager managers={managers || []} assignmentCounts={assignmentCounts} />
      </div>
    </div>
  );
}