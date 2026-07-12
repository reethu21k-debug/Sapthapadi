"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Edit, CheckCircle, XCircle, Ban, RefreshCw, FileDown,
  Share2, Eye, User, MapPin, Phone, Briefcase,
  GraduationCap, Users, Heart, Shield, Clock, ArrowLeft,
  BadgeCheck, ShieldOff, Trash2, Calendar, Activity, ExternalLink, Home,
  Upload, FileText, Lock, Loader2, HeartHandshake,
} from "lucide-react";
import Link from "next/link";
import { Profile, AuditLog, AuditAction, ProfileAdminDocuments } from "@/types";
import {
  calculateAge, formatDate, formatHeight, formatIncome,
  formatRelativeTime, titleCase, STATUS_COLORS, cn, PLAN_LABELS,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { logAuditAction, notifyProfileOwner, sendBestEffortEmail } from "@/lib/audit";
import { fetchCompletedMatchMeetings, MatchMeetingPartner } from "@/lib/match-meetings";

interface Props {
  profile: Profile;
  subscription: Record<string, unknown> | null;
  accessList: Record<string, unknown>[];
  auditLogs: AuditLog[];
  adminDocuments?: ProfileAdminDocuments | null;
  completedMatchMeetings?: number;
}

export function ProfileDetailView({ profile, subscription, accessList, auditLogs, adminDocuments, completedMatchMeetings = 0 }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [saForm, setSaForm] = useState<ProfileAdminDocuments | null>(adminDocuments || null);
  const [isSaFormUploading, setIsSaFormUploading] = useState(false);
  const [isSaFormDeleting, setIsSaFormDeleting] = useState(false);
  const [matchMeetingPartners, setMatchMeetingPartners] = useState<MatchMeetingPartner[] | null>(null);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);

  const p = profile.personal;
  const addr = profile.address;
  const contact = profile.contact;
  const prof = profile.profession;
  const edu = profile.education;
  const fam = profile.family;
  const prop = profile.property;
  const prefs = profile.partner_preferences;

  const fullName = [p?.first_name, p?.middle_name, p?.last_name].filter(Boolean).join(" ");

  const handleStatusChange = async (
    status: "approved" | "rejected" | "deactivated" | "suspended" | "pending"
  ) => {
    const confirmMsgs: Record<string, string> = {
      approved: "Approve this profile?",
      rejected: "Reject this profile?",
      deactivated: "Deactivate this profile?",
      suspended: "Suspend this profile?",
      pending: "Reactivate this profile?",
    };
    if (!confirm(confirmMsgs[status])) return;

    try {
      const supabase = createClient();
      const update: Record<string, unknown> = { status };
      if (status === "approved") {
        const { data: { user } } = await supabase.auth.getUser();
        update.approved_at = new Date().toISOString();
        update.approved_by = user?.id;
      }
      const { error } = await supabase.from("profiles").update(update).eq("id", profile.id);
      if (error) throw error;
      toast.success(`Profile ${status}`);
      const auditActions: Record<string, AuditAction> = {
        approved: "profile_approved",
        rejected: "profile_rejected",
        deactivated: "profile_deactivated",
        suspended: "profile_suspended",
        pending: "profile_reactivated",
      };
      logAuditAction({
        action: auditActions[status],
        entityType: "profile",
        entityId: profile.id,
        entityName: fullName,
        newValue: update,
      });
      router.refresh();
    } catch {
      toast.error("Action failed");
    }
  };

  const handleVerify = async (verify: boolean) => {
    if (!confirm(verify ? "Verify this profile and show the Verified badge?" : "Remove the Verified badge from this profile?")) return;
    try {
      const supabase = createClient();
      let update: Record<string, unknown>;
      if (verify) {
        const { data: { user } } = await supabase.auth.getUser();
        update = { is_verified: true, verified_by: user?.id, verified_at: new Date().toISOString() };
      } else {
        update = { is_verified: false, verified_by: null, verified_at: null };
      }
      const { error } = await supabase.from("profiles").update(update).eq("id", profile.id);
      if (error) throw error;
      toast.success(verify ? "Profile verified — badge now visible across the app" : "Verification removed");
      logAuditAction({
        action: verify ? "profile_verified" : "profile_unverified",
        entityType: "profile",
        entityId: profile.id,
        entityName: fullName,
        newValue: update,
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
          to: contact?.email,
          name: p?.first_name,
          template: "profile_verified",
          data: { profile_id: profile.profile_id },
        });
      }
      router.refresh();
    } catch {
      toast.error("Action failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${fullName || "this profile"}? This cannot be undone.`)) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").delete().eq("id", profile.id);
      if (error) throw error;
      toast.success("Profile deleted");
      logAuditAction({
        action: "profile_deleted",
        entityType: "profile",
        entityId: profile.id,
        entityName: fullName,
        oldValue: { profile_id: profile.profile_id, status: profile.status, is_verified: profile.is_verified },
      });
      router.push("/admin/profiles");
      router.refresh();
    } catch {
      toast.error("Failed to delete profile");
    }
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const res = await fetch(`/api/biodata/${profile.id}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${profile.profile_id}-biodata.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Biodata PDF generated and downloaded!");
    } catch {
      toast.error("Failed to generate biodata");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSaFormUpload = async (file: File | null) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB).");
      return;
    }

    setIsSaFormUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("profile_id", profile.id);

      const res = await fetch("/api/admin/sa-form", { method: "POST", body });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Upload failed");

      setSaForm((prev) => ({
        ...(prev as ProfileAdminDocuments),
        id: prev?.id || "",
        profile_id: profile.id,
        sa_form_url: result.url,
        sa_form_format: result.format,
        sa_form_uploaded_at: new Date().toISOString(),
        created_at: prev?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      toast.success("SA Form uploaded!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      setIsSaFormUploading(false);
    }
  };

  const handleSaFormDelete = async () => {
    if (!confirm("Remove the SA Form for this profile?")) return;

    setIsSaFormDeleting(true);
    try {
      const res = await fetch(`/api/admin/sa-form?profile_id=${profile.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove SA Form");
      setSaForm(null);
      toast.success("SA Form removed.");
    } catch {
      toast.error("Failed to remove SA Form");
    } finally {
      setIsSaFormDeleting(false);
    }
  };

  const TABS = [
    { id: "overview", label: "Overview", icon: User },
    { id: "family", label: "Family", icon: Users },
    { id: "property", label: "Property", icon: Home },
    { id: "partner", label: "Partner Prefs", icon: Heart },
    { id: "access", label: "Access Control", icon: Shield },
    { id: "meetings", label: "Match Meetings", icon: HeartHandshake },
    { id: "audit", label: "Audit Log", icon: Clock },
  ];

  const loadMatchMeetings = () => {
    if (matchMeetingPartners !== null || isLoadingMeetings) return;
    setIsLoadingMeetings(true);
    fetchCompletedMatchMeetings(profile)
      .then(setMatchMeetingPartners)
      .finally(() => setIsLoadingMeetings(false));
  };

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <Link 
        href="/admin/profiles" 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-navy-dark text-xs font-semibold uppercase tracking-wider transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
        Back to Profiles Management
      </Link>

      {/* Main Profile Header Card */}
      <div className="luxury-card overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Decorative Top Pattern */}
        <div className="h-28 bg-gradient-to-r from-navy-dark via-[#1e1810] to-navy-dark relative">
          <div 
            className="absolute inset-0 opacity-15"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 20px)", backgroundSize: "28px 28px" }}
          />
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6 -mt-14 mb-6">
            {/* Profile Avatar */}
            <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gold/10 flex items-center justify-center flex-shrink-0 relative group">
              {profile.images?.profile_photo ? (
                <img src={profile.images.profile_photo} alt={fullName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <span className="font-serif text-4xl font-bold text-gold-dark">
                  {p?.first_name?.[0] || "?"}
                </span>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl font-serif font-bold text-navy-dark tracking-tight">
                      {fullName || "Unnamed Profile"}
                    </h1>
                    {profile.is_verified && <VerifiedBadge />}
                  </div>

                  <p className="text-gold-dark font-mono text-xs font-bold tracking-wider uppercase mt-0.5">
                    ID: {profile.profile_id}
                  </p>

                  {/* Badges Row */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs", STATUS_COLORS[profile.status])}>
                      {titleCase(profile.status)}
                    </span>
                    
                    {profile.is_verified && <VerifiedBadge withLabel size="sm" />}

                    <div className="h-4 w-px bg-gray-200 hidden sm:block mx-1" />

                    {p?.gender && (
                      <span className="text-gray-600 text-xs font-medium bg-gray-100 px-2.5 py-0.5 rounded-md capitalize">
                        {p.gender}
                      </span>
                    )}
                    {p?.date_of_birth && (
                      <span className="text-gray-600 text-xs font-medium bg-gray-100 px-2.5 py-0.5 rounded-md">
                        {calculateAge(p.date_of_birth)} yrs old
                      </span>
                    )}
                    {p?.marital_status && (
                      <span className="text-gray-600 text-xs font-medium bg-gray-100 px-2.5 py-0.5 rounded-md">
                        {titleCase(p.marital_status.replace(/_/g, " "))}
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setActiveTab("meetings");
                        loadMatchMeetings();
                      }}
                      className="inline-flex items-center gap-1.5 text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md hover:bg-rose-100 transition-colors"
                      title="View match meeting history"
                    >
                      <HeartHandshake className="w-3 h-3" /> {completedMatchMeetings} Match {completedMatchMeetings === 1 ? "Meeting" : "Meetings"}
                    </button>
                  </div>
                </div>

                {/* Primary Action Toolbar */}
                <div className="flex items-center gap-2 flex-wrap pt-2 xl:pt-0">
                  <Link
                    href={`/admin/profiles/${profile.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:border-gold hover:text-gold-dark transition-all shadow-2xs"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Profile
                  </Link>

                  {profile.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatusChange("approved")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-all shadow-2xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange("rejected")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-all shadow-2xs"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}

                  {profile.status === "approved" && (
                    <button
                      onClick={() => handleStatusChange("deactivated")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-all shadow-2xs"
                    >
                      <Ban className="w-3.5 h-3.5" /> Deactivate
                    </button>
                  )}

                  {["deactivated", "suspended"].includes(profile.status) && (
                    <button
                      onClick={() => handleStatusChange("pending")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-all shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reactivate
                    </button>
                  )}

                  {!profile.is_verified ? (
                    <button
                      onClick={() => handleVerify(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-all shadow-2xs"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" /> Verify
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerify(false)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:border-gray-300 transition-all shadow-2xs"
                    >
                      <ShieldOff className="w-3.5 h-3.5" /> Remove Verification
                    </button>
                  )}

                  <button
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold text-navy-dark font-semibold text-xs hover:bg-gold-dark hover:text-white transition-all shadow-2xs disabled:opacity-50"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    {isGeneratingPDF ? "Generating..." : "Download Biodata"}
                  </button>

                  <button
                    onClick={handleDelete}
                    aria-label="Delete Profile"
                    className="inline-flex items-center justify-center p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-2xs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Snapshot Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
            {[
              { label: "Religion", value: p?.religion || "—" },
              { label: "Caste / Sub-caste", value: [p?.caste, p?.sub_caste].filter(Boolean).join(" / ") || "—" },
              { label: "Profession", value: prof?.profession || "—" },
              { label: "Location", value: [addr?.district, addr?.state].filter(Boolean).join(", ") || "—" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50/80 rounded-xl p-3 border border-gray-150/60">
                <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider">{item.label}</p>
                <p className="font-semibold text-navy-dark text-sm mt-0.5 truncate">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Progress Completion Bar */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-600">Profile Completion Bar</span>
              <span className="text-xs font-bold text-gold-dark">{profile.profile_completion || 0}% Complete</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profile.profile_completion || 0}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-gold via-[#F4D78C] to-gold-dark"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto custom-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "meetings") loadMatchMeetings();
              }}
              className={cn(
                "relative flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors outline-none",
                isActive ? "text-gold-dark" : "text-gray-500 hover:text-gray-800"
              )}
            >
              <tab.icon className={cn("w-4 h-4", isActive ? "text-gold" : "text-gray-400")} />
              {tab.label}
              {tab.id === "meetings" && completedMatchMeetings > 0 && (
                <span className="text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-1.5 py-0.5 leading-none">
                  {completedMatchMeetings}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="activeProfileTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InfoCard title="Personal Details" icon={User}>
                <InfoRow label="Date of Birth" value={p?.date_of_birth ? formatDate(p.date_of_birth) : "—"} />
                <InfoRow label="Place of Birth" value={p?.place_of_birth || "—"} />
                <InfoRow label="Time of Birth" value={p?.time_of_birth || "—"} />
                <InfoRow label="Age" value={p?.date_of_birth ? `${calculateAge(p.date_of_birth)} Years` : "—"} />
                <InfoRow label="Height" value={p?.height_cm ? formatHeight(p.height_cm) : "—"} />
                <InfoRow label="Weight" value={p?.weight_kg ? `${p.weight_kg} kg` : "—"} />
                <InfoRow label="Blood Group" value={p?.blood_group || "—"} />
                <InfoRow label="Complexion" value={p?.complexion || "—"} />
                <InfoRow label="Gothram" value={p?.gothram || "—"} />
                <InfoRow label="Nakshatram" value={p?.nakshatram || "—"} />
                <InfoRow label="Rashi" value={p?.rashi || "—"} />
                <InfoRow label="Manglik Status" value={p?.manglik ? titleCase(p.manglik) : "—"} />
                <InfoRow label="Mother Tongue" value={p?.mother_tongue || "—"} />
                <InfoRow label="Spoken Languages" value={(p?.languages_known || []).join(", ") || "—"} />
                <InfoRow label="Marital Status" value={p?.marital_status ? titleCase(p.marital_status.replace(/_/g, " ")) : "—"} />
                <InfoRow label="Dietary Preference" value={p?.food_preference ? titleCase(p.food_preference.replace(/_/g, " ")) : "—"} />
                <InfoRow label="Habits" value={p?.habits || "—"} />
              </InfoCard>

              <div className="space-y-6">
                <InfoCard title="Contact Details" icon={Phone}>
                  <InfoRow label="Primary Phone" value={contact?.phone || "—"} />
                  <InfoRow label="Alternate Phone" value={contact?.alternative_phone || "—"} />
                  <InfoRow label="Email Address" value={contact?.email || "—"} />
                  <InfoRow label="Emergency Contact" value={contact?.emergency_contact || "—"} />
                </InfoCard>

                <InfoCard title="Residential Address" icon={MapPin}>
                  <InfoRow label="Village / Town" value={[addr?.village, addr?.town].filter(Boolean).join(", ") || "—"} />
                  <InfoRow label="District" value={addr?.district || "—"} />
                  <InfoRow label="State / Province" value={addr?.state || "—"} />
                  <InfoRow label="Country" value={addr?.country || "—"} />
                  <InfoRow label="Postal Code" value={addr?.pincode || "—"} />
                </InfoCard>
              </div>

              <InfoCard title="Professional Background" icon={Briefcase}>
                <InfoRow label="Profession" value={prof?.profession || "—"} />
                <InfoRow label="Designation" value={prof?.designation || "—"} />
                <InfoRow label="Employer / Company" value={prof?.company_name || "—"} />
                <InfoRow label="Work Location" value={prof?.company_location || "—"} />
                <InfoRow label="Work Country" value={prof?.work_country || "—"} />
                <InfoRow label="Employment Type" value={prof?.employment_type ? titleCase(prof.employment_type.replace(/_/g, " ")) : "—"} />
                <InfoRow label="Annual Income" value={prof?.annual_income ? formatIncome(prof.annual_income) : "—"} />
                <InfoRow label="Visa Status" value={prof?.visa_status ? prof.visa_status.toUpperCase() : "—"} />
              </InfoCard>

              <InfoCard title="Educational Qualifications" icon={GraduationCap}>
                <InfoRow label="10th Qualification" value={edu?.qualification_10th || "—"} />
                <InfoRow label="12th Qualification" value={edu?.qualification_12th || "—"} />
                <InfoRow label="Highest Qualification" value={edu?.highest_qualification || "—"} />
                <InfoRow label="College Name" value={edu?.college || "—"} />
                <InfoRow label="University" value={edu?.university || "—"} />
                <InfoRow label="Passing Year" value={edu?.year_passed?.toString() || "—"} />
                <InfoRow label="Other Certifications" value={edu?.additional_qualifications || "—"} />
              </InfoCard>

              {profile.about_me && (
                <div className="lg:col-span-2">
                  <InfoCard title="About Me Summary" icon={User}>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line px-1">
                      {profile.about_me}
                    </p>
                  </InfoCard>
                </div>
              )}

              {subscription && (
                <InfoCard title="Active Subscription Plan" icon={Shield}>
                  <InfoRow label="Current Tier" value={PLAN_LABELS[(subscription.plan as string)] || String(subscription.plan)} />
                  <InfoRow label="Plan Status" value={titleCase(String(subscription.status))} />
                  <InfoRow label="Activated On" value={formatDate(String(subscription.start_date))} />
                  <InfoRow label="Valid Until" value={formatDate(String(subscription.expiry_date))} />
                  <InfoRow label="Amount Paid" value={`₹${Number(subscription.amount_paid).toLocaleString("en-IN")}`} />
                  <InfoRow label="Payment Gateway" value={titleCase(String(subscription.payment_mode).replace(/_/g, " "))} />
                </InfoCard>
              )}

              {/* SA Form — admin-only document, never visible to the profile owner */}
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-amber-200/60">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h2 className="font-serif font-bold text-navy-dark text-base">SA Form</h2>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Admin Only
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Optional internal document. Only visible to admins here — never shown to the profile owner or shared members.
                  </p>

                  {saForm?.sa_form_url ? (
                    <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-200/80 px-4 py-3">
                      <a
                        href={saForm.sa_form_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-semibold text-navy-dark hover:text-gold-dark transition-colors truncate"
                      >
                        <FileText className="w-4 h-4 text-gold-dark flex-shrink-0" />
                        <span className="truncate">View SA Form ({(saForm.sa_form_format || "").toUpperCase()})</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                      <button
                        type="button"
                        onClick={handleSaFormDelete}
                        disabled={isSaFormDeleting}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                        title="Remove SA Form"
                      >
                        {isSaFormDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-amber-300/70 hover:border-amber-400 rounded-xl px-4 py-4 cursor-pointer transition-colors bg-white/60 hover:bg-white">
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          handleSaFormUpload(e.target.files?.[0] || null);
                          e.target.value = "";
                        }}
                      />
                      {isSaFormUploading ? (
                        <Loader2 className="w-4 h-4 text-amber-700 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 text-amber-700" />
                      )}
                      <span className="text-xs font-semibold text-amber-800">
                        {isSaFormUploading ? "Uploading..." : "Upload SA Form (PDF or Image, optional)"}
                      </span>
                    </label>
                  )}

                  {saForm?.sa_form_uploaded_at && (
                    <p className="text-[11px] text-gray-400">
                      Uploaded {formatRelativeTime(saForm.sa_form_uploaded_at)}
                    </p>
                  )}
                </div>
              </div>

              {/* Photo Gallery Grid */}
              <div className="lg:col-span-2 luxury-card p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <h2 className="font-serif font-bold text-navy-dark text-lg mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gold" /> Photo Gallery
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {["profile_photo", "photo_2", "photo_3"].map((key, i) => {
                    const photoUrl = (profile.images as Record<string, string | null>)?.[key];
                    return (
                      <div key={key} className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 border border-gray-200/80 relative group shadow-2xs">
                        {photoUrl ? (
                          <>
                            <img src={photoUrl} alt={`Uploaded ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <a 
                              href={photoUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5"
                            >
                              <ExternalLink className="w-4 h-4" /> View Original
                            </a>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                            <Eye className="w-6 h-6 stroke-1" />
                            <span className="text-xs font-medium">{i === 0 ? "Main Profile Photo" : `Secondary Photo ${i}`}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "family" && (
            <div className="luxury-card p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-navy-dark mb-6 flex items-center gap-2 pb-3 border-b border-gray-100">
                <Users className="w-5 h-5 text-gold" /> Family Background & Heritage
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                <InfoRow label="Father's Name" value={fam?.father_name || "—"} />
                <InfoRow label="Father's Profession" value={fam?.father_profession || "—"} />
                <InfoRow label="Mother's Name" value={fam?.mother_name || "—"} />
                <InfoRow label="Mother's Profession" value={fam?.mother_profession || "—"} />
                <InfoRow label="Paternal Grandfather" value={fam?.grandfather_name_paternal || "—"} />
                <InfoRow label="Paternal Grandmother" value={fam?.grandmother_name_paternal || "—"} />
                <InfoRow label="Maternal Grandfather" value={fam?.grandfather_name_maternal || "—"} />
                <InfoRow label="Maternal Grandmother" value={fam?.grandmother_name_maternal || "—"} />
                <InfoRow label="Brothers Count" value={`${fam?.brothers || 0} (Married: ${fam?.married_brothers || 0})`} />
                <InfoRow label="Sisters Count" value={`${fam?.sisters || 0} (Married: ${fam?.married_sisters || 0})`} />
                <InfoRow label="Family Structure" value={fam?.family_type ? titleCase(fam.family_type) : "—"} />
                <InfoRow label="Social Standing" value={fam?.family_status || "—"} />
                <InfoRow label="Core Values" value={fam?.family_values || "—"} />
                <InfoRow label="Ancestral Origin" value={fam?.native_place || "—"} />
                <InfoRow label="Properties / Assets" value={fam?.family_property || "—"} className="md:col-span-2" />
              </div>
            </div>
          )}

          {activeTab === "property" && (
            <div className="luxury-card p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-navy-dark mb-6 flex items-center gap-2 pb-3 border-b border-gray-100">
                <Home className="w-5 h-5 text-gold" /> Property Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                <InfoRow label="Owns Property" value={prop?.owns_property ? "Yes" : "No"} />
                <InfoRow label="Property Type" value={prop?.property_type || "—"} />
                <InfoRow label="Property Location" value={prop?.property_location || "—"} />
                <InfoRow label="Estimated Value" value={prop?.property_value ? formatIncome(prop.property_value) : "—"} />
                <InfoRow label="Description" value={prop?.property_description || "—"} className="md:col-span-2" />
              </div>
            </div>
          )}

          {activeTab === "partner" && (
            <div className="luxury-card p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-navy-dark mb-6 flex items-center gap-2 pb-3 border-b border-gray-100">
                <Heart className="w-5 h-5 text-gold" /> Partner Expectations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                <InfoRow label="Age Bracket" value={`${prefs?.age_min || "Any"} – ${prefs?.age_max || "Any"} Years`} />
                <InfoRow label="Height Bracket" value={prefs?.height_min_cm ? `${formatHeight(prefs.height_min_cm)} – ${formatHeight(prefs.height_max_cm || 220)}` : "No preference"} />
                <InfoRow label="Education Criteria" value={prefs?.education || "No preference"} />
                <InfoRow label="Career Field" value={prefs?.profession || "No preference"} />
                <InfoRow label="Preferred Religion" value={prefs?.religion || "No preference"} />
                <InfoRow label="Preferred Caste" value={prefs?.caste || "No preference"} />
                <InfoRow label="Preferred Location" value={prefs?.location || "No preference"} />
                <InfoRow label="Marital Status" value={(prefs?.marital_status || []).map((s: string) => titleCase(s.replace(/_/g, " "))).join(", ") || "No preference"} />
                <InfoRow label="Min Annual Income" value={prefs?.income_min ? formatIncome(prefs.income_min) : "No preference"} />
                <InfoRow label="Additional Remarks" value={prefs?.other_preferences || "—"} className="md:col-span-2" />
              </div>
            </div>
          )}

          {activeTab === "access" && (
            <div className="luxury-card overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-navy-dark text-lg flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gold" /> Access Grant Ledger
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">External members allowed to view this locked contact profile</p>
                </div>
                <Link href={`/admin/shared-profiles?profile_id=${profile.id}`} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold text-navy-dark font-semibold text-xs hover:bg-gold-dark hover:text-white transition-all shadow-2xs">
                  <Share2 className="w-3.5 h-3.5" /> Grant New Access
                </Link>
              </div>

              {accessList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        <th className="py-3 px-5">Member / User</th>
                        <th className="py-3 px-5">Granted Date</th>
                        <th className="py-3 px-5">Expiry Schedule</th>
                        <th className="py-3 px-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {accessList.map((a) => (
                        <tr key={String(a.id)} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-5">
                            <p className="font-semibold text-navy-dark">{String((a.users as Record<string, unknown>)?.full_name || "—")}</p>
                            <p className="text-xs text-gray-400">{String((a.users as Record<string, unknown>)?.email || "")}</p>
                          </td>
                          <td className="py-3.5 px-5 text-gray-600">{formatDate(String(a.granted_at))}</td>
                          <td className="py-3.5 px-5 text-gray-600">{a.expires_at ? formatDate(String(a.expires_at)) : "Lifetime Access"}</td>
                          <td className="py-3.5 px-5">
                            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", a.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200")}>
                              {a.is_active ? "Active" : "Revoked"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-400 bg-gray-50/30">
                  <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-navy-dark">No Access Granted Yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">This profile remains fully private to the owner and administrators.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "meetings" && (
            <div className="luxury-card overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-navy-dark text-lg flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-gold" /> Match Meeting History
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Everyone {fullName || "this profile"} has had a completed match meeting with</p>
                </div>
                <Link href="/admin/match-meetings" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:border-gold hover:text-gold-dark transition-all shadow-2xs">
                  <ExternalLink className="w-3.5 h-3.5" /> All Match Meetings
                </Link>
              </div>

              {isLoadingMeetings ? (
                <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-xs font-medium">Loading match meetings…</p>
                </div>
              ) : matchMeetingPartners && matchMeetingPartners.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {matchMeetingPartners.map((partner) => (
                    <li key={partner.requestId} className="p-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-gold/15 border border-gold/30 flex items-center justify-center flex-shrink-0">
                        {partner.photo ? (
                          <img src={partner.photo} alt={partner.name ? `${partner.name}'s photo` : "Match partner photo"} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gold-dark text-xs font-bold tracking-wider">{partner.name?.[0] || "?"}</span>
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
                  <p className="text-xs text-gray-400 mt-0.5">Meetings will show up here once an admin marks them as completed.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div className="luxury-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-serif font-bold text-navy-dark text-lg flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gold" /> System Audit Timeline
                </h2>
                <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-150">
                  {auditLogs.length} Events Recorded
                </span>
              </div>

              {auditLogs.length > 0 ? (
                <div className="p-6">
                  <div className="relative space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-150">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="relative pl-9 flex items-start justify-between gap-4 group">
                        {/* Timeline Dot */}
                        <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-white border-2 border-gold group-hover:scale-110 transition-transform shadow-2xs" />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 leading-snug">
                            <span className="font-bold text-navy-dark">{log.actor_name}</span>{" "}
                            <span className="font-medium text-gray-600">{titleCase(log.action.replace(/_/g, " "))}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(log.created_at)}</p>
                        </div>

                        <span className="text-xs font-mono text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded border border-gray-150">
                          {formatDate(log.created_at, "dd MMM yyyy, HH:mm")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-400 bg-gray-50/30">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-navy-dark">No Audit Records</p>
                  <p className="text-xs text-gray-400 mt-0.5">Events regarding this profile will populate here.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function InfoCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="luxury-card p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <h2 className="font-serif font-bold text-navy-dark text-base mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
        <Icon className="w-4 h-4 text-gold" />
        {title}
      </h2>
      <div className="divide-y divide-gray-50/80">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("py-2.5 flex items-start justify-between gap-4 text-sm", className)}>
      <span className="text-gray-400 font-medium w-40 flex-shrink-0 text-xs uppercase tracking-wider mt-0.5">{label}</span>
      <span className="text-navy-dark font-semibold flex-1 text-right sm:text-left leading-normal">{value}</span>
    </div>
  );
}