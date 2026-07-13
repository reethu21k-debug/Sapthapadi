"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Heart, FileDown, ArrowLeft, MapPin, GraduationCap,
  Briefcase, Users, User, Phone, Home, CalendarHeart, Clock,
  CheckCircle2, XCircle, Loader2, X,
} from "lucide-react";
import Link from "next/link";
import { calculateAge, formatDate, formatHeight, formatIncome, titleCase, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { isSectionFullyHidden, isFieldVisible, type VisibleFieldsMap } from "@/lib/profile-privacy";
import { logAuditAction, notifyAdmins } from "@/lib/audit";
import { MatchMeetingRequest } from "@/types";

interface Props {
  profile: Record<string, unknown>;
  isFavourite: boolean;
  currentUserId: string;
  /** Per-section/field privacy map the admin set for this share. Null = no restrictions. */
  visibleFields?: VisibleFieldsMap | null;
  /** Most recent match meeting request the current user has made for this profile, if any. */
  initialMatchMeeting?: MatchMeetingRequest | null;
}

export function UserProfileDetailView({
  profile, isFavourite: initialFav, currentUserId, visibleFields = null, initialMatchMeeting = null,
}: Props) {
  const [isFav, setIsFav] = useState(initialFav);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [matchMeeting, setMatchMeeting] = useState<MatchMeetingRequest | null>(initialMatchMeeting);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const personal = profile.personal as Record<string, unknown> | null;
  const addr = profile.address as Record<string, string> | null;
  const contact = profile.contact as Record<string, string> | null;
  const prof = profile.profession as Record<string, unknown> | null;
  const edu = profile.education as Record<string, string> | null;
  const fam = profile.family as Record<string, unknown> | null;
  const propertyDetails = profile.property as Record<string, unknown> | null;
  const prefs = profile.partner_preferences as Record<string, unknown> | null;
  const images = profile.images as Record<string, string | null> | null;
  const visibility = profile.visibility as Record<string, boolean> | null;

  const fullName = [personal?.first_name, personal?.middle_name, personal?.last_name]
    .filter(Boolean).join(" ") as string;

  const handleFavourite = async () => {
    try {
      const supabase = createClient();
      if (isFav) {
        await supabase.from("profile_interactions")
          .delete()
          .eq("user_id", currentUserId)
          .eq("profile_id", String(profile.id))
          .eq("interaction_type", "favourite");
        setIsFav(false);
        toast.success("Removed from favourites");
      } else {
        await supabase.from("profile_interactions").upsert({
          user_id: currentUserId,
          profile_id: String(profile.id),
          interaction_type: "favourite",
        });
        setIsFav(true);
        toast.success("Added to favourites!");
      }
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/biodata/${String(profile.id)}`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${String(profile.profile_id)}-biodata.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Biodata downloaded!");
    } catch {
      toast.error("Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRequestMeeting = async () => {
    setIsRequesting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("match_meeting_requests")
        .insert({
          requested_by_user_id: currentUserId,
          profile_id: String(profile.id),
        })
        .select("*")
        .single();
      if (error) throw error;

      setMatchMeeting(data as MatchMeetingRequest);

      await logAuditAction({
        action: "match_meeting_requested",
        entityType: "match_meeting",
        entityId: String(data.id),
        entityName: fullName,
      });
      await notifyAdmins({
        title: "New Match Meeting Request",
        message: `${fullName || "A member"} (${String(profile.profile_id)}) has requested a match meeting.`,
        actionUrl: "/admin/match-meetings",
      });

      toast.success("Match meeting request sent to admin!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCancelMeeting = async () => {
    if (!matchMeeting) return;
    setIsCancelling(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("match_meeting_requests")
        .update({ status: "cancelled" })
        .eq("id", matchMeeting.id);
      if (error) throw error;

      setMatchMeeting({ ...matchMeeting, status: "cancelled" });
      toast.success("Request cancelled");
    } catch {
      toast.error("Failed to cancel request");
    } finally {
      setIsCancelling(false);
    }
  };

  const TABS = [
    { id: "personal", label: "Personal", icon: User },
    { id: "profession", label: "Career", icon: Briefcase, hide: isSectionFullyHidden(visibleFields, "profession") && isSectionFullyHidden(visibleFields, "education") },
    { id: "family", label: "Family", icon: Users, hide: isSectionFullyHidden(visibleFields, "family") },
    { id: "property", label: "Property", icon: Home, hide: isSectionFullyHidden(visibleFields, "property") },
    { id: "preferences", label: "Preferences", icon: Heart, hide: isSectionFullyHidden(visibleFields, "partner_preferences") },
  ].filter((t) => !t.hide);

  const canShowBiodataDownload = isFieldVisible(visibleFields, "documents", "biodata_pdf");

  return (
    <div className="space-y-6">
      <Link href="/user/profiles" className="inline-flex items-center gap-2 text-gray-500 hover:text-navy-dark text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Matches
      </Link>

      {/* Header */}
      <div className="luxury-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Photo */}
          <div className="aspect-[3/4] md:aspect-auto md:min-h-80 relative overflow-hidden bg-gray-100">
            {images?.profile_photo ? (
              <img src={images.profile_photo} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gold/5">
                <span className="font-serif text-6xl font-bold text-gold/30">
                  {(personal?.first_name as string)?.[0] || "?"}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="md:col-span-2 p-4 sm:p-6">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-navy-dark flex items-center gap-2">
                  {fullName || "—"}
                  {Boolean(profile.is_verified) && <VerifiedBadge />}
                </h1>
                <p className="text-gold font-mono text-sm font-semibold mt-0.5">{String(profile.profile_id)}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {!!personal?.religion && <span className="badge badge-gold">{String(personal.religion)}</span>}
                  {!!personal?.caste && <span className="badge badge-gray">{String(personal.caste)}</span>}
                  {!!personal?.marital_status && (
                    <span className="badge badge-navy capitalize">
                      {String(personal.marital_status).replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFavourite}
                  className={cn(
                    "p-2.5 rounded-xl border transition-all",
                    isFav
                      ? "bg-red-50 border-red-200 text-red-500"
                      : "bg-gray-50 border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400"
                  )}
                >
                  <Heart className={cn("w-5 h-5", isFav && "fill-red-500")} />
                </button>
                {canShowBiodataDownload && (
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="btn-gold py-2.5 px-4"
                  >
                    <FileDown className="w-4 h-4" />
                    <span className="hidden sm:inline">{isDownloading ? "Generating..." : "Download Biodata"}</span>
                    <span className="sm:hidden">{isDownloading ? "..." : "Biodata"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick details grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { icon: User, label: "Age", value: personal?.date_of_birth ? `${calculateAge(String(personal.date_of_birth))} Years` : "—" },
                { icon: User, label: "Height", value: personal?.height_cm ? formatHeight(Number(personal.height_cm)) : "—" },
                { icon: MapPin, label: "Location", value: [addr?.district, addr?.state].filter(Boolean).join(", ") || "—" },
                { icon: GraduationCap, label: "Education", value: String(edu?.highest_qualification || "—") },
                { icon: Briefcase, label: "Profession", value: prof?.profession ? String(prof.profession) : "—" },
                { icon: User, label: "Gothram", value: String(personal?.gothram || "—") },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-0.5">{item.label}</p>
                  <p className="text-navy-dark text-sm font-medium truncate">{item.value}</p>
                </div>
              ))}
            </div>

            {/* About */}
            {!!profile.about_me && (
              <div className="mt-5 p-4 bg-gold/5 rounded-xl border border-gold/10">
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {String(profile.about_me)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Match Meeting */}
      <div className="luxury-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold/15 text-gold-dark flex-shrink-0">
              <CalendarHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-semibold text-navy-dark">Match Meeting</h2>
              <p className="text-xs text-gray-400">
                {!matchMeeting || matchMeeting.status === "rejected" || matchMeeting.status === "cancelled"
                  ? "Like this profile? Request a meeting and our team will help arrange it."
                  : matchMeeting.status === "pending"
                  ? "Your request is awaiting admin review."
                  : matchMeeting.status === "accepted"
                  ? "Your request has been accepted. Our team will be in touch to schedule it."
                  : "This match meeting has been marked as completed."}
              </p>
            </div>
          </div>

          {(!matchMeeting || matchMeeting.status === "rejected" || matchMeeting.status === "cancelled") && (
            <button
              onClick={handleRequestMeeting}
              disabled={isRequesting}
              className="btn-gold py-2.5 px-4 text-sm disabled:opacity-50"
            >
              {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarHeart className="w-4 h-4" />}
              {matchMeeting ? "Request Again" : "Request Match Meeting"}
            </button>
          )}

          {matchMeeting?.status === "pending" && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Request Pending
              </span>
              <button
                onClick={handleCancelMeeting}
                disabled={isCancelling}
                className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50"
                title="Cancel Request"
              >
                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              </button>
            </div>
          )}

          {matchMeeting?.status === "accepted" && (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
            </span>
          )}

          {matchMeeting?.status === "completed" && (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Meeting Completed
            </span>
          )}

          {matchMeeting?.status === "rejected" && (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Declined
            </span>
          )}
        </div>

        {matchMeeting?.status === "accepted" && (matchMeeting.meeting_date || matchMeeting.meeting_location) && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {matchMeeting.meeting_date && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Scheduled For</p>
                <p className="font-medium text-navy-dark mt-0.5">{formatDate(matchMeeting.meeting_date, "dd MMM yyyy, hh:mm a")}</p>
              </div>
            )}
            {matchMeeting.meeting_location && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Location</p>
                <p className="font-medium text-navy-dark mt-0.5">{matchMeeting.meeting_location}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo gallery */}
      {(images?.photo_2 || images?.photo_3) && (
        <div className="luxury-card p-5">
          <h2 className="font-serif font-semibold text-navy-dark mb-4">Photo Gallery</h2>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {["photo_2", "photo_3"].filter((k) => images?.[k]).map((key) => (
              <div key={key} className="aspect-[3/4] rounded-xl overflow-hidden">
                <img src={images![key]!} alt={fullName ? `Additional photo of ${fullName}` : "Additional profile photo"} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto custom-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all flex-shrink-0 whitespace-nowrap",
              activeTab === tab.id
                ? "border-gold text-gold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === "personal" && (
        <div className="luxury-card p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label="Full Name" value={fullName || "—"} />
          <InfoRow label="Gender" value={personal?.gender ? titleCase(String(personal.gender)) : "—"} />
          <InfoRow label="Date of Birth" value={personal?.date_of_birth ? formatDate(String(personal.date_of_birth)) : "—"} />
          <InfoRow label="Place of Birth" value={String(personal?.place_of_birth || "—")} />
          <InfoRow label="Time of Birth" value={String(personal?.time_of_birth || "—")} />
          <InfoRow label="Blood Group" value={String(personal?.blood_group || "—")} />
          <InfoRow label="Complexion" value={String(personal?.complexion || "—")} />
          <InfoRow label="Nakshatram" value={String(personal?.nakshatram || "—")} />
          <InfoRow label="Rashi" value={String(personal?.rashi || "—")} />
          <InfoRow label="Manglik" value={personal?.manglik ? titleCase(String(personal.manglik)) : "—"} />
          <InfoRow label="Mother Tongue" value={String(personal?.mother_tongue || "—")} />
          <InfoRow label="Languages" value={((personal?.languages_known as string[]) || []).join(", ") || "—"} />
          <InfoRow label="Food Preference" value={personal?.food_preference ? titleCase(String(personal.food_preference).replace(/_/g, " ")) : "—"} />
          <InfoRow label="Habits" value={String(personal?.habits || "—")} />
          <InfoRow label="Nationality" value={String(personal?.nationality || "Indian")} />
          {/* Contact - only if visibility allows */}
          {visibility?.show_phone && contact?.phone && (
            <InfoRow label="Phone" value={contact.phone} icon={<Phone className="w-3.5 h-3.5" />} />
          )}
          {visibility?.show_email && contact?.email && (
            <InfoRow label="Email" value={contact.email} />
          )}
        </div>
      )}

      {activeTab === "profession" && (
        <div className="luxury-card p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label="Profession" value={prof?.profession ? String(prof.profession) : "—"} />
          <InfoRow label="Designation" value={prof?.designation ? String(prof.designation) : "—"} />
          <InfoRow label="Company" value={prof?.company_name ? String(prof.company_name) : "—"} />
          <InfoRow label="Company Location" value={prof?.company_location ? String(prof.company_location) : "—"} />
          <InfoRow label="Work Country" value={prof?.work_country ? String(prof.work_country) : "—"} />
          <InfoRow label="Employment Type" value={prof?.employment_type ? titleCase(String(prof.employment_type).replace(/_/g, " ")) : "—"} />
          {!!visibility?.show_income && !!prof?.annual_income && (
            <InfoRow label="Annual Income" value={formatIncome(Number(prof.annual_income))} />
          )}
          <InfoRow label="Visa Status" value={prof?.visa_status ? String(prof.visa_status).toUpperCase() : "—"} />
          <InfoRow label="10th Qualification" value={edu?.qualification_10th || "—"} />
          <InfoRow label="12th Qualification" value={edu?.qualification_12th || "—"} />
          <InfoRow label="Qualification" value={edu?.highest_qualification || "—"} />
          <InfoRow label="College" value={edu?.college || "—"} />
          <InfoRow label="University" value={edu?.university || "—"} />
          <InfoRow label="Year Passed" value={String(edu?.year_passed || "—")} />
        </div>
      )}

      {activeTab === "family" && (
        <div className="luxury-card p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label="Father's Name" value={fam?.father_name ? String(fam.father_name) : "—"} />
          <InfoRow label="Father's Profession" value={fam?.father_profession ? String(fam.father_profession) : "—"} />
          <InfoRow label="Mother's Name" value={fam?.mother_name ? String(fam.mother_name) : "—"} />
          <InfoRow label="Mother's Profession" value={fam?.mother_profession ? String(fam.mother_profession) : "—"} />
          <InfoRow label="Grandfather (Paternal)" value={fam?.grandfather_name_paternal ? String(fam.grandfather_name_paternal) : "—"} />
          <InfoRow label="Grandmother (Paternal)" value={fam?.grandmother_name_paternal ? String(fam.grandmother_name_paternal) : "—"} />
          <InfoRow label="Grandfather (Maternal)" value={fam?.grandfather_name_maternal ? String(fam.grandfather_name_maternal) : "—"} />
          <InfoRow label="Grandmother (Maternal)" value={fam?.grandmother_name_maternal ? String(fam.grandmother_name_maternal) : "—"} />
          <InfoRow label="Brothers" value={`${fam?.brothers || 0} (Married: ${fam?.married_brothers || 0})`} />
          <InfoRow label="Sisters" value={`${fam?.sisters || 0} (Married: ${fam?.married_sisters || 0})`} />
          <InfoRow label="Family Type" value={fam?.family_type ? titleCase(String(fam.family_type)) : "—"} />
          <InfoRow label="Family Status" value={fam?.family_status ? String(fam.family_status) : "—"} />
          <InfoRow label="Native Place" value={fam?.native_place ? String(fam.native_place) : "—"} />
          {!!(fam?.siblings as Array<Record<string, unknown>>)?.length && (
            <div className="md:col-span-2 pt-3 mt-2 border-t border-gray-100">
              <h3 className="font-serif text-base font-bold text-navy-dark mb-3">Sibling Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(fam!.siblings as Array<Record<string, unknown>>).map((sib, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-gold mb-2">Sibling {i + 1}</p>
                    <InfoRow label="Name" value={sib.name ? String(sib.name) : "—"} />
                    <InfoRow label="Marital Status" value={sib.marital_status ? titleCase(String(sib.marital_status)) : "—"} />
                    <InfoRow label="Occupation" value={sib.occupation ? String(sib.occupation) : "—"} />
                    <InfoRow label="Education" value={sib.education ? String(sib.education) : "—"} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "property" && (
        <div className="luxury-card p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label="Owns Property" value={propertyDetails?.owns_property ? "Yes" : "No"} />
          <InfoRow label="Property Type" value={propertyDetails?.property_type ? String(propertyDetails.property_type) : "—"} />
          <InfoRow label="Property Location" value={propertyDetails?.property_location ? String(propertyDetails.property_location) : "—"} />
          <InfoRow label="Estimated Value" value={propertyDetails?.property_value ? formatIncome(Number(propertyDetails.property_value)) : "—"} />
          {!!propertyDetails?.property_description && (
            <div className="md:col-span-2">
              <InfoRow label="Description" value={String(propertyDetails.property_description)} />
            </div>
          )}
        </div>
      )}

      {activeTab === "preferences" && (
        <div className="luxury-card p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label="Age Range" value={`${prefs?.age_min || "Any"} – ${prefs?.age_max || "Any"} Years`} />
          <InfoRow label="Height Range" value={prefs?.height_min_cm ? `${formatHeight(Number(prefs.height_min_cm))} – ${formatHeight(Number(prefs.height_max_cm) || 220)}` : "No preference"} />
          <InfoRow label="Education" value={prefs?.education ? String(prefs.education) : "No preference"} />
          <InfoRow label="Profession" value={prefs?.profession ? String(prefs.profession) : "No preference"} />
          <InfoRow label="Location" value={prefs?.location ? String(prefs.location) : "No preference"} />
          <InfoRow label="Religion" value={prefs?.religion ? String(prefs.religion) : "No preference"} />
          <InfoRow label="Caste" value={prefs?.caste ? String(prefs.caste) : "No preference"} />
          <InfoRow label="Min Income" value={prefs?.income_min ? formatIncome(Number(prefs.income_min)) : "No preference"} />
          {!!prefs?.other_preferences && (
            <div className="md:col-span-2">
              <InfoRow label="Other" value={String(prefs.other_preferences)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon, className }: {
  label: string; value: string;
  icon?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-0.5 sm:gap-3 py-1", className)}>
      <span className="text-gray-400 text-sm sm:w-36 flex-shrink-0">{label}</span>
      <span className="text-navy-dark text-sm font-medium flex-1 flex items-center gap-1.5">
        {icon}
        {value}
      </span>
    </div>
  );
}