"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  FileDown, User, MapPin, Phone, Briefcase, GraduationCap,
  Users, Heart, CheckCircle, Clock, XCircle,
} from "lucide-react";
import { calculateAge, formatDate, formatHeight, formatIncome, titleCase, cn, STATUS_COLORS } from "@/lib/utils";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

interface Props {
  profile: Record<string, unknown>;
}

export function BiodataClient({ profile }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  const personal = profile.personal as Record<string, unknown> | null;
  const addr = profile.address as Record<string, string> | null;
  const contact = profile.contact as Record<string, string> | null;
  const prof = profile.profession as Record<string, unknown> | null;
  const edu = profile.education as Record<string, string> | null;
  const fam = profile.family as Record<string, unknown> | null;
  const prefs = profile.partner_preferences as Record<string, unknown> | null;
  const images = profile.images as Record<string, string | null> | null;

  const fullName = [personal?.first_name, personal?.middle_name, personal?.last_name]
    .filter(Boolean).join(" ") as string;

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
      toast.success("Biodata downloaded successfully!");
    } catch {
      toast.error("Failed to download biodata. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const statusIcon = {
    approved: <CheckCircle className="w-4 h-4 text-green-500" />,
    pending: <Clock className="w-4 h-4 text-yellow-500" />,
    rejected: <XCircle className="w-4 h-4 text-red-500" />,
  }[String(profile.status)] || null;

  return (
    <div className="space-y-6">
      {/* Profile header card */}
      <div className="luxury-card overflow-hidden">
        <div className="h-20 bg-navy-gradient relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 50%)", backgroundSize: "15px 15px" }}
          />
        </div>
        <div className="px-4 sm:px-6 pb-6">
          <div className="flex items-end gap-3 sm:gap-4 -mt-10 mb-5">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-card overflow-hidden bg-gold/10 flex items-center justify-center flex-shrink-0">
              {images?.profile_photo ? (
                <img src={images.profile_photo} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-2xl font-bold text-gold">
                  {(personal?.first_name as string)?.[0] || "?"}
                </span>
              )}
            </div>
            <div className="pb-1 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-serif font-bold text-navy-dark">{fullName || "—"}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm text-gold font-semibold">{String(profile.profile_id)}</span>
                    <span className={cn("badge flex items-center gap-1", STATUS_COLORS[String(profile.status)] || "badge-gray")}>
                      {statusIcon}
                      {titleCase(String(profile.status))}
                    </span>
                    {Boolean(profile.is_verified) && <VerifiedBadge withLabel size="sm" />}
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="btn-gold"
                >
                  <FileDown className="w-4 h-4" />
                  {isDownloading ? "Generating..." : "Download PDF"}
                </button>
              </div>
            </div>
          </div>

          {/* Completion */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-600">Profile Completion</span>
              <span className="text-sm font-bold text-gold">{Number(profile.profile_completion) || 0}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-gradient rounded-full"
                style={{ width: `${Number(profile.profile_completion) || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal */}
        <Section title="Personal Details" icon={User}>
          <Row label="Date of Birth" value={personal?.date_of_birth ? formatDate(String(personal.date_of_birth)) : "—"} />
          <Row label="Age" value={personal?.date_of_birth ? `${calculateAge(String(personal.date_of_birth))} Years` : "—"} />
          <Row label="Height" value={personal?.height_cm ? formatHeight(Number(personal.height_cm)) : "—"} />
          <Row label="Religion" value={String(personal?.religion || "—")} />
          <Row label="Caste" value={[personal?.caste, personal?.sub_caste].filter(Boolean).join(" / ") || "—"} />
          <Row label="Gothram" value={String(personal?.gothram || "—")} />
          <Row label="Nakshatram" value={String(personal?.nakshatram || "—")} />
          <Row label="Rashi" value={String(personal?.rashi || "—")} />
          <Row label="Manglik" value={personal?.manglik ? titleCase(String(personal.manglik)) : "—"} />
          <Row label="Marital Status" value={personal?.marital_status ? titleCase(String(personal.marital_status).replace(/_/g, " ")) : "—"} />
          <Row label="Mother Tongue" value={String(personal?.mother_tongue || "—")} />
          <Row label="Food Preference" value={personal?.food_preference ? titleCase(String(personal.food_preference).replace(/_/g, " ")) : "—"} />
        </Section>

        <div className="space-y-6">
          {/* Contact (admin-controlled visibility) */}
          <Section title="Contact" icon={Phone}>
            <Row label="Phone" value={(profile.visibility as Record<string, boolean>)?.show_phone ? String(contact?.phone || "—") : "Hidden by admin"} masked={!(profile.visibility as Record<string, boolean>)?.show_phone} />
            <Row label="Email" value={(profile.visibility as Record<string, boolean>)?.show_email ? String(contact?.email || "—") : "Hidden by admin"} masked={!(profile.visibility as Record<string, boolean>)?.show_email} />
          </Section>

          {/* Address */}
          <Section title="Location" icon={MapPin}>
            <Row label="Village/Town" value={[addr?.village, addr?.town].filter(Boolean).join(", ") || "—"} />
            <Row label="District" value={String(addr?.district || "—")} />
            <Row label="State" value={String(addr?.state || "—")} />
            <Row label="Country" value={String(addr?.country || "India")} />
          </Section>
        </div>

        {/* Profession */}
        <Section title="Profession" icon={Briefcase}>
          <Row label="Profession" value={String(prof?.profession || "—")} />
          <Row label="Designation" value={String(prof?.designation || "—")} />
          <Row label="Company" value={String(prof?.company_name || "—")} />
          <Row label="Employment Type" value={prof?.employment_type ? titleCase(String(prof.employment_type).replace(/_/g, " ")) : "—"} />
          <Row label="Annual Income" value={(profile.visibility as Record<string, boolean>)?.show_income && prof?.annual_income ? formatIncome(Number(prof.annual_income)) : (prof?.annual_income ? "Hidden by admin" : "—")} masked={!!(prof?.annual_income) && !(profile.visibility as Record<string, boolean>)?.show_income} />
          <Row label="Work Country" value={String(prof?.work_country || "—")} />
        </Section>

        {/* Education */}
        <Section title="Education" icon={GraduationCap}>
          <Row label="Qualification" value={String(edu?.highest_qualification || "—")} />
          <Row label="College" value={String(edu?.college || "—")} />
          <Row label="University" value={String(edu?.university || "—")} />
          <Row label="Year" value={String(edu?.year_passed || "—")} />
        </Section>

        {/* Family */}
        <Section title="Family" icon={Users}>
          <Row label="Father" value={[fam?.father_name, fam?.father_profession].filter(Boolean).join(", ") || "—"} />
          <Row label="Mother" value={[fam?.mother_name, fam?.mother_profession].filter(Boolean).join(", ") || "—"} />
          <Row label="Brothers" value={`${fam?.brothers || 0} (${fam?.married_brothers || 0} married)`} />
          <Row label="Sisters" value={`${fam?.sisters || 0} (${fam?.married_sisters || 0} married)`} />
          <Row label="Family Type" value={fam?.family_type ? titleCase(String(fam.family_type)) : "—"} />
          <Row label="Native Place" value={String(fam?.native_place || "—")} />
        </Section>

        {/* Partner Preferences */}
        <Section title="Partner Preferences" icon={Heart}>
          <Row label="Age" value={`${prefs?.age_min || "Any"} – ${prefs?.age_max || "Any"} Years`} />
          <Row label="Height" value={prefs?.height_min_cm ? `${formatHeight(Number(prefs.height_min_cm))} – ${formatHeight(Number(prefs.height_max_cm) || 220)}` : "No preference"} />
          <Row label="Education" value={String(prefs?.education || "No preference")} />
          <Row label="Location" value={String(prefs?.location || "No preference")} />
          <Row label="Religion" value={String(prefs?.religion || "No preference")} />
          <Row label="Caste" value={String(prefs?.caste || "No preference")} />
        </Section>
      </div>

      {/* About Me */}
      {!!profile.about_me && (
        <Section title="About Me" icon={User}>
          <p className="text-gray-600 text-sm leading-relaxed">{String(profile.about_me)}</p>
        </Section>
      )}

      {/* Photos */}
      <div className="luxury-card p-5">
        <h3 className="font-serif font-semibold text-navy-dark mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-gold" /> Photos
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {["profile_photo", "photo_2", "photo_3"].map((key, i) => (
            <div key={key} className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              {images?.[key] ? (
                <img src={images[key]!} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                  {i === 0 ? "Profile Photo" : `Photo ${i + 1}`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="luxury-card p-5">
      <h3 className="font-serif font-semibold text-navy-dark mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
        <Icon className="w-4 h-4 text-gold" /> {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value, masked }: { label: string; value: string; masked?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-3">
      <span className="text-gray-400 text-sm sm:w-32 flex-shrink-0">{label}</span>
      <span className={cn("text-sm flex-1", masked ? "text-gray-300 italic" : "text-navy-dark font-medium")}>
        {value}
      </span>
    </div>
  );
}