"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  CalendarHeart, CheckCircle2, Clock, XCircle, Ban, X, Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, cn } from "@/lib/utils";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { MatchMeetingStatus } from "@/types";

const STATUS_CONFIG: Record<MatchMeetingStatus, { label: string; icon: typeof Clock; classes: string }> = {
  pending: { label: "Pending", icon: Clock, classes: "bg-amber-50 text-amber-700 border-amber-200" },
  accepted: { label: "Accepted", icon: CheckCircle2, classes: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", icon: CheckCircle2, classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Declined", icon: XCircle, classes: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelled: { label: "Cancelled", icon: Ban, classes: "bg-gray-100 text-gray-500 border-gray-200" },
};

interface Props {
  requests: Record<string, unknown>[];
}

export function UserMatchMeetingsClient({ requests: initialRequests }: Props) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const completed = requests.filter((r) => r.status === "completed");
  const pending = requests.filter((r) => r.status === "pending");
  const accepted = requests.filter((r) => r.status === "accepted");

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("match_meeting_requests")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
      toast.success("Request cancelled");
      router.refresh();
    } catch {
      toast.error("Failed to cancel request");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="luxury-card p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy-dark">{completed.length}</p>
          <p className="text-gray-500 text-xs mt-1">Completed Meetings</p>
        </div>
        <div className="luxury-card p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy-dark">{pending.length}</p>
          <p className="text-gray-500 text-xs mt-1">Pending Requests</p>
        </div>
        <div className="luxury-card p-5 col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <CalendarHeart className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy-dark">{accepted.length}</p>
          <p className="text-gray-500 text-xs mt-1">Accepted, Awaiting Meeting</p>
        </div>
      </div>

      {/* Completed matches list */}
      {completed.length > 0 && (
        <div className="luxury-card overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-serif font-semibold text-navy-dark">Profiles You&apos;ve Met</h3>
            <p className="text-xs text-gray-400 mt-0.5">Match meetings completed with these profiles</p>
          </div>
          <div className="divide-y divide-gray-50">
            {completed.map((r) => (
              <MeetingRow key={String(r.id)} request={r} />
            ))}
          </div>
        </div>
      )}

      {/* All requests */}
      <div className="luxury-card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-serif font-semibold text-navy-dark">All Match Meeting Requests</h3>
        </div>
        {requests.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {requests.map((r) => (
              <MeetingRow
                key={String(r.id)}
                request={r}
                onCancel={r.status === "pending" ? () => handleCancel(String(r.id)) : undefined}
                isCancelling={cancellingId === String(r.id)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400">
            <CalendarHeart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-navy-dark">No Match Meeting Requests Yet</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Open a shared profile you like and request a match meeting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingRow({
  request, onCancel, isCancelling,
}: {
  request: Record<string, unknown>;
  onCancel?: () => void;
  isCancelling?: boolean;
}) {
  const profile = request.profiles as Record<string, unknown> | null;
  const personal = profile?.personal as Record<string, string> | null;
  const images = profile?.images as Record<string, string | null> | null;
  const name = [personal?.first_name, personal?.last_name].filter(Boolean).join(" ");
  const status = request.status as MatchMeetingStatus;
  const config = STATUS_CONFIG[status];

  return (
    <div className="px-5 py-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-full overflow-hidden bg-gold/10 flex-shrink-0">
        {images?.profile_photo ? (
          <img src={images.profile_photo} alt={name ? `${name}'s profile photo` : "Profile photo"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gold font-bold text-sm">{personal?.first_name?.[0] || "?"}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-navy-dark flex items-center gap-1 truncate">
          {name || "—"}
          {Boolean(profile?.is_verified) && <VerifiedBadge size="sm" />}
        </p>
        <p className="text-xs text-gold font-mono">{String(profile?.profile_id || "")}</p>
        <p className="text-xs text-gray-300 mt-0.5">Requested {formatDate(String(request.requested_at || request.created_at))}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5", config.classes)}>
          <config.icon className="w-3 h-3" /> {config.label}
        </span>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50"
            title="Cancel Request"
          >
            {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}