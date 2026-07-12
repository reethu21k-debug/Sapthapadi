"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Ban, RefreshCw, Search, Users, Shield, UserX, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, cn, PLAN_LABELS, getDaysRemaining } from "@/lib/utils";

interface Props {
  users: Record<string, unknown>[];
}

export function UsersManager({ users }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q ||
      String(u.full_name || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q);
  });

  const toggleActive = async (userId: string, isActive: boolean) => {
    if (!confirm(`${isActive ? "Deactivate" : "Activate"} this user account?`)) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ is_active: !isActive })
        .eq("id", userId);
      if (error) throw error;
      toast.success(isActive ? "User account deactivated" : "User account activated");
      router.refresh();
    } catch {
      toast.error("Failed to update user status");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="luxury-card overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm"
    >
      {/* Top Header & Search Bar */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gold/15 text-gold-dark">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-navy-dark text-lg">Registered Users</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                {filtered.length} total
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Manage registered accounts, administrative roles, and system access</p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium text-navy-dark bg-white border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all shadow-2xs placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Main Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-150 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              <th className="py-3.5 px-5">User & Contact</th>
              <th className="py-3.5 px-5">Role</th>
              <th className="py-3.5 px-5">Linked Profile</th>
              <th className="py-3.5 px-5">Subscription Status</th>
              <th className="py-3.5 px-5">Joined On</th>
              <th className="py-3.5 px-5">Account Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length > 0 ? (
              filtered.map((u) => {
                const profile = Array.isArray(u.profiles) ? u.profiles[0] : u.profiles;
                const subscriptions = Array.isArray(u.subscriptions) ? u.subscriptions : [];
                const activeSub = subscriptions.find((s: Record<string, unknown>) => s.status === "active");
                const daysLeft = activeSub?.expiry_date ? getDaysRemaining(String(activeSub.expiry_date)) : null;
                const initial = String(u.full_name || u.email || "?")[0].toUpperCase();

                return (
                  <tr key={String(u.id)} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0 text-navy-dark font-bold text-xs shadow-2xs">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-navy-dark text-sm truncate">
                            {String(u.full_name || "Unnamed User")}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{String(u.email || "")}</p>
                          {!!u.phone && <p className="text-[11px] text-gray-400 font-mono mt-0.5">{String(u.phone)}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border shadow-2xs",
                        u.role === "admin" ? "bg-navy-dark text-white border-navy-dark" : "bg-gray-100 text-gray-600 border-gray-200"
                      )}>
                        {u.role === "admin" && <Shield className="w-3 h-3 text-gold" />}
                        {String(u.role || "member")}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      {profile ? (
                        <div>
                          <a 
                            href={`/admin/profiles/${String(profile.id)}`} 
                            className="inline-block px-2 py-0.5 rounded bg-gold/10 text-gold-dark font-mono font-bold text-xs border border-gold/20 hover:bg-gold hover:text-navy-dark transition-all"
                          >
                            {String(profile.profile_id || "—")}
                          </a>
                          <p className="text-[11px] text-gray-400 capitalize font-medium mt-1">
                            {String(profile.status || "draft")}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs font-medium italic">No profile linked</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      {activeSub ? (
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            {PLAN_LABELS[String(activeSub.plan)] || String(activeSub.plan)}
                          </span>
                          {daysLeft !== null && (
                            <p className={cn("text-[11px] font-medium mt-1", daysLeft <= 30 ? "text-amber-600 font-bold" : "text-gray-400")}>
                              {daysLeft > 0 ? `${daysLeft} days remaining` : "Expiring soon"}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                          Free tier
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-xs font-medium text-gray-500 whitespace-nowrap">
                      {formatDate(String(u.created_at))}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5 shadow-2xs",
                        u.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", u.is_active ? "bg-emerald-500" : "bg-rose-500")} />
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      {u.role !== "admin" ? (
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => toggleActive(String(u.id), Boolean(u.is_active))}
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold transition-all shadow-2xs border",
                            u.is_active
                              ? "text-amber-700 bg-amber-50 border-amber-200/80 hover:bg-amber-100"
                              : "text-emerald-700 bg-emerald-50 border-emerald-200/80 hover:bg-emerald-100"
                          )}
                        >
                          {u.is_active ? (
                            <>
                              <UserX className="w-3.5 h-3.5 text-amber-600" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Activate
                            </>
                          )}
                        </motion.button>
                      ) : (
                        <span className="text-gray-300 text-xs font-medium italic">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-400 bg-gray-50/30">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-navy-dark">No Registered Users Found</p>
                  <p className="text-xs text-gray-400 mt-0.5">Adjust your search filter or clear keywords to view accounts.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}