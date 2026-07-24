"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { X, Search, Loader2, Check, HeartHandshake, Calendar, MapPin, User, IdCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { logAuditAction, notifyProfileOwner } from "@/lib/audit";

type PartyKind = "user" | "profile";

interface ProfileLite {
  id: string;
  profile_id: string;
  personal: { first_name?: string; last_name?: string };
  gender: string;
}

interface UserLite {
  id: string;
  full_name?: string;
  email?: string;
}

interface PartyState {
  kind: PartyKind;
  query: string;
  results: (ProfileLite | UserLite)[];
  loading: boolean;
  selected: ProfileLite | UserLite | null;
}

const emptyParty = (kind: PartyKind): PartyState => ({
  kind,
  query: "",
  results: [],
  loading: false,
  selected: null,
});

function isProfileLite(p: ProfileLite | UserLite): p is ProfileLite {
  return (p as ProfileLite).profile_id !== undefined;
}

function partyLabel(p: ProfileLite | UserLite | null): string {
  if (!p) return "";
  if (isProfileLite(p)) {
    return [p.personal?.first_name, p.personal?.last_name].filter(Boolean).join(" ") || p.profile_id;
  }
  return p.full_name || p.email || "Member";
}

function partySubLabel(p: ProfileLite | UserLite | null): string {
  if (!p) return "";
  if (isProfileLite(p)) return p.profile_id;
  return p.email || "";
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: "admin" | "manager";
  /** Profile ids this manager is allowed to touch. Undefined = no restriction (admin). */
  assignedProfileIds?: string[];
  onLogged: () => void;
}

/**
 * Independent picker for one side of a manual match meeting. The party can
 * be toggled between "Member" (a user account) and "Profile" (a biodata
 * profile) — each toggle re-runs search against the matching endpoint.
 */
