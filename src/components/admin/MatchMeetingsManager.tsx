"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  CalendarHeart, Clock, CheckCircle2, XCircle, Ban, Check, X,
  Loader2, Calendar, MapPin, Users2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, cn } from "@/lib/utils";
import { logAuditAction, notifyProfileOwner } from "@/lib/audit";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { MatchMeetingStatus } from "@/types";

const TABS: { key: "all" | MatchMeetingStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Declined" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_CONFIG: Record<MatchMeetingStatus, { label: string; icon: typeof Clock; classes: string }> = {
  pending: { label: "Pending", icon: Clock, classes: "bg-amber-50 text-amber-700 border-amber-200" },
  accepted: { label: "Accepted", icon: CheckCircle2, classes: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", icon: CheckCircle2, classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Declined", icon: XCircle, classes: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelled: { label: "Cancelled", icon: Ban, classes: "bg-gray-100 text-gray-500 border-gray-200" },
};

interface Props {
  requests: Record<string, unknown>[];
  totalCompleted: number;
  totalPending: number;
}

export function MatchMeetingsManager({ requests: initialRequests, totalCompleted, totalPending }: Props) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [activeTab, setActiveTab] = useState<"all" | MatchMeetingStatus>("all");
  const [acceptTarget, setAcceptTarget] = useState<Record<string, unknown> | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Record<string, unknown> | null>(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = activeTab === "all" ? requests : requests.filter((r) => r.status === activeTab);

  const getPersonName = (r: Record<string, unknown>) => {
    const requester = r.users as Record<string, unknown> | null;
    return String(requester?.full_name || requester?.email || "Member");
  };
  const getProfileName = (r: Record<string, unknown>) => {
    const profile = r.profiles as Record<string, unknown> | null;
    const personal = profile?.personal as Record<string, string> | null;
    return [personal?.first_name, personal?.last_name].filter(Boolean).join(" ") || "—";
  };

  const withCurrentAdmin = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return { supabase, adminId: user?.id };
  };

  const handleAccept = async () => {
    if (!acceptTarget) return;
    setIsSaving(true);
    try {
      const { supabase, adminId } = await withCurrentAdmin();
      const { error } = await supabase
        .from("match_meeting_requests")
        .update({
          status: "accepted",
          responded_by_admin_id: adminId,
          responded_at: new Date().toISOString(),
          meeting_date: meetingDate || null,
          meeting_location: meetingLocation || null,
        })
        .eq("id", String(acceptTarget.id));
      if (error) throw error;

      setRequests((prev) => prev.map((r) => (r.id === acceptTarget.id
        ? { ...r, status: "accepted", meeting_date: meetingDate || null, meeting_location: meetingLocation || null }
        : r)));

      await logAuditAction({
        action: "match_meeting_accepted",
        entityType: "match_meeting",
        entityId: String(acceptTarget.id),
        entityName: getProfileName(acceptTarget),
      });
      await notifyProfileOwner({
        userId: String(acceptTarget.requested_by_user_id),
        title: "Match Meeting Accepted",
        message: `Your match meeting request for ${getProfileName(acceptTarget)} has been accepted.${meetingDate ? ` Scheduled for ${formatDate(meetingDate, "dd MMM yyyy, hh:mm a")}.` : ""}`,
        actionUrl: "/user/match-meetings",
      });

      toast.success("Request accepted");
      setAcceptTarget(null);
      setMeetingDate("");
      setMeetingLocation("");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to accept request");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setIsSaving(true);
    try {
      const { supabase, adminId } = await withCurrentAdmin();
      const { error } = await supabase
        .from("match_meeting_requests")
        .update({
          status: "rejected",
          responded_by_admin_id: adminId,
          responded_at: new Date().toISOString(),
          cancellation_reason: rejectReason || null,
        })
        .eq("id", String(rejectTarget.id));
      if (error) throw error;

      setRequests((prev) => prev.map((r) => (r.id === rejectTarget.id ? { ...r, status: "rejected" } : r)));

      await logAuditAction({
        action: "match_meeting_rejected",
        entityType: "match_meeting",
        entityId: String(rejectTarget.id),
        entityName: getProfileName(rejectTarget),
      });
      await notifyProfileOwner({
        userId: String(rejectTarget.requested_by_user_id),
        title: "Match Meeting Declined",
        message: `Your match meeting request for ${getProfileName(rejectTarget)} was declined.${rejectReason ? ` Reason: ${rejectReason}` : ""}`,
        type: "warning",
        actionUrl: "/user/match-meetings",
      });

      toast.success("Request declined");
      setRejectTarget(null);
      setRejectReason("");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to decline request");
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async (r: Record<string, unknown>) => {
    if (!confirm(`Mark the match meeting with ${getProfileName(r)} as completed?`)) return;
    setBusyId(String(r.id));
    try {
      const { supabase, adminId } = await withCurrentAdmin();
      const { error } = await supabase
        .from("match_meeting_requests")
        .update({
          status: "completed",
          completed_by_admin_id: adminId,
          completed_at: new Date().toISOString(),
        })
        .eq("id", String(r.id));
      if (error) throw error;

      setRequests((prev) => prev.map((row) => (row.id === r.id ? { ...row, status: "completed" } : row)));

      await logAuditAction({
        action: "match_meeting_completed",
        entityType: "match_meeting",
        entityId: String(r.id),
        entityName: getProfileName(r),
      });
      await notifyProfileOwner({
        userId: String(r.requested_by_user_id),
        title: "Match Meeting Completed",
        message: `Your match meeting with ${getProfileName(r)} has been marked as completed.`,
        actionUrl: "/user/match-meetings",
      });

      toast.success("Marked as completed");
      router.refresh();
    } catch {
      toast.error("Failed to mark as completed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="luxury-card p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy-dark">{totalCompleted}</p>
          <p className="text-gray-500 text-xs mt-1">Completed Meetings</p>
        </div>
        <div className="luxury-card p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy-dark">{totalPending}</p>
          <p className="text-gray-500 text-xs mt-1">Awaiting Response</p>
        </div>
      </div>

      {/* Completed matches directory */}
      {totalCompleted > 0 && (
        <div className="luxury-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold-dark">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-navy-dark text-lg">Completed Matches</h3>
              <p className="text-xs text-gray-400">Members and profiles with a completed match meeting</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {requests.filter((r) => r.status === "completed").map((r) => (
              <div key={String(r.id)} className="px-5 py-3 flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
                <span className="font-medium text-navy-dark">{getPersonName(r)}</span>
                <span className="text-gray-400 text-xs">met</span>
                <span className="font-medium text-navy-dark flex-1 min-w-[100px]">{getProfileName(r)}</span>
                <span className="text-xs text-gray-400 w-full sm:w-auto">{formatDate(String(r.completed_at || r.updated_at))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requests table */}
      <div className="luxury-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gold/15 text-gold-dark">
            <CalendarHeart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-navy-dark text-lg">Match Meeting Requests</h3>
            <p className="text-xs text-gray-400">Review and manage requests from members</p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-5 pt-3 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-shrink-0",
                activeTab === t.key
                  ? "bg-navy-dark text-white border-navy-dark shadow-2xs"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-150 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3.5 px-5">Member</th>
                <th className="py-3.5 px-5">Profile</th>
                <th className="py-3.5 px-5">Requested</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.length > 0 ? (
                filtered.map((r) => {
                  const profile = r.profiles as Record<string, unknown> | null;
                  const status = r.status as MatchMeetingStatus;
                  const config = STATUS_CONFIG[status];
                  return (
                    <tr key={String(r.id)} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-navy-dark text-sm truncate">{getPersonName(r)}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-navy-dark text-sm truncate flex items-center gap-1">
                          {getProfileName(r)}
                          {Boolean(profile?.is_verified) && <VerifiedBadge size="sm" />}
                        </p>
                        <p className="text-xs text-gold-dark font-mono font-bold">{String(profile?.profile_id || "")}</p>
                      </td>
                      <td className="py-3.5 px-5 text-xs font-medium text-gray-600">
                        {formatDate(String(r.requested_at || r.created_at))}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5", config.classes)}>
                          <config.icon className="w-3 h-3" /> {config.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {status === "pending" && (
                            <>
                              <button
                                onClick={() => { setAcceptTarget(r); setMeetingDate(""); setMeetingLocation(""); }}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                title="Accept Request"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setRejectTarget(r); setRejectReason(""); }}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                                title="Decline Request"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {status === "accepted" && (
                            <button
                              onClick={() => handleComplete(r)}
                              disabled={busyId === String(r.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/15 text-gold-dark hover:bg-gold hover:text-navy-dark text-xs font-semibold transition-all disabled:opacity-50"
                            >
                              {busyId === String(r.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Mark Completed
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400 bg-gray-50/30">
                    <CalendarHeart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-navy-dark">No Requests Here</p>
                    <p className="text-xs text-gray-400 mt-0.5">Nothing to show for this filter yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accept Modal */}
      <AnimatePresence>
        {acceptTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setAcceptTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl z-10 overflow-hidden border border-gray-100"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-serif text-xl font-bold text-navy-dark">Accept Match Meeting</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Optionally schedule details for the meeting with {getProfileName(acceptTarget)}. You can leave these blank and set them later.
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Meeting Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full text-xs font-medium text-navy-dark bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/40"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Location (Optional)
                  </label>
                  <input
                    className="w-full text-xs font-medium text-navy-dark bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/40"
                    placeholder="E.g. Saptapadi Office, Anantapur"
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setAcceptTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-white text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAccept}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold text-navy-dark font-bold text-xs hover:bg-gold-dark hover:text-white transition-all shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Accept Request
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setRejectTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl z-10 overflow-hidden border border-gray-100"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-serif text-xl font-bold text-navy-dark">Decline Request</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Let the member know why the request for {getProfileName(rejectTarget)} was declined (optional).
                </p>
              </div>
              <div className="p-6">
                <textarea
                  className="w-full text-xs font-medium text-navy-dark bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold/40 min-h-24"
                  placeholder="E.g. This candidate is no longer available"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="p-5 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setRejectTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-white text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReject}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Decline Request
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}