"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { X, Check, Loader2 } from "lucide-react";

interface ManagerOption {
  id: string;
  full_name?: string;
  email: string;
}

interface Props {
  profile: { id: string; profile_id: string; personal?: { first_name?: string; last_name?: string } } | null;
  managers: ManagerOption[];
  onClose: () => void;
  onSaved: () => void;
}

export function AssignManagersToProfileModal({ profile, managers, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    fetch(`/api/admin/manager-assignments?profile_id=${profile.id}`)
      .then((res) => res.json())
      .then((data) => {
        setSelected(new Set((data.assignments || []).map((a: { manager_id: string }) => a.manager_id)));
      })
      .catch(() => setSelected(new Set()))
      .finally(() => setLoading(false));
  }, [profile]);

  if (!profile) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/manager-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profile.id, manager_ids: [...selected] }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Manager assignments updated");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save assignments");
    } finally {
      setSaving(false);
    }
  };

  const name = [profile.personal?.first_name, profile.personal?.last_name].filter(Boolean).join(" ") || profile.profile_id;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-sm md:max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden"
        >
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif font-bold text-navy-dark text-base sm:text-lg truncate">Assign to Manager(s)</h3>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{name}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 sm:p-3">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : managers.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No Manager accounts yet.</p>
            ) : (
              managers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggle(m.id)}
                  className="w-full flex items-center justify-between gap-3 px-2.5 sm:px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-dark truncate">{m.full_name || m.email}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${selected.has(m.id) ? "bg-gold border-gold" : "border-gray-300"}`}>
                    {selected.has(m.id) && <Check className="w-3.5 h-3.5 text-navy-dark" />}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/50">
            <span className="text-xs text-gray-500 text-center sm:text-left font-medium">
              {selected.size} manager{selected.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={onClose} 
                className="flex-1 sm:flex-initial px-4 py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-center"
              >
                Cancel
              </button>
              <button 
                onClick={save} 
                disabled={saving} 
                className="btn-gold flex-1 sm:flex-initial px-4 py-2 text-sm disabled:opacity-60 text-center flex items-center justify-center"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}