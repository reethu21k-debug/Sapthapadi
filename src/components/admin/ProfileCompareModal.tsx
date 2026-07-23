"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, User, Phone, MapPin, Briefcase, GraduationCap, Users, Home, Heart, FileDown } from "lucide-react";
import toast from "react-hot-toast";
import { Profile } from "@/types";
import { createClient } from "@/lib/supabase/client";
import {
  calculateAge, formatDate, formatHeight, formatIncome,
  formatTimeOfBirth, titleCase, cn,
} from "@/lib/utils";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

interface Props {
  ids: [string, string] | null;
  onClose: () => void;
}

interface Row {
  label: string;
  a: string;
  b: string;
}

interface Section {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: Row[];
}

const val = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  return String(v);
};

function buildSections(p1: Profile, p2: Profile): Section[] {
  const per = (p: Profile) => p.personal;
  const con = (p: Profile) => p.contact;
  const addr = (p: Profile) => p.address;
  const prof = (p: Profile) => p.profession;
  const edu = (p: Profile) => p.education;
  const fam = (p: Profile) => p.family;
  const prop = (p: Profile) => p.property;
  const prefs = (p: Profile) => p.partner_preferences;

  return [
    {
      title: "Personal Details",
      icon: User,
      rows: [
        { label: "Date of Birth", a: val(per(p1)?.date_of_birth && formatDate(per(p1)!.date_of_birth)), b: val(per(p2)?.date_of_birth && formatDate(per(p2)!.date_of_birth)) },
        { label: "Age", a: val(per(p1)?.date_of_birth && `${calculateAge(per(p1)!.date_of_birth)} yrs`), b: val(per(p2)?.date_of_birth && `${calculateAge(per(p2)!.date_of_birth)} yrs`) },
        { label: "Gender", a: val(per(p1)?.gender), b: val(per(p2)?.gender) },
        { label: "Marital Status", a: val(per(p1)?.marital_status && titleCase(per(p1)!.marital_status.replace(/_/g, " "))), b: val(per(p2)?.marital_status && titleCase(per(p2)!.marital_status.replace(/_/g, " "))) },
        { label: "Height", a: val(per(p1)?.height_cm && formatHeight(per(p1)!.height_cm)), b: val(per(p2)?.height_cm && formatHeight(per(p2)!.height_cm)) },
        { label: "Weight", a: val(per(p1)?.weight_kg && `${per(p1)?.weight_kg} kg`), b: val(per(p2)?.weight_kg && `${per(p2)?.weight_kg} kg`) },
        { label: "Blood Group", a: val(per(p1)?.blood_group), b: val(per(p2)?.blood_group) },
        { label: "Complexion", a: val(per(p1)?.complexion), b: val(per(p2)?.complexion) },
        { label: "Religion", a: val(per(p1)?.religion), b: val(per(p2)?.religion) },
        { label: "Caste / Sub-caste", a: val([per(p1)?.caste, per(p1)?.sub_caste].filter(Boolean).join(" / ")), b: val([per(p2)?.caste, per(p2)?.sub_caste].filter(Boolean).join(" / ")) },
        { label: "Gothram", a: val(per(p1)?.gothram), b: val(per(p2)?.gothram) },
        { label: "Nakshatram", a: val(per(p1)?.nakshatram), b: val(per(p2)?.nakshatram) },
        { label: "Rashi", a: val(per(p1)?.rashi), b: val(per(p2)?.rashi) },
        { label: "Manglik", a: val(per(p1)?.manglik), b: val(per(p2)?.manglik) },
        { label: "Time of Birth", a: val(formatTimeOfBirth(per(p1)?.time_of_birth)), b: val(formatTimeOfBirth(per(p2)?.time_of_birth)) },
        { label: "Place of Birth", a: val(per(p1)?.place_of_birth), b: val(per(p2)?.place_of_birth) },
        { label: "Languages Known", a: val(per(p1)?.languages_known), b: val(per(p2)?.languages_known) },
        { label: "Dietary Preference", a: val(per(p1)?.food_preference && titleCase(per(p1)!.food_preference.replace(/_/g, " "))), b: val(per(p2)?.food_preference && titleCase(per(p2)!.food_preference.replace(/_/g, " "))) },
        { label: "Habits", a: val(per(p1)?.habits), b: val(per(p2)?.habits) },
        { label: "Nationality", a: val(per(p1)?.nationality), b: val(per(p2)?.nationality) },
      ],
    },
    {
      title: "Contact Details",
      icon: Phone,
      rows: [
        { label: "Phone", a: val(con(p1)?.phone), b: val(con(p2)?.phone) },
        { label: "Alternate Phone", a: val(con(p1)?.alternative_phone), b: val(con(p2)?.alternative_phone) },
        { label: "Email", a: val(con(p1)?.email), b: val(con(p2)?.email) },
        { label: "Emergency Contact", a: val(con(p1)?.emergency_contact), b: val(con(p2)?.emergency_contact) },
      ],
    },
    {
      title: "Address",
      icon: MapPin,
      rows: [
        { label: "Village / Town", a: val([addr(p1)?.village, addr(p1)?.town].filter(Boolean).join(", ")), b: val([addr(p2)?.village, addr(p2)?.town].filter(Boolean).join(", ")) },
        { label: "District", a: val(addr(p1)?.district), b: val(addr(p2)?.district) },
        { label: "State", a: val(addr(p1)?.state), b: val(addr(p2)?.state) },
        { label: "Country", a: val(addr(p1)?.country), b: val(addr(p2)?.country) },
        { label: "Pincode", a: val(addr(p1)?.pincode), b: val(addr(p2)?.pincode) },
      ],
    },
    {
      title: "Professional Background",
      icon: Briefcase,
      rows: [
        { label: "Profession", a: val(prof(p1)?.profession), b: val(prof(p2)?.profession) },
        { label: "Designation", a: val(prof(p1)?.designation), b: val(prof(p2)?.designation) },
        { label: "Company", a: val(prof(p1)?.company_name), b: val(prof(p2)?.company_name) },
        { label: "Work Location", a: val(prof(p1)?.company_location), b: val(prof(p2)?.company_location) },
        { label: "Work Country", a: val(prof(p1)?.work_country), b: val(prof(p2)?.work_country) },
        { label: "Employment Type", a: val(prof(p1)?.employment_type && titleCase(prof(p1)!.employment_type!.replace(/_/g, " "))), b: val(prof(p2)?.employment_type && titleCase(prof(p2)!.employment_type!.replace(/_/g, " "))) },
        { label: "Annual Income", a: val(prof(p1)?.annual_income && formatIncome(prof(p1)!.annual_income!)), b: val(prof(p2)?.annual_income && formatIncome(prof(p2)!.annual_income!)) },
        { label: "Visa Status", a: val(prof(p1)?.visa_status?.toUpperCase()), b: val(prof(p2)?.visa_status?.toUpperCase()) },
      ],
    },
    {
      title: "Education",
      icon: GraduationCap,
      rows: [
        { label: "Highest Qualification", a: val(edu(p1)?.highest_qualification), b: val(edu(p2)?.highest_qualification) },
        { label: "College", a: val(edu(p1)?.college), b: val(edu(p2)?.college) },
        { label: "University", a: val(edu(p1)?.university), b: val(edu(p2)?.university) },
        { label: "Passing Year", a: val(edu(p1)?.year_passed), b: val(edu(p2)?.year_passed) },
      ],
    },
    {
      title: "Family Background",
      icon: Users,
      rows: [
        { label: "Father", a: val([fam(p1)?.father_name, fam(p1)?.father_profession].filter(Boolean).join(" — ")), b: val([fam(p2)?.father_name, fam(p2)?.father_profession].filter(Boolean).join(" — ")) },
        { label: "Mother", a: val([fam(p1)?.mother_name, fam(p1)?.mother_profession].filter(Boolean).join(" — ")), b: val([fam(p2)?.mother_name, fam(p2)?.mother_profession].filter(Boolean).join(" — ")) },
        { label: "Brothers (Married)", a: val(`${fam(p1)?.brothers || 0} (${fam(p1)?.married_brothers || 0})`), b: val(`${fam(p2)?.brothers || 0} (${fam(p2)?.married_brothers || 0})`) },
        { label: "Sisters (Married)", a: val(`${fam(p1)?.sisters || 0} (${fam(p1)?.married_sisters || 0})`), b: val(`${fam(p2)?.sisters || 0} (${fam(p2)?.married_sisters || 0})`) },
        { label: "Family Property", a: val(fam(p1)?.family_property), b: val(fam(p2)?.family_property) },
      ],
    },
    {
      title: "Property",
      icon: Home,
      rows: [
        { label: "Owns Property", a: val(prop(p1)?.owns_property ? "Yes" : "No"), b: val(prop(p2)?.owns_property ? "Yes" : "No") },
        { label: "Property Type", a: val(prop(p1)?.property_type), b: val(prop(p2)?.property_type) },
        { label: "Location", a: val(prop(p1)?.property_location), b: val(prop(p2)?.property_location) },
        { label: "Estimated Value", a: val(prop(p1)?.property_value && formatIncome(prop(p1)!.property_value!)), b: val(prop(p2)?.property_value && formatIncome(prop(p2)!.property_value!)) },
      ],
    },
    {
      title: "Partner Expectations",
      icon: Heart,
      rows: [
        { label: "Age Bracket", a: val(`${prefs(p1)?.age_min || "Any"} – ${prefs(p1)?.age_max || "Any"}`), b: val(`${prefs(p2)?.age_min || "Any"} – ${prefs(p2)?.age_max || "Any"}`) },
        { label: "Preferred Religion", a: val(prefs(p1)?.religion), b: val(prefs(p2)?.religion) },
        { label: "Preferred Caste", a: val(prefs(p1)?.caste), b: val(prefs(p2)?.caste) },
        { label: "Preferred Location", a: val(prefs(p1)?.location), b: val(prefs(p2)?.location) },
        { label: "Education Criteria", a: val(prefs(p1)?.education), b: val(prefs(p2)?.education) },
        { label: "Min Income", a: val(prefs(p1)?.income_min && formatIncome(prefs(p1)!.income_min!)), b: val(prefs(p2)?.income_min && formatIncome(prefs(p2)!.income_min!)) },
      ],
    },
  ];
}

