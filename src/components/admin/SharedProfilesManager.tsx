"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Plus, X, Loader2, Share2, Shield, Search, ChevronDown,
  Eye, EyeOff, SlidersHorizontal, Check, Users, Lock, UserCheck, Calendar
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, cn } from "@/lib/utils";
import {
  PROFILE_SECTIONS,
  defaultVisibleFields,
  isSectionFullyHidden,
  type VisibleFieldsMap,
} from "@/lib/profile-privacy";

interface Props {
  accesses: Record<string, unknown>[];
  users: { id: string; full_name: string | null; email: string; subscriptions?: Record<string, unknown>[] | null }[];
  profiles: Record<string, unknown>[];
}

/** A user counts as "subscribed" if they have any subscription row that's
 * currently active (status = active AND not past its expiry date). */
function isUserSubscribed(user: { subscriptions?: Record<string, unknown>[] | null }): boolean {
  const subs = user.subscriptions || [];
  const now = new Date();
  return subs.some((s) => {
    if (s.status !== "active") return false;
    if (!s.expiry_date) return true;
    return new Date(String(s.expiry_date)) >= now;
  });
}

export function SharedProfilesManager({ accesses, users, profiles }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "subscribed" | "free">("all");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [profileSearch, setProfileSearch] = useState("");
  const [visibleFields, setVisibleFields] = useState<VisibleFieldsMap>(defaultVisibleFields());

  // Editing privacy on an already-shared profile
  const [editingAccess, setEditingAccess] = useState<Record<string, unknown> | null>(null);
  const [editVisibleFields, setEditVisibleFields] = useState<VisibleFieldsMap>(defaultVisibleFields());
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const filteredProfiles = profiles.filter((p) => {
    const personal = p.personal as Record<string, string>;
    const name = [personal?.first_name, personal?.last_name].join(" ").toLowerCase();
    const pid = String(p.profile_id).toLowerCase();
    const q = profileSearch.toLowerCase();
    return !q || name.includes(q) || pid.includes(q);
  });

  const subscribedUsers = users.filter(isUserSubscribed);
  const freeUsers = users.filter((u) => !isUserSubscribed(u));

  const filteredUsers = users
    .filter((u) => {
      if (userFilter === "subscribed") return isUserSubscribed(u);
      if (userFilter === "free") return !isUserSubscribed(u);
      return true;
    })
    .filter((u) => {
      const q = userSearch.toLowerCase();
      return !q ||
        String(u.full_name || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
    });

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllSubscribed = () => {
    const ids = subscribedUsers.map((u) => u.id);
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const selectAllFree = () => {
    const ids = freeUsers.map((u) => u.id);
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearUserSelection = () => setSelectedUserIds([]);

  const toggleProfile = (id: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const resetModal = () => {
    setShowModal(false);
    setSelectedProfiles([]);
    setSelectedUserIds([]);
    setUserSearch("");
    setUserFilter("all");
    setNotes("");
    setExpiresAt("");
    setVisibleFields(defaultVisibleFields());
  };

  const handleShare = async () => {
    if (selectedUserIds.length === 0 || selectedProfiles.length === 0) {
      toast.error("Select at least one member and one profile");
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const inserts = selectedUserIds.flatMap((userId) =>
        selectedProfiles.map((profileId) => ({
          granted_to_user_id: userId,
          profile_id: profileId,
          granted_by_admin_id: user?.id,
          expires_at: expiresAt || null,
          notes: notes || null,
          is_active: true,
          visible_fields: visibleFields,
        }))
      );

      const { error } = await supabase
        .from("profile_access")
        .upsert(inserts, { onConflict: "granted_to_user_id,profile_id" });

      if (error) throw error;

      toast.success(
        `Shared ${selectedProfiles.length} profile(s) with ${selectedUserIds.length} member(s)!`
      );
      resetModal();
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to share profiles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke access to this profile?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profile_access")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
      toast.success("Access revoked");
      router.refresh();
    } catch {
      toast.error("Failed to revoke access");
    }
  };

  const openEditPrivacy = (access: Record<string, unknown>) => {
    setEditingAccess(access);
    setEditVisibleFields(
      (access.visible_fields as VisibleFieldsMap | null) || defaultVisibleFields()
    );
  };

  const handleSavePrivacy = async () => {
    if (!editingAccess) return;
    setIsSavingEdit(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profile_access")
        .update({ visible_fields: editVisibleFields })
        .eq("id", String(editingAccess.id));
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: actorData } = await supabase
        .from("users").select("full_name, role").eq("id", user?.id).single();
      await supabase.from("audit_logs").insert([{
        actor_id: user?.id,
        actor_role: actorData?.role || "admin",
        actor_name: actorData?.full_name || user?.email,
        action: "profile_share_updated",
        entity_type: "profile_access",
        entity_id: String(editingAccess.id),
      }]);

      toast.success("Privacy settings updated");
      setEditingAccess(null);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update privacy settings");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="luxury-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold-dark">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-navy-dark text-lg">Profile Access Log</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold/15 text-gold-dark border border-gold/30">
                  {accesses.filter((a) => a.is_active).length} active
                </span>
              </div>
              <p className="text-xs text-gray-400">Manage member visibility and custom privacy rules</p>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowModal(true)} 
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold text-navy-dark font-bold text-xs hover:bg-gold-dark hover:text-white transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Share Profiles
          </motion.button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-150 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3.5 px-5">Member</th>
                <th className="py-3.5 px-5">Profile Shared</th>
                <th className="py-3.5 px-5">Granted On</th>
                <th className="py-3.5 px-5">Expires</th>
                <th className="py-3.5 px-5">Visibility</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {accesses.length > 0 ? (
                accesses.map((a) => {
                  const user = a.users as Record<string, unknown> | null;
                  const profile = a.profiles as Record<string, unknown> | null;
                  const personal = profile?.personal as Record<string, string> | null;
                  const vf = a.visible_fields as VisibleFieldsMap | null;
                  const restrictedCount = vf
                    ? PROFILE_SECTIONS.filter((s) => isSectionFullyHidden(vf, s.key)).length
                    : 0;
                  return (
                    <tr key={String(a.id)} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-navy-dark text-sm truncate">{String(user?.full_name || "—")}</p>
                        <p className="text-xs text-gray-400 truncate">{String(user?.email || "")}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-navy-dark text-sm truncate">
                          {[personal?.first_name, personal?.last_name].filter(Boolean).join(" ") || "—"}
                        </p>
                        <p className="text-xs text-gold-dark font-mono font-bold">{String(profile?.profile_id || "")}</p>
                      </td>
                      <td className="py-3.5 px-5 text-xs font-medium text-gray-600">{formatDate(String(a.granted_at))}</td>
                      <td className="py-3.5 px-5 text-xs font-medium text-gray-600">
                        {a.expires_at ? formatDate(String(a.expires_at)) : "Lifetime"}
                      </td>
                      <td className="py-3.5 px-5">
                        {vf ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-navy-dark text-white inline-flex items-center gap-1 shadow-2xs">
                            <EyeOff className="w-3 h-3 text-gold" />
                            {restrictedCount > 0 ? `${restrictedCount} section(s) hidden` : "Customized"}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 inline-flex items-center gap-1">
                            <Eye className="w-3 h-3 text-gray-400" /> Full profile
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1",
                          a.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", a.is_active ? "bg-emerald-500" : "bg-gray-400")} />
                          {a.is_active ? "Active" : "Revoked"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {!!a.is_active && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditPrivacy(a)}
                              className="p-1.5 rounded-lg hover:bg-gold/15 text-navy-dark hover:text-gold-dark font-medium transition-colors"
                              title="Configure Privacy Rules"
                            >
                              <SlidersHorizontal className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRevoke(String(a.id))}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 font-medium transition-colors"
                              title="Revoke Access"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 bg-gray-50/30">
                    <Share2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-navy-dark">No Profiles Shared Yet</p>
                    <p className="text-xs text-gray-400 mt-0.5">Use the button above to grant member access to locked profiles.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={resetModal}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col z-10 overflow-hidden border border-gray-100"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gold/15 text-gold-dark">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-navy-dark">Share Profiles</h2>
                    <p className="text-xs text-gray-400">Grant controlled access to selected matrimonial candidates</p>
                  </div>
                </div>
                <button onClick={resetModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                {/* Step 1: Select members */}
                <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-150/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy-dark flex items-center gap-2">
                      <Users className="w-4 h-4 text-gold-dark" /> 1. Select Member(s) *
                      {selectedUserIds.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-gold text-navy-dark font-bold">
                          {selectedUserIds.length} selected
                        </span>
                      )}
                    </label>

                    <div className="flex items-center gap-2 text-xs">
                      <button type="button" onClick={selectAllSubscribed} className="font-semibold text-gold-dark hover:underline">
                        All Subscribed ({subscribedUsers.length})
                      </button>
                      <span className="text-gray-300">•</span>
                      <button type="button" onClick={selectAllFree} className="font-semibold text-navy-dark hover:underline">
                        All Free ({freeUsers.length})
                      </button>
                      <span className="text-gray-300">•</span>
                      <button type="button" onClick={clearUserSelection} className="font-medium text-gray-400 hover:text-gray-600">
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        className="w-full text-xs font-medium text-navy-dark bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/40"
                        placeholder="Search members by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 w-full sm:w-auto">
                      {(["all", "subscribed", "free"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setUserFilter(f)}
                          className={cn(
                            "flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all",
                            userFilter === f
                              ? "bg-navy-dark text-white border-navy-dark shadow-2xs"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border border-gray-200/80 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white divide-y divide-gray-100 custom-scrollbar">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => {
                        const isSelected = selectedUserIds.includes(u.id);
                        const subscribed = isUserSubscribed(u);
                        return (
                          <label
                            key={u.id}
                            className={cn(
                              "flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors text-xs",
                              isSelected ? "bg-gold/10 font-semibold" : "hover:bg-gray-50"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleUser(u.id)}
                              className="rounded border-gray-300 text-gold focus:ring-gold w-4 h-4"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-navy-dark truncate">{u.full_name || u.email}</p>
                              <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                            </div>
                            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase", subscribed ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-gray-100 text-gray-500")}>
                              {subscribed ? "Subscribed" : "Free"}
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-gray-400 text-xs">No matching members found</div>
                    )}
                  </div>
                </div>

                {/* Step 2: Select profiles */}
                <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-150/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy-dark flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-gold-dark" /> 2. Select Profiles to Share *
                      {selectedProfiles.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-gold text-navy-dark font-bold">
                          {selectedProfiles.length} selected
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className="w-full text-xs font-medium text-navy-dark bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/40"
                      placeholder="Search profiles by name or ID..."
                      value={profileSearch}
                      onChange={(e) => setProfileSearch(e.target.value)}
                    />
                  </div>

                  <div className="border border-gray-200/80 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white divide-y divide-gray-100 custom-scrollbar">
                    {filteredProfiles.length > 0 ? (
                      filteredProfiles.map((p) => {
                        const personal = p.personal as Record<string, string>;
                        const name = [personal?.first_name, personal?.last_name].filter(Boolean).join(" ");
                        const isSelected = selectedProfiles.includes(String(p.id));
                        return (
                          <label
                            key={String(p.id)}
                            className={cn(
                              "flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors text-xs",
                              isSelected ? "bg-gold/10 font-semibold" : "hover:bg-gray-50"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleProfile(String(p.id))}
                              className="rounded border-gray-300 text-gold focus:ring-gold w-4 h-4"
                            />
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gold/15 border border-gold/30 flex items-center justify-center flex-shrink-0">
                              {(p.images as Record<string, string | null>)?.profile_photo ? (
                                <img src={(p.images as Record<string, string | null>).profile_photo!} alt={personal?.first_name ? `${personal.first_name}'s profile photo` : "Profile photo"} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-gold-dark text-xs font-bold">{personal?.first_name?.[0] || "?"}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-navy-dark truncate">{name || "—"}</p>
                              <p className="text-[11px] text-gold-dark font-mono font-bold">{String(p.profile_id)}</p>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-gray-400 text-xs">No matching profiles found</div>
                    )}
                  </div>
                </div>

                {/* Step 3: Privacy Controls */}
                <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-150/80 space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy-dark flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gold-dark" /> 3. Configure Visibility & Privacy Rules
                  </label>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Uncheck any section or field below to hide it from this share. This rule will apply to every member/profile pair selected above.
                  </p>
                  <PrivacyFieldEditor value={visibleFields} onChange={setVisibleFields} />
                </div>

                {/* Step 4: Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Expiration Date (Optional)
                    </label>
                    <input
                      type="date"
                      className="w-full text-xs font-medium text-navy-dark bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/40"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Internal Notes (Optional)</label>
                    <input
                      className="w-full text-xs font-medium text-navy-dark bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/40"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="E.g., Shared on family request"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-gray-50/50">
                <button
                  onClick={resetModal}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-white text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                  disabled={isLoading || selectedUserIds.length === 0 || selectedProfiles.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold text-navy-dark font-bold text-xs hover:bg-gold-dark hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  Share {selectedProfiles.length > 0 ? `${selectedProfiles.length} Profile(s)` : "Profiles"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Privacy Modal (existing share) */}
      <AnimatePresence>
        {editingAccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingAccess(null)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col z-10 overflow-hidden border border-gray-100"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
                <div>
                  <h2 className="font-serif text-xl font-bold text-navy-dark">Edit Privacy Settings</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Controls exactly what {String((editingAccess.users as Record<string, unknown> | null)?.full_name || "this member")} can see for this profile.
                  </p>
                </div>
                <button onClick={() => setEditingAccess(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <PrivacyFieldEditor value={editVisibleFields} onChange={setEditVisibleFields} />
              </div>

              <div className="p-5 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-gray-50/50">
                <button
                  onClick={() => setEditingAccess(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-white text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSavePrivacy}
                  disabled={isSavingEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold text-navy-dark font-bold text-xs hover:bg-gold-dark hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Privacy Settings
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Reusable per-section / per-field checkbox editor ───────────

function PrivacyFieldEditor({
  value,
  onChange,
}: {
  value: VisibleFieldsMap;
  onChange: (v: VisibleFieldsMap) => void;
}) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleOpen = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const sectionState = (sectionKey: string) => {
    const fields = PROFILE_SECTIONS.find((s) => s.key === sectionKey)!.fields;
    const vals = fields.map((f) => !!value[sectionKey]?.[f.key]);
    const allOn = vals.every(Boolean);
    const allOff = vals.every((v) => !v);
    return { allOn, allOff, indeterminate: !allOn && !allOff };
  };

  const setSectionAll = (sectionKey: string, on: boolean) => {
    const fields = PROFILE_SECTIONS.find((s) => s.key === sectionKey)!.fields;
    const next = { ...value, [sectionKey]: { ...value[sectionKey] } };
    for (const f of fields) next[sectionKey][f.key] = on;
    onChange(next);
  };

  const setField = (sectionKey: string, fieldKey: string, on: boolean) => {
    const next = { ...value, [sectionKey]: { ...value[sectionKey], [fieldKey]: on } };
    onChange(next);
  };

  const setAllSections = (on: boolean) => {
    const next: VisibleFieldsMap = {};
    for (const section of PROFILE_SECTIONS) {
      next[section.key] = {};
      for (const f of section.fields) next[section.key][f.key] = on;
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pt-1 pb-1">
        <button
          type="button"
          onClick={() => setAllSections(true)}
          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200/80 text-xs font-semibold text-navy-dark hover:border-gold hover:text-gold-dark flex items-center gap-1.5 transition-all shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5 text-gold-dark" /> Show Everything
        </button>
        <button
          type="button"
          onClick={() => setAllSections(false)}
          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200/80 text-xs font-semibold text-gray-600 hover:border-rose-400 hover:text-rose-600 flex items-center gap-1.5 transition-all shadow-2xs"
        >
          <EyeOff className="w-3.5 h-3.5 text-gray-400" /> Hide Everything
        </button>
      </div>

      <div className="border border-gray-200/80 rounded-xl divide-y divide-gray-100 overflow-hidden bg-white shadow-2xs">
        {PROFILE_SECTIONS.map((section) => {
          const { allOn, indeterminate } = sectionState(section.key);
          const isOpen = openSections.has(section.key);
          return (
            <div key={section.key} className={cn("transition-colors", isOpen ? "bg-gray-50/40" : "bg-white")}>
              <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/80 transition-colors">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={allOn}
                    ref={(el) => { if (el) el.indeterminate = indeterminate; }}
                    onChange={(e) => setSectionAll(section.key, e.target.checked)}
                    className="rounded border-gray-300 text-gold focus:ring-gold w-4 h-4"
                  />
                  <span className="text-xs font-bold text-navy-dark tracking-wide">{section.label}</span>
                  {indeterminate && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">partial</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => toggleOpen(section.key)}
                  className="p-1.5 text-gray-400 hover:text-navy-dark hover:bg-gray-100 rounded-lg transition-all"
                >
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")} />
                </button>
              </div>

              {isOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 px-6 py-3 bg-gray-50/80 border-t border-gray-100"
                >
                  {section.fields.map((field) => (
                    <label key={field.key} className="flex items-center gap-2.5 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={!!value[section.key]?.[field.key]}
                        onChange={(e) => setField(section.key, field.key, e.target.checked)}
                        className="rounded border-gray-300 text-gold focus:ring-gold w-3.5 h-3.5"
                      />
                      <span className="text-xs font-medium text-gray-700">{field.label}</span>
                    </label>
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}