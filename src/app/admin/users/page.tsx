import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UsersManager } from "@/components/admin/UsersManager";

export const metadata: Metadata = { title: "Manage Users" };

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select(`
      *,
      profiles!profiles_user_id_fkey(id, profile_id, status, profile_completion),
      subscriptions(plan, status, expiry_date)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Users</h1>
        <p className="text-gray-500 text-sm mt-1">{users?.length || 0} registered users</p>
      </div>
      <UsersManager users={users || []} />
    </div>
  );
}