export function ProfileCompareModal({ ids, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<[Profile, Profile] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!ids) {
      setProfiles(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", ids);
      if (cancelled) return;
      if (error || !data || data.length < 2) {
        setError("Failed to load one or both profiles.");
        setLoading(false);
        return;
      }
      // Preserve the original selection order (a-then-b as picked).
      const byId = new Map(data.map((d) => [d.id, d as Profile]));
      const ordered = [byId.get(ids[0])!, byId.get(ids[1])!];
      setProfiles(ordered as [Profile, Profile]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  useEffect(() => {
    if (!ids) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ids, onClose]);

  const handleDownloadPDF = async () => {
    if (!ids) return;
    setIsDownloading(true);
    try {
      const res = await fetch("/api/admin/compare-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || "Failed to generate comparison PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compare-${profiles?.[0]?.profile_id || "a"}-vs-${profiles?.[1]?.profile_id || "b"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Comparison PDF downloaded!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to download comparison PDF";
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!ids) return null;

  const name = (p: Profile) => [p.personal?.first_name, p.personal?.last_name].filter(Boolean).join(" ") || "Unnamed";

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] bg-black/60 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.97, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.97, opacity: 0, y: 10 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60 sticky top-0 z-10">
            <h2 className="font-serif font-bold text-navy-dark text-lg">Compare Profiles</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading || loading || !!error || !profiles}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold text-navy-dark font-semibold text-xs hover:bg-gold-dark hover:text-white transition-all shadow-2xs disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                {isDownloading ? "Generating..." : "Download PDF"}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-200/70 text-gray-500 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs font-medium">Loading profiles…</p>
            </div>
          )}

          {error && (
            <div className="py-20 text-center text-rose-500 text-sm font-medium">{error}</div>
          )}

          {profiles && !loading && !error && (
            <div className="max-h-[80vh] overflow-y-auto">
              {/* Photo + name header row, side by side */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 px-6 pt-6">
                {profiles.map((p, i) => (
                  <div key={p.id} className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gold/10 flex items-center justify-center">
                      {p.images?.profile_photo ? (
                        <img src={p.images.profile_photo} alt={name(p)} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-serif text-3xl font-bold text-gold-dark">
                          {p.personal?.first_name?.[0] || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
                      <p className="font-semibold text-navy-dark text-sm">{name(p)}</p>
                      {p.is_verified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-gold-dark font-mono text-[11px] font-bold tracking-wider uppercase">
                      {p.profile_id}
                    </p>
                    {/* Extra photos, if present */}
                    {(p.images?.photo_2 || p.images?.photo_3) && (
                      <div className="flex gap-2 mt-3">
                        {[p.images?.photo_2, p.images?.photo_3].filter(Boolean).map((url, j) => (
                          <a key={j} href={url as string} target="_blank" rel="noreferrer" className="w-12 h-16 rounded-lg overflow-hidden border border-gray-200 block">
                            <img src={url as string} alt={`${name(p)} extra ${j + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Field sections */}
              <div className="px-6 pb-6 mt-6 space-y-6">
                {buildSections(profiles[0], profiles[1]).map((section) => (
                  <div key={section.title} className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
                      <section.icon className="w-3.5 h-3.5 text-gold" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{section.title}</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {section.rows.map((row) => {
                        const differs = row.a !== row.b;
                        return (
                          <div key={row.label} className="grid grid-cols-[minmax(90px,140px)_1fr_1fr] text-xs sm:text-sm">
                            <div className="px-3 py-2.5 text-gray-400 font-medium text-[11px] uppercase tracking-wider flex items-center">
                              {row.label}
                            </div>
                            <div className={cn("px-3 py-2.5 border-l border-gray-50 flex items-center", differs && "bg-amber-50/60 font-semibold text-navy-dark")}>
                              {row.a}
                            </div>
                            <div className={cn("px-3 py-2.5 border-l border-gray-50 flex items-center", differs && "bg-amber-50/60 font-semibold text-navy-dark")}>
                              {row.b}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}