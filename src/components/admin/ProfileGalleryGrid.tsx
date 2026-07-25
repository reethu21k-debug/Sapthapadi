"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, MapPin, Briefcase, Users,
  HeartHandshake, CreditCard, CalendarDays,
} from "lucide-react";
import { Profile } from "@/types";
import { formatDate, cn, STATUS_COLORS, titleCase, calculateAge, PLAN_LABELS } from "@/lib/utils";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

interface SubscriptionSummary {
  id: string;
  plan: string;
  status: string;
  expiry_date: string;
}

interface Props {
  profiles: Profile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  matchMeetingCounts?: Record<string, number>;
  subscriptionsByProfile?: Record<string, SubscriptionSummary>;
}

export function ProfileGalleryGrid({
  profiles,
  total,
  page,
  limit,
  totalPages,
  matchMeetingCounts = {},
  subscriptionsByProfile = {},
}: Props) {
  const searchParams = useSearchParams();

  // Preserve gender/status filters when paging, same pattern used in the
  // main ProfilesTable pagination fix.
  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(targetPage));
    return `?${params.toString()}`;
  };

  if (profiles.length === 0) {
    return (
      <div className="luxury-card bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Users className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-navy-dark font-semibold text-sm">No Profiles Found</p>
        <p className="text-xs text-gray-400 mt-1">
          There are no profiles matching this filter yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {profiles.map((p, i) => {
          const personal = p.personal;
          const age = personal?.date_of_birth ? calculateAge(personal.date_of_birth) : null;
          const photoUrl = p.images?.profile_photo;
          const displayName =
            [personal?.first_name, personal?.last_name].filter(Boolean).join(" ") || "Unnamed";
          const location = [p.address?.district, p.address?.state].filter(Boolean).join(", ");
          const sub = subscriptionsByProfile[p.id];
          const meetingCount = matchMeetingCounts[p.id] || 0;
          const completion = p.profile_completion || 0;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.03, ease: "easeOut" }}
            >
              <Link
                href={`/admin/profiles/${p.id}`}
                className="group block bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-lg hover:border-gold/40 transition-all duration-200 overflow-hidden h-full"
              >
                {/* Photo — same 3:4 size/crop as before, full card width, on top */}
                <div className="relative aspect-[3/4] bg-gold/10 overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-serif font-bold text-gold-dark/40">
                        {personal?.first_name?.[0] || "?"}
                      </span>
                    </div>
                  )}

                  {/* Status badge, top-left */}
                  <span
                    className={cn(
                      "absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border shadow-2xs backdrop-blur-sm whitespace-nowrap",
                      STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600 border-gray-200"
                    )}
                  >
                    {titleCase(p.status)}
                  </span>

                  {/* Verified badge, top-right */}
                  {p.is_verified && (
                    <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-2xs">
                      <VerifiedBadge size="sm" />
                    </span>
                  )}

                  {/* Match meeting count, bottom-left over the photo */}
                  {meetingCount > 0 && (
                    <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50/95 text-rose-600 border border-rose-200 shadow-2xs backdrop-blur-sm">
                      <HeartHandshake className="w-2.5 h-2.5" />
                      {meetingCount}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3.5 space-y-1">
                  {/* Profile ID */}
                  <p className="font-mono text-[10px] text-gold-dark font-bold tracking-wider uppercase">
                    {p.profile_id}
                  </p>

                  {/* Name */}
                  <p className="font-semibold text-navy-dark text-sm truncate">
                    {displayName}
                  </p>

                  {/* Age • gender */}
                  <p className="text-gray-400 text-xs font-medium">
                    {age ? `${age} yrs` : "Age N/A"} {personal?.gender ? `• ${personal.gender}` : ""}
                  </p>

                  {/* Religion · caste */}
                  <p className="text-[11px] text-gray-600 truncate">
                    <span className="font-semibold text-gray-800">{personal?.religion || "—"}</span>
                    {personal?.caste ? (
                      <span className="text-gray-400"> · {personal.caste}</span>
                    ) : null}
                  </p>

                  {location && (
                    <p className="flex items-center gap-1 text-[11px] text-gray-500 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{location}</span>
                    </p>
                  )}

                  {p.profession?.profession && (
                    <p className="flex items-center gap-1 text-[11px] text-gray-500 truncate">
                      <Briefcase className="w-3 h-3 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{p.profession.profession}</span>
                    </p>
                  )}

                  {/* Completion */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-semibold text-gray-500">Completion</span>
                      <span className="text-[10px] font-semibold text-gray-600">{completion}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-500"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>

                  {/* Subscription */}
                  <div className="pt-1">
                    {sub ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gold/10 text-gold-dark border border-gold/20"
                        title={`Until ${formatDate(sub.expiry_date)}`}
                      >
                        <CreditCard className="w-2.5 h-2.5" />
                        {PLAN_LABELS[sub.plan] || sub.plan}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-medium">No Plan</span>
                    )}
                  </div>

                  {/* Joined date */}
                  <p className="flex items-center gap-1 text-[10px] text-gray-400 font-medium pt-0.5">
                    <CalendarDays className="w-3 h-3" />
                    Joined {formatDate(p.created_at)}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-1 gap-3">
          <p className="text-xs font-medium text-gray-500">
            Showing <span className="font-semibold text-gray-700">{(page - 1) * limit + 1}</span> to{" "}
            <span className="font-semibold text-gray-700">{Math.min(page * limit, total)}</span> of{" "}
            <span className="font-semibold text-gray-700">{total}</span> profiles
          </p>

          <div className="flex items-center gap-1.5">
            <Link
              href={buildPageHref(page - 1)}
              aria-disabled={page <= 1}
              className={cn(
                "p-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center",
                page <= 1
                  ? "opacity-40 pointer-events-none border-gray-200 text-gray-400 bg-gray-100"
                  : "border-gray-200/80 bg-white text-gray-700 hover:border-gold hover:text-gold-dark shadow-2xs"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = i + 1;
              const isCurrent = page === pageNum;
              return (
                <Link
                  key={pageNum}
                  href={buildPageHref(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all shadow-2xs",
                    isCurrent
                      ? "bg-gold text-navy-dark border border-gold-dark/20 shadow-xs"
                      : "bg-white border border-gray-200/80 text-gray-600 hover:border-gold hover:text-gold-dark"
                  )}
                >
                  {pageNum}
                </Link>
              );
            })}

            <Link
              href={buildPageHref(page + 1)}
              aria-disabled={page >= totalPages}
              className={cn(
                "p-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center",
                page >= totalPages
                  ? "opacity-40 pointer-events-none border-gray-200 text-gray-400 bg-gray-100"
                  : "border-gray-200/80 bg-white text-gray-700 hover:border-gold hover:text-gold-dark shadow-2xs"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}