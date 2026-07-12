"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Eye, Edit, Trash2, CheckCircle, XCircle, FileDown,
  ChevronLeft, ChevronRight, MoreVertical, Ban, RefreshCw,
  BadgeCheck, ShieldOff, Loader2, Users, HeartHandshake,
} from "lucide-react";
import { Profile, AuditAction } from "@/types";
import { formatDate, cn, STATUS_COLORS, titleCase, calculateAge } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { logAuditAction, notifyProfileOwner, sendBestEffortEmail } from "@/lib/audit";
import { MatchMeetingPartnersModal } from "@/components/admin/MatchMeetingPartnersModal";

interface Props {
  profiles: Profile[];
  total: number;
  page: number;
  limit: number;
  matchMeetingCounts?: Record<string, number>;
}

export function ProfilesTable({ profiles, total, page, limit, matchMeetingCounts = {} }: Props) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [meetingsModalProfile, setMeetingsModalProfile] = useState<Profile | null>(null);
  const MENU_WIDTH = 192; // matches w-48

  const toggleMenu = (id: string) => {
    if (openMenu === id) {
      setOpenMenu(null);
      return;
    }
    const btn = menuBtnRefs.current[id];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 6,
        left: Math.min(
          Math.max(8, rect.right - MENU_WIDTH),
          window.innerWidth - MENU_WIDTH - 8
        ),
      });
    }
    setOpenMenu(id);
  };

  // Close the menu on scroll/resize instead of trying to keep it pinned to a
  // moving button — the table lives inside multiple scrollable containers
  // (page main content + horizontal table scroll), so re-anchoring on every
  // scroll tick isn't worth it; a `capture: true` listener on window catches
  // scroll events from any nested scrollable ancestor.
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openMenu]);

  const handleAction = async (
    profileId: string,
    action: "approved" | "rejected" | "deactivated" | "suspended" | "pending",
    extra?: Record<string, string>
  ) => {
    setActionLoading(profileId + action);
    try {
      const supabase = createClient();
      const updateData: Record<string, unknown> = { status: action, ...extra };
      if (action === "approved") {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.id;
      }
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profileId);

      if (error) throw error;

      const labels: Record<string, string> = {
        approved: "Profile approved successfully",
        rejected: "Profile rejected",
        deactivated: "Profile deactivated",
        suspended: "Profile suspended",
        pending: "Profile reactivated to pending",
      };
      const auditActions: Record<string, AuditAction> = {
        approved: "profile_approved",
        rejected: "profile_rejected",
        deactivated: "profile_deactivated",
        suspended: "profile_suspended",
        pending: "profile_reactivated",
      };
      toast.success(labels[action] || "Updated");
      logAuditAction({
        action: auditActions[action],
        entityType: "profile",
        entityId: profileId,
        newValue: updateData,
      });
      router.refresh();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
      setOpenMenu(null);
    }
  };

  const handleVerify = async (profile: Profile, verify: boolean) => {
    const profileId = profile.id;
    setActionLoading(profileId + "verify");
    try {
      const supabase = createClient();
      let updateData: Record<string, unknown>;

      if (verify) {
        const { data: { user } } = await supabase.auth.getUser();
        updateData = { is_verified: true, verified_by: user?.id, verified_at: new Date().toISOString() };
      } else {
        updateData = { is_verified: false, verified_by: null, verified_at: null };
      }

      const { error } = await supabase.from("profiles").update(updateData).eq("id", profileId);
      if (error) throw error;

      toast.success(verify ? "Profile verified — badge is now visible across the app" : "Verification removed");

      logAuditAction({
        action: verify ? "profile_verified" : "profile_unverified",
        entityType: "profile",
        entityId: profileId,
        entityName: [profile.personal?.first_name, profile.personal?.last_name].filter(Boolean).join(" "),
        newValue: updateData,
      });

      if (verify) {
        notifyProfileOwner({
          userId: profile.user_id,
          title: "Your profile is now Verified",
          message: "Our team has confirmed your details. The Verified badge now appears on your profile.",
          type: "success",
          actionUrl: "/user/biodata",
        });
        sendBestEffortEmail({
          to: profile.contact?.email,
          name: profile.personal?.first_name,
          template: "profile_verified",
          data: { profile_id: profile.profile_id },
        });
      }

      router.refresh();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
      setOpenMenu(null);
    }
  };

  const handleDelete = async (profile: Profile) => {
    if (!confirm("Delete this profile? This cannot be undone.")) return;
    const profileId = profile.id;
    setActionLoading(profileId + "delete");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").delete().eq("id", profileId);
      if (error) throw error;
      toast.success("Profile deleted");
      logAuditAction({
        action: "profile_deleted",
        entityType: "profile",
        entityId: profileId,
        entityName: [profile.personal?.first_name, profile.personal?.last_name].filter(Boolean).join(" "),
        oldValue: { profile_id: profile.profile_id, status: profile.status, is_verified: profile.is_verified },
      });
      router.refresh();
    } catch {
      toast.error("Failed to delete profile.");
    } finally {
      setActionLoading(null);
    }
  };

  const columns: ColumnDef<Profile>[] = [
    {
      accessorKey: "profile_id",
      header: "Profile ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gold-dark font-bold tracking-wider uppercase bg-gold/10 px-2 py-1 rounded-md border border-gold/20">
          {row.original.profile_id}
        </span>
      ),
    },
    {
      id: "name",
      header: "Name & Demographics",
      cell: ({ row }) => {
        const p = row.original.personal;
        const age = p?.date_of_birth ? calculateAge(p.date_of_birth) : null;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gold/15 border border-gold/30 flex items-center justify-center flex-shrink-0 shadow-2xs">
              {row.original.images?.profile_photo ? (
                <img
                  src={row.original.images.profile_photo}
                  alt={p?.first_name ? `${p.first_name}'s profile photo` : "Profile photo"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gold-dark text-xs font-bold tracking-wider">
                  {p?.first_name?.[0] || "?"}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-navy-dark text-sm truncate">
                  {[p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Unnamed"}
                </p>
                {row.original.is_verified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-gray-400 text-xs font-medium mt-0.5">
                {age ? `${age} yrs` : "Age N/A"} {p?.gender ? `• ${p.gender}` : ""}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const a = row.original.address;
        const loc = [a?.district, a?.state].filter(Boolean).join(", ");
        return (
          <span className="text-gray-600 text-xs font-medium truncate max-w-[150px] block">
            {loc || "—"}
          </span>
        );
      },
    },
    {
      id: "religion",
      header: "Religion / Caste",
      cell: ({ row }) => {
        const p = row.original.personal;
        return (
          <div>
            <p className="text-xs font-semibold text-gray-800">{p?.religion || "—"}</p>
            <p className="text-[11px] text-gray-400 truncate max-w-[130px]">{p?.caste || ""}</p>
          </div>
        );
      },
    },
    {
      id: "profession",
      header: "Profession",
      cell: ({ row }) => (
        <span className="text-xs text-gray-600 font-medium truncate max-w-[140px] block">
          {row.original.profession?.profession || "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs whitespace-nowrap inline-flex items-center gap-1",
            STATUS_COLORS[row.original.status] || "bg-gray-100 text-gray-600 border-gray-200"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
          {titleCase(row.original.status)}
        </span>
      ),
    },
    {
      accessorKey: "profile_completion",
      header: "Completion",
      cell: ({ row }) => {
        const pct = row.original.profile_completion || 0;
        return (
          <div className="w-24">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-gray-600">{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: "match_meetings",
      header: "Match Meetings",
      cell: ({ row }) => {
        const p = row.original;
        const count = matchMeetingCounts[p.id] || 0;
        return (
          <button
            onClick={() => setMeetingsModalProfile(p)}
            disabled={count === 0}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs transition-all",
              count > 0
                ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 cursor-pointer"
                : "bg-gray-50 text-gray-400 border-gray-150 cursor-default"
            )}
            title={count > 0 ? "View match meeting history" : "No completed match meetings yet"}
          >
            <HeartHandshake className="w-3 h-3" /> {count}
          </button>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="text-right block">Actions</span>,
      cell: ({ row }) => {
        const p = row.original;
        const isLoading = actionLoading?.startsWith(p.id);

        return (
          <div className="flex items-center justify-end gap-1 relative">
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-gold mr-1" />
            )}

            <a
              href={`/admin/profiles/${p.id}`}
              className="p-1.5 hover:bg-sky-50 rounded-lg text-sky-600 transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </a>
            <a
              href={`/admin/profiles/${p.id}/edit`}
              className="p-1.5 hover:bg-gold/15 rounded-lg text-gold-dark transition-colors"
              title="Edit profile"
            >
              <Edit className="w-4 h-4" />
            </a>

            {p.status === "pending" && (
              <>
                <button
                  onClick={() => handleAction(p.id, "approved")}
                  disabled={!!isLoading}
                  className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors disabled:opacity-50"
                  title="Approve profile"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAction(p.id, "rejected")}
                  disabled={!!isLoading}
                  className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors disabled:opacity-50"
                  title="Reject profile"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}

            {!p.is_verified ? (
              <button
                onClick={() => handleVerify(p, true)}
                disabled={!!isLoading}
                className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors disabled:opacity-50"
                title="Verify profile"
              >
                <BadgeCheck className="w-4 h-4" />
              </button>
            ) : null}

            <div className="relative">
              <button
                ref={(el) => { menuBtnRefs.current[p.id] = el; }}
                onClick={() => toggleMenu(p.id)}
                aria-expanded={openMenu === p.id}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors focus:outline-none"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {openMenu === p.id && menuPos && createPortal(
                <>
                  {/* Click-away backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpenMenu(null)}
                  />

                  {/* Dropdown Action Menu — fixed to viewport coords so it can
                      never be clipped by the table's scroll containers */}
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 4 }}
                      transition={{ duration: 0.15 }}
                      style={{ position: "fixed", top: menuPos.top, left: menuPos.left }}
                      className="bg-white border border-gray-200/80 rounded-xl shadow-xl py-1.5 w-48 z-50 overflow-hidden"
                    >
                      {!p.is_verified ? (
                        <button
                          onClick={() => handleVerify(p, true)}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50/80 transition-colors text-left"
                        >
                          <BadgeCheck className="w-3.5 h-3.5" /> Verify Profile
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerify(p, false)}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left"
                        >
                          <ShieldOff className="w-3.5 h-3.5 text-gray-400" /> Remove Verification
                        </button>
                      )}

                      {["pending", "approved"].includes(p.status) && (
                        <button
                          onClick={() => handleAction(p.id, "deactivated")}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left"
                        >
                          <Ban className="w-3.5 h-3.5 text-amber-500" /> Deactivate
                        </button>
                      )}

                      {["deactivated", "suspended"].includes(p.status) && (
                        <button
                          onClick={() => handleAction(p.id, "pending")}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50/80 transition-colors text-left"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reactivate
                        </button>
                      )}

                      <a
                        href={`/api/biodata/${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setOpenMenu(null)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-purple-600 hover:bg-purple-50/80 transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" /> Download Biodata
                      </a>

                      <div className="h-px bg-gray-100 my-1 mx-2" />

                      <button
                        onClick={() => handleDelete(p)}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/80 transition-colors text-left"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Profile
                      </button>
                    </motion.div>
                  </AnimatePresence>
                </>,
                document.body
              )}
            </div>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: profiles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / limit),
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="luxury-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <MatchMeetingPartnersModal profile={meetingsModalProfile} onClose={() => setMeetingsModalProfile(null)} />
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-gray-150 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {hg.headers.map((h) => (
                  <th key={h.id} className="py-3.5 px-4 first:pl-6 last:pr-6">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50/60 transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4 first:pl-6 last:pr-6">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-20 text-gray-400 bg-gray-50/30">
                  <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-navy-dark font-semibold text-sm">No Profiles Found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      There are no registered profiles matching your current filters or search query.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 gap-3 bg-gray-50/40">
          <p className="text-xs font-medium text-gray-500">
            Showing <span className="font-semibold text-gray-700">{(page - 1) * limit + 1}</span> to{" "}
            <span className="font-semibold text-gray-700">{Math.min(page * limit, total)}</span> of{" "}
            <span className="font-semibold text-gray-700">{total}</span> total profiles
          </p>

          <div className="flex items-center gap-1.5">
            <a
              href={`?page=${page - 1}`}
              aria-disabled={page <= 1}
              className={cn(
                "p-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center",
                page <= 1
                  ? "opacity-40 pointer-events-none border-gray-200 text-gray-400 bg-gray-100"
                  : "border-gray-200/80 bg-white text-gray-700 hover:border-gold hover:text-gold-dark shadow-2xs"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </a>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = i + 1;
              const isCurrent = page === pageNum;
              return (
                <a
                  key={pageNum}
                  href={`?page=${pageNum}`}
                  className={cn(
                    "w-8 h-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all shadow-2xs",
                    isCurrent
                      ? "bg-gold text-navy-dark border border-gold-dark/20 shadow-xs"
                      : "bg-white border border-gray-200/80 text-gray-600 hover:border-gold hover:text-gold-dark"
                  )}
                >
                  {pageNum}
                </a>
              );
            })}

            <a
              href={`?page=${page + 1}`}
              aria-disabled={page >= totalPages}
              className={cn(
                "p-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center",
                page >= totalPages
                  ? "opacity-40 pointer-events-none border-gray-200 text-gray-400 bg-gray-100"
                  : "border-gray-200/80 bg-white text-gray-700 hover:border-gold hover:text-gold-dark shadow-2xs"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}