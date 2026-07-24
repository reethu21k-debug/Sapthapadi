"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { UserPlus, ShieldCheck, UserX, UserCheck, Trash2, Users2, X } from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { AssignProfilesModal } from "@/components/admin/AssignProfilesModal";

interface ManagerRow {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

interface Props {
  managers: ManagerRow[];
  assignmentCounts: Record<string, number>;
}

export function ManagersManager({ managers, assignmentCounts }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [assigningManager, setAssigningManager] = useState<ManagerRow | null>(null);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);

  const createManager = async () => {
    if (!form.email || !form.password) {
      toast.error("Email and password are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create manager");
      toast.success("Manager account created");
      setShowCreate(false);
      setForm({ full_name: "", email: "", password: "" });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create manager");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (manager: ManagerRow) => {
    const nextActive = !manager.is_active;
    if (!confirm(`${nextActive ? "Reactivate" : "Deactivate"} ${manager.email}?`)) return;
    try {
      const res = await fetch(`/api/admin/managers/${manager.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActive }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(nextActive ? "Manager reactivated" : "Manager deactivated");
      router.refresh();
    } catch {
      toast.error("Failed to update manager status");
    }
  };

  const deleteManager = async (manager: ManagerRow) => {
    if (!confirm(`Permanently delete ${manager.email}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/managers/${manager.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Manager account deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete manager");
    }
  };

  const openAssign = async (manager: ManagerRow) => {
    try {
      const res = await fetch(`/api/admin/manager-assignments?manager_id=${manager.id}`);
      const data = await res.json();
      setAssignedIds((data.assignments || []).map((a: { profile_id: string }) => a.profile_id));
    } catch {
      setAssignedIds([]);
    }
    setAssigningManager(manager);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="luxury-card overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm"
    >
      <AssignProfilesModal
        manager={assigningManager}
        initialAssignedProfileIds={assignedIds}
        onClose={() => setAssigningManager(null)}
        onSaved={() => router.refresh()}
      />

      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-gold/15 text-gold-dark shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif font-bold text-navy-dark text-base sm:text-lg truncate">Manager Accounts</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">Managers have full admin-panel access to help distribute workload</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold w-full sm:w-fit justify-center flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Manager
        </button>
      </div>

      {/* Mobile Card Layout (< md) */}
      <div className="block md:hidden divide-y divide-gray-100">
        {managers.length > 0 ? managers.map((m) => (
          <div key={m.id} className="p-4 space-y-3 bg-white hover:bg-gray-50/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-navy/5 border border-navy/10 flex items-center justify-center text-navy-dark font-bold text-xs shrink-0">
                  {getInitials(m.full_name || m.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy-dark text-sm truncate">{m.full_name || "Unnamed Manager"}</p>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                </div>
              </div>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5 shrink-0",
                m.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", m.is_active ? "bg-emerald-500" : "bg-rose-500")} />
                {m.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>Joined: {formatDate(m.created_at)}</span>
              <button
                onClick={() => openAssign(m)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold text-sky-700 bg-sky-50 border border-sky-200/80 hover:bg-sky-100"
              >
                <Users2 className="w-3.5 h-3.5" /> {assignmentCounts[m.id] || 0} assigned
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
              <button
                onClick={() => toggleActive(m)}
                className={cn(
                  "flex-1 justify-center inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold border",
                  m.is_active ? "text-amber-700 bg-amber-50 border-amber-200/80 hover:bg-amber-100" : "text-emerald-700 bg-emerald-50 border-emerald-200/80 hover:bg-emerald-100"
                )}
              >
                {m.is_active ? <><UserX className="w-3.5 h-3.5" /> Deactivate</> : <><UserCheck className="w-3.5 h-3.5" /> Activate</>}
              </button>
              <button
                onClick={() => deleteManager(m)}
                className="flex-1 justify-center inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 hover:bg-rose-100"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-16 px-4 text-gray-400">
            <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-navy-dark">No Manager Accounts Yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Add a Manager to help distribute profile workload.</p>
          </div>
        )}
      </div>

      {/* Desktop Table Layout (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-150 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              <th className="py-3.5 px-5">Manager</th>
              <th className="py-3.5 px-5">Assigned Profiles</th>
              <th className="py-3.5 px-5">Joined</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {managers.length > 0 ? managers.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="py-3.5 px-5 max-w-[240px] lg:max-w-[300px]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-navy/5 border border-navy/10 flex items-center justify-center text-navy-dark font-bold text-xs shrink-0">
                      {getInitials(m.full_name || m.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-navy-dark text-sm truncate">{m.full_name || "Unnamed Manager"}</p>
                      <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-5 whitespace-nowrap">
                  <button
                    onClick={() => openAssign(m)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold text-sky-700 bg-sky-50 border border-sky-200/80 hover:bg-sky-100 transition-colors"
                  >
                    <Users2 className="w-3.5 h-3.5" /> {assignmentCounts[m.id] || 0} assigned
                  </button>
                </td>
                <td className="py-3.5 px-5 text-xs text-gray-500 whitespace-nowrap">{formatDate(m.created_at)}</td>
                <td className="py-3.5 px-5 whitespace-nowrap">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5",
                    m.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", m.is_active ? "bg-emerald-500" : "bg-rose-500")} />
                    {m.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3.5 px-5 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => toggleActive(m)}
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold border transition-colors",
                        m.is_active ? "text-amber-700 bg-amber-50 border-amber-200/80 hover:bg-amber-100" : "text-emerald-700 bg-emerald-50 border-emerald-200/80 hover:bg-emerald-100"
                      )}
                    >
                      {m.is_active ? <><UserX className="w-3.5 h-3.5" /> Deactivate</> : <><UserCheck className="w-3.5 h-3.5" /> Activate</>}
                    </button>
                    <button
                      onClick={() => deleteManager(m)}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center py-16 text-gray-400">
                  <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-navy-dark">No Manager Accounts Yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">Add a Manager to help distribute profile workload.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Manager Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-sm p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-navy-dark text-base sm:text-lg">Add Manager</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Full name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
              <input
                type="password"
                placeholder="Password (min 8 characters)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>
            <button onClick={createManager} disabled={creating} className="btn-gold w-full mt-5 justify-center disabled:opacity-60 flex items-center">
              {creating ? "Creating..." : "Create Manager Account"}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}