function PartyPicker({
  label,
  state,
  setState,
  restrictToProfileIds,
}: {
  label: string;
  state: PartyState;
  setState: (s: PartyState) => void;
  restrictToProfileIds?: string[];
}) {
  useEffect(() => {
    const t = setTimeout(async () => {
      setState({ ...state, loading: true });
      try {
        const endpoint = state.kind === "profile" ? "/api/admin/profiles-lite" : "/api/admin/users-lite";
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(state.query)}`);
        const data = await res.json();
        let results: (ProfileLite | UserLite)[] = state.kind === "profile" ? data.profiles || [] : data.users || [];
        if (state.kind === "profile" && restrictToProfileIds) {
          results = (results as ProfileLite[]).filter((p) => restrictToProfileIds.includes(p.id));
        }
        setState({ ...state, results, loading: false });
      } catch {
        toast.error("Search failed");
        setState({ ...state, loading: false });
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.query, state.kind]);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-gray-50/80 border-b border-gray-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setState({ ...emptyParty("profile") })}
            className={cn(
              "flex-1 sm:flex-initial px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1",
              state.kind === "profile" ? "bg-gold text-navy-dark" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <IdCard className="w-3 h-3 flex-shrink-0" /> Profile
          </button>
          <button
            type="button"
            onClick={() => setState({ ...emptyParty("user") })}
            className={cn(
              "flex-1 sm:flex-initial px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center justify-center gap-1",
              state.kind === "user" ? "bg-gold text-navy-dark" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <User className="w-3 h-3 flex-shrink-0" /> Member
          </button>
        </div>
      </div>

      {state.selected ? (
        <div className="p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy-dark truncate">{partyLabel(state.selected)}</p>
            <p className="text-xs text-gray-400 truncate">{partySubLabel(state.selected)}</p>
          </div>
          <button
            type="button"
            onClick={() => setState({ ...state, selected: null })}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div className="p-2.5 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={state.query}
                onChange={(e) => setState({ ...state, query: e.target.value })}
                placeholder={state.kind === "profile" ? "Search by name or profile ID..." : "Search by name or email..."}
                className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>
          </div>
          <div className="max-h-40 sm:max-h-44 overflow-y-auto">
            {state.loading && (
              <div className="flex items-center justify-center py-4 text-gray-400 text-xs gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...
              </div>
            )}
            {!state.loading && state.results.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-4">No results</p>
            )}
            {!state.loading &&
              state.results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setState({ ...state, selected: r })}
                  className="w-full flex items-center justify-between gap-2 sm:gap-3 px-3 py-2.5 sm:py-2 hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-navy-dark truncate">{partyLabel(r)}</p>
                    <p className="text-[11px] text-gray-400 truncate">{partySubLabel(r)}</p>
                  </div>
                  <Check className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

export function LogMatchMeetingModal({ isOpen, onClose, currentUserRole, assignedProfileIds, onLogged }: Props) {
  const [partyA, setPartyA] = useState<PartyState>(emptyParty("profile"));
  const [partyB, setPartyB] = useState<PartyState>(emptyParty("profile"));
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isManager = currentUserRole === "manager";

  useEffect(() => {
    if (isOpen) {
      setPartyA(emptyParty("profile"));
      setPartyB(emptyParty("profile"));
      setMeetingDate("");
      setMeetingLocation("");
      setNotes("");
    }
  }, [isOpen]);

  // Side B (`profile_id` column) must always resolve to a profile. If the
  // admin picks "Member" for side B, we still need that member's linked
  // profile id to satisfy the NOT NULL profile_id column — members without
  // a linked profile can't be used on side B at all.
  const resolveProfileIdForUserParty = async (userId: string): Promise<string | null> => {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle();
    return data?.id || null;
  };

  const canSave = !!partyA.selected && !!partyB.selected && !isSaving;

  const handleSave = async () => {
    if (!partyA.selected || !partyB.selected) return;

    // Guard: a manager may only log meetings where every profile involved
    // is one they're assigned to (server-side RLS enforces this too, but
    // check client-side first for a clean error message).
    if (isManager && assignedProfileIds) {
      const profileIdsInvolved = [
        partyA.kind === "profile" ? (partyA.selected as ProfileLite).id : null,
        partyB.kind === "profile" ? (partyB.selected as ProfileLite).id : null,
      ].filter(Boolean) as string[];
      const disallowed = profileIdsInvolved.some((id) => !assignedProfileIds.includes(id));
      if (disallowed) {
        toast.error("You can only log meetings for profiles assigned to you.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Resolve side B to a profile_id no matter which kind was picked.
      let profileIdSideB: string | null = null;
      if (partyB.kind === "profile") {
        profileIdSideB = (partyB.selected as ProfileLite).id;
      } else {
        profileIdSideB = await resolveProfileIdForUserParty((partyB.selected as UserLite).id);
        if (!profileIdSideB) {
          toast.error("This member has no linked profile, so they can't be used as the meeting profile. Try swapping sides.");
          setIsSaving(false);
          return;
        }
      }

      const insertData: Record<string, unknown> = {
        profile_id: profileIdSideB,
        requested_by_user_id: partyA.kind === "user" ? (partyA.selected as UserLite).id : null,
        requested_by_profile_id: partyA.kind === "profile" ? (partyA.selected as ProfileLite).id : null,
        status: "completed",
        is_manual: true,
        logged_by_id: user?.id,
        completed_by_admin_id: user?.id,
        completed_at: new Date().toISOString(),
        meeting_date: meetingDate || null,
        meeting_location: meetingLocation || null,
        admin_notes: notes || null,
      };

      const { data: inserted, error } = await supabase
        .from("match_meeting_requests")
        .insert([insertData])
        .select("id")
        .single();
      if (error) throw error;

      const aName = partyLabel(partyA.selected);
      const bName = partyLabel(partyB.selected);

      await logAuditAction({
        action: "match_meeting_completed",
        entityType: "match_meeting",
        entityId: String(inserted.id),
        entityName: `${aName} met ${bName}`,
        newValue: insertData,
      });

      // Notify the member on either side, if they have a linked account.
      if (partyA.kind === "user") {
        await notifyProfileOwner({
          userId: (partyA.selected as UserLite).id,
          title: "Match Meeting Logged",
          message: `A match meeting with ${bName} has been recorded as completed.`,
          actionUrl: "/user/match-meetings",
        });
      }

      toast.success("Match meeting logged");
      onLogged();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to log match meeting");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="bg-white rounded-xl sm:rounded-2xl w-full max-w-lg shadow-2xl z-10 overflow-hidden border border-gray-100 max-h-[95vh] sm:max-h-[90vh] flex flex-col"
          >
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-start justify-between gap-3 sm:gap-4 flex-shrink-0">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-navy-dark flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-gold flex-shrink-0" />
                  <span>Log Match Meeting</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                  Manually record that two parties have had a completed match meeting.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
              <PartyPicker
                label="Party A"
                state={partyA}
                setState={setPartyA}
                restrictToProfileIds={isManager ? assignedProfileIds : undefined}
              />
              <div className="flex items-center justify-center">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">met</span>
              </div>
              <PartyPicker
                label="Party B"
                state={partyB}
                setState={setPartyB}
                restrictToProfileIds={isManager ? assignedProfileIds : undefined}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" /> Meeting Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full text-xs font-medium text-navy-dark bg-white border border-gray-200 rounded-xl px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-gold/40"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> Location (Optional)
                  </label>
                  <input
                    className="w-full text-xs font-medium text-navy-dark bg-white border border-gray-200 rounded-xl px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-gold/40"
                    placeholder="E.g. Saptapadi Office"
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Notes (Optional)</label>
                <textarea
                  className="w-full text-xs font-medium text-navy-dark bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/40 min-h-16"
                  placeholder="Any additional context about this meeting"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 sm:p-5 sm:px-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full sm:flex-1 py-2.5 sm:py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-white text-xs font-semibold transition-all text-center"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!canSave}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-2.5 rounded-xl bg-gold text-navy-dark font-bold text-xs hover:bg-gold-dark hover:text-white transition-all shadow-sm disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
                <span>Log Meeting</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}