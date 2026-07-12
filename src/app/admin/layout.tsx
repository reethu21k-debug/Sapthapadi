import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import type { Metadata } from "next";

// Defense-in-depth: robots.txt already disallows /admin, and next.config.ts
// sends an X-Robots-Tag header for it too, but an explicit noindex here
// ensures it holds even if a page under /admin is ever fetched directly
// (e.g. via a leaked link) bypassing the disallow rule.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "admin") redirect("/user/dashboard");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar user={userData} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar user={userData} />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
