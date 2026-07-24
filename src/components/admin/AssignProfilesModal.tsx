"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { X, Search, Loader2, Check } from "lucide-react";

interface ProfileLite {
  id: string;
  profile_id: string;
  personal: { first_name?: string; last_name?: string };
  gender: string;
}

interface Props {
  manager: { id: string; full_name?: string; email?: string } | null;
  initialAssignedProfileIds: string[];
  onClose: () => void;
  onSaved: () => void;
}

export function AssignProfilesModal({ manager, initialAssignedProfileIds, onClose, onSaved }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileLite[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (manager) setSelected(new Set(initialAssignedProfileIds));
  }, [manager, initialAssignedProfileIds]);

  useEffect(() => {
    if (!manager) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/profiles-lite?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.profiles || []);
      } catch {
        toast.error("Failed to search profiles");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, manager]);

  if (!manager) return null;

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
      const res = await fetch("/api/admin/manager-assignments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manager_id: manager.id, profile_ids: [...selected] }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Assigned profiles updated");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save assignments");
    } finally {
      setSaving(false);
    }
  };

  const name = (p: ProfileLite) =>
    `${p.personal?.first_name || ""} ${p.personal?.last_name || ""}`.trim() || p.profile_id;

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-md md:max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif font-bold text-navy-dark text-base sm:text-lg truncate">Assign Profiles</h3>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{manager.full_name || manager.email}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3.5 sm:p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or profile ID..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3">
            {loading && (
              <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Searching...
              </div>
            )}
            {!loading && results.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">No profiles found</p>
            )}
            {!loading && results.map((p) => (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className="w-full flex items-center justify-between gap-3 px-2.5 sm:px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy-dark truncate">{name(p)}</p>
                  <p className="text-xs text-gray-400 truncate">{p.profile_id}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${selected.has(p.id) ? "bg-gold border-gold" : "border-gray-300"}`}>
                  {selected.has(p.id) && <Check className="w-3.5 h-3.5 text-navy-dark" />}
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/50">
            <span className="text-xs text-gray-500 text-center sm:text-left font-medium">
              {selected.size} profile{selected.size !== 1 ? "s" : ""} selected
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
                {saving ? "Saving..." : "Save Assignments"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}