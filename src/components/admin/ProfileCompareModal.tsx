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
  const firstName = (p: Profile) => p.personal?.first_name || "Candidate";

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[100] bg-stone-950/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-10"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/60 shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)] w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden text-stone-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky Header */}
          <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 md:px-8 md:py-5 border-b border-stone-100 bg-white/95 backdrop-blur-md shrink-0 z-30">
            <div className="min-w-0 pr-2">
              <h2 className="font-serif font-bold text-[#3A101E] text-base sm:text-lg md:text-xl tracking-tight truncate">
                Profile Comparison
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5 hidden sm:block truncate">
                Side-by-side demographic and compatibility breakdown
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading || loading || !!error || !profiles}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#3A101E] text-white font-medium text-xs hover:bg-[#4E1629] active:scale-[0.98] transition-all shadow-xs disabled:opacity-40 disabled:pointer-events-none"
              >
                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-[#E5C370]" />}
                <span>{isDownloading ? "Generating..." : <span className="hidden sm:inline">Download Biodatas</span>}</span>
                {!isDownloading && <span className="sm:hidden">PDF</span>}
              </button>
              <button
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/60 text-stone-400 hover:text-stone-700 transition-all active:scale-95"
                title="Close"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1 divide-y divide-stone-100">
            {loading && (
              <div className="py-32 flex flex-col items-center justify-center text-stone-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#3A101E] mb-3" />
                <p className="text-xs font-medium tracking-wider uppercase text-stone-400">Loading candidate data…</p>
              </div>
            )}

            {error && (
              <div className="py-24 text-center px-4">
                <div className="inline-block px-6 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium">
                  {error}
                </div>
              </div>
            )}

            {profiles && !loading && !error && (
              <>
                {/* Responsive Hero Banner */}
                <div className="grid grid-cols-2 gap-3 sm:gap-6 md:gap-8 px-3 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 bg-stone-50/40">
                  {profiles.map((p, index) => (
                    <div key={p.id} className={cn("flex flex-col items-center text-center min-w-0", index === 0 ? "border-r border-stone-200/50 pr-2 sm:pr-4" : "pl-2 sm:pl-4")}>
                      
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden bg-white flex items-center justify-center shrink-0">
                        {p.images?.profile_photo ? (
                          <img src={p.images.profile_photo} alt={name(p)} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-serif text-xl sm:text-2xl font-bold text-stone-300">
                            {p.personal?.first_name?.[0] || "?"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 mt-3 sm:mt-4 flex-wrap justify-center max-w-full">
                        <h3 className="font-serif font-semibold text-[#3A101E] text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{name(p)}</h3>
                        {p.is_verified && <VerifiedBadge size="sm" />}
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-mono text-[10px] sm:text-[11px] font-medium tracking-wide">
                          {p.profile_id}
                        </span>
                      </div>
                      
                      {(p.images?.photo_2 || p.images?.photo_3) && (
                        <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-stone-200/40 w-full justify-center">
                          {[p.images?.photo_2, p.images?.photo_3].filter(Boolean).map((url, j) => (
                            <a key={j} href={url as string} target="_blank" rel="noreferrer" className="w-8 h-10 sm:w-10 sm:h-12 rounded-md sm:rounded-lg overflow-hidden border border-stone-200 block hover:opacity-80 transition-opacity shadow-2xs">
                              <img src={url as string} alt={`${name(p)} extra ${j + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Comparison Sections */}
                <div className="p-3 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-stone-50/20">
                  {buildSections(profiles[0], profiles[1]).map((section) => (
                    <div key={section.title} className="rounded-xl sm:rounded-2xl border border-stone-200/60 overflow-hidden bg-white shadow-2xs">
                      
                      {/* Section Title */}
                      <div className="flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-3.5 bg-stone-50/80 border-b border-stone-100">
                        <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-white border border-stone-200/60 text-[#3A101E] shadow-2xs shrink-0">
                          <section.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#3A101E]">{section.title}</span>
                      </div>

                      {/* Responsive Rows */}
                      <div className="divide-y divide-stone-100">
                        {section.rows.map((row) => {
                          const differs = row.a !== row.b;
                          return (
                            <div 
                              key={row.label} 
                              className="grid grid-cols-2 md:grid-cols-[minmax(160px,200px)_1fr_1fr] text-xs sm:text-sm hover:bg-stone-50/40 transition-colors"
                            >
                              {/* Label: Full width on mobile, column 1 on desktop */}
                              <div className="col-span-2 md:col-span-1 px-4 py-2 md:px-6 md:py-3.5 bg-stone-100/60 md:bg-transparent text-stone-500 md:text-stone-400 font-semibold md:font-medium text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center border-b border-stone-100 md:border-none">
                                {row.label}
                              </div>
                              
                              {/* Candidate A Value */}
                              <div className={cn(
                                "px-3.5 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-3.5 border-r border-stone-100 flex flex-col justify-center text-stone-700 font-normal break-words", 
                                differs && "bg-[#FAF6EE] text-[#3A101E] font-medium md:border-l-2 md:!border-l-[#D4AF37]"
                              )}>
                                <span className="md:hidden text-[9px] font-mono uppercase tracking-wider text-stone-400 mb-0.5 block truncate">
                                  {firstName(profiles[0])}
                                </span>
                                <span>{row.a}</span>
                              </div>

                              {/* Candidate B Value */}
                              <div className={cn(
                                "px-3.5 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-3.5 flex flex-col justify-center text-stone-700 font-normal break-words", 
                                differs && "bg-[#FAF6EE] text-[#3A101E] font-medium md:border-l-2 md:!border-l-[#D4AF37]"
                              )}>
                                <span className="md:hidden text-[9px] font-mono uppercase tracking-wider text-stone-400 mb-0.5 block truncate">
                                  {firstName(profiles[1])}
                                </span>
                                <span>{row.b}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}