"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, HeartHandshake, MapPin, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Profile } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { fetchCompletedMatchMeetings, MatchMeetingPartner } from "@/lib/match-meetings";

interface Props {
  profile: Profile | null;
  onClose: () => void;
}

export function MatchMeetingPartnersModal({ profile, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<MatchMeetingPartner[]>([]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setLoading(true);
    fetchCompletedMatchMeetings(profile)
      .then((data) => {
        if (!cancelled) setPartners(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const subjectName = profile
    ? [profile.personal?.first_name, profile.personal?.last_name].filter(Boolean).join(" ") || "This profile"
    : "";

  return (
    <AnimatePresence>
      {profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl z-10 overflow-hidden border border-gray-100 max-h-[85vh] flex flex-col"
          >
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-start justify-between gap-4 flex-shrink-0">
              <div>
                <h2 className="font-serif text-xl font-bold text-navy-dark flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-gold" /> Match Meetings
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Everyone {subjectName} has had a completed match meeting with
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-xs font-medium">Loading match meetings…</p>
                </div>
              ) : partners.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {partners.map((partner) => (
                    <li key={partner.requestId} className="p-4 flex items-center gap-3 hover:bg-gray-50/60 transition-colors">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-gold/15 border border-gold/30 flex items-center justify-center flex-shrink-0">
                        {partner.photo ? (
                          <img src={partner.photo} alt={partner.name ? `${partner.name}'s photo` : "Match partner photo"} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gold-dark text-xs font-bold tracking-wider">
                            {partner.name?.[0] || "?"}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-navy-dark text-sm truncate">{partner.name}</p>
                          {partner.profileCode && (
                            <span className="text-[10px] font-mono font-bold text-gold-dark bg-gold/10 px-1.5 py-0.5 rounded border border-gold/20">
                              {partner.profileCode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {partner.meetingDate && (
                            <span className="text-[11px] text-gray-400 font-medium inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {formatDate(partner.meetingDate, "dd MMM yyyy")}
                            </span>
                          )}
                          {partner.meetingLocation && (
                            <span className="text-[11px] text-gray-400 font-medium inline-flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 flex-shrink-0" /> {partner.meetingLocation}
                            </span>
                          )}
                        </div>
                      </div>

                      {partner.profileId && (
                        <Link
                          href={`/admin/profiles/${partner.profileId}`}
                          onClick={onClose}
                          className="p-2 rounded-lg hover:bg-gold/15 text-gold-dark transition-colors flex-shrink-0"
                          title="View profile"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-16 text-center text-gray-400 bg-gray-50/30">
                  <HeartHandshake className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-navy-dark">No Completed Match Meetings</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Meetings will show up here once an admin marks them as completed.
                  </p>
                </div>
              )}
            </div>

            {partners.length > 0 && (
              <div className={cn("px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/60 flex-shrink-0")}>
                <p className="text-xs font-semibold text-gray-500">
                  {partners.length} completed match {partners.length === 1 ? "meeting" : "meetings"}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}