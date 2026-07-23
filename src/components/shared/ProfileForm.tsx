"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, MapPin, Phone, Briefcase, GraduationCap,
  Users, Heart, Image as ImageIcon, ChevronRight, ChevronLeft, Save, Loader2, Sparkles, FileDown, Plus, Trash2, AlertTriangle, ExternalLink
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile, DuplicateCandidateMatch, IncomeUnit } from "@/types";
import { incomeToAbsolute, absoluteToIncomeParts, buildTimeOfBirth, parseTimeOfBirth } from "@/lib/utils";

const SECTIONS = [
  { id: "personal", label: "Personal", icon: User },
  { id: "address", label: "Address", icon: MapPin },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "profession", label: "Profession", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "family", label: "Family", icon: Users },
  { id: "partner", label: "Partner Prefs", icon: Heart },
  { id: "media", label: "Photos & Docs", icon: ImageIcon },
];

const inputClass = "w-full bg-white/80 border border-[#1a2540]/15 rounded-xl px-4 py-3 text-sm text-[#1a2540] placeholder:text-gray-400 focus:outline-none focus:border-[#C8631C] focus:ring-1 focus:ring-[#C8631C] transition-all duration-200 shadow-sm";
const labelClass = "block text-xs font-semibold uppercase tracking-[0.12em] text-[#1a2540]/80 mb-1.5";
const sectionClass = "grid grid-cols-1 md:grid-cols-2 gap-5";

interface Props {
  mode: "create" | "edit";
  profile?: Profile;
  actor?: "admin" | "self";
  redirectTo?: string;
}

export function ProfileForm({ mode, profile, actor = "admin", redirectTo }: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [createdId, setCreatedId] = useState<string | undefined>(profile?.id);
  const [formData, setFormData] = useState<Record<string, unknown>>({
    personal: profile?.personal || {},
    address: profile?.address || {},
    contact: profile?.contact || {},
    profession: profile?.profession || {},
    education: profile?.education || {},
    family: profile?.family || {},
    partner_preferences: profile?.partner_preferences || {},
    visibility: profile?.visibility || {
      show_phone: false, show_email: false, show_address: false,
      show_family_details: false, show_income: false, show_documents: false,
    },
  });

  // ─── Duplicate candidate detection ───────────────────────────
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateCandidateMatch[]>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const duplicateCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const personalData = formData.personal as Record<string, unknown>;
  const firstName = (personalData.first_name as string) || "";
  const lastName = (personalData.last_name as string) || "";
  const dob = (personalData.date_of_birth as string) || "";

  useEffect(() => {
    if (duplicateCheckTimer.current) clearTimeout(duplicateCheckTimer.current);

    if (!firstName.trim() || !lastName.trim() || !dob) {
      setDuplicateMatches([]);
      return;
    }

    duplicateCheckTimer.current = setTimeout(async () => {
      setIsCheckingDuplicate(true);
      try {
        const res = await fetch("/api/profiles/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dob,
            exclude_id: createdId,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          setDuplicateMatches(result.matches || []);
        }
      } catch {
        // Live check is best-effort; silently skip on network errors.
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 600);

    return () => {
      if (duplicateCheckTimer.current) clearTimeout(duplicateCheckTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, dob, createdId]);

  const checkDuplicateNow = async (): Promise<DuplicateCandidateMatch[]> => {
    if (!firstName.trim() || !lastName.trim() || !dob) return [];
    try {
      const res = await fetch("/api/profiles/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dob,
          exclude_id: createdId,
        }),
      });
      if (!res.ok) return [];
      const result = await res.json();
      return result.matches || [];
    } catch {
      return [];
    }
  };

  const updateSection = (section: string, data: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, [section]: data }));
  };

  const defaultRedirect = actor === "admin" ? "/admin/profiles" : "/user/biodata";

  const handleSave = async (isDraft = false) => {
    // Hard block: candidate matching an existing profile by exact full name
    // + date of birth cannot be saved as a final (non-draft) submission.
    if (!isDraft) {
      const freshMatches = await checkDuplicateNow();
      setDuplicateMatches(freshMatches);
      if (freshMatches.length > 0) {
        toast.error(
          `This looks like a duplicate of an existing profile (${freshMatches[0].profile_id}). Resolve it before saving.`,
          { duration: 6000 }
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const basePayload = {
        ...formData,
        profile_completion: calculateCompletion(formData),
      };

      let error;

      if (createdId) {
        ({ error } = await supabase.from("profiles").update(basePayload).eq("id", createdId));
      } else {
        let payload: Record<string, unknown>;
        if (actor === "admin") {
          const { data: { user } } = await supabase.auth.getUser();
          const now = new Date().toISOString();
          payload = {
            ...basePayload,
            status: "approved",
            is_verified: true,
            verified_by: user?.id,
            verified_at: now,
            approved_by: user?.id,
            approved_at: now,
            created_by: user?.id,
          };
        } else {
          payload = { ...basePayload, status: "pending", is_verified: false };
        }

        const { data: inserted, error: insertError } = await supabase
          .from("profiles")
          .insert([payload])
          .select("id")
          .single();
        error = insertError;
        if (inserted) setCreatedId(inserted.id);
      }

      if (error) throw error;

      if (isDraft) {
        toast.success("Draft saved — you can continue editing.");
      } else {
        toast.success(
          mode === "create"
            ? actor === "admin"
              ? "Profile created and verified!"
              : "Profile submitted! Our team will review and verify it shortly."
            : "Profile updated!"
        );
        router.push(redirectTo || defaultRedirect);
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save profile";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!createdId) {
      toast.error("Please click \"Save Draft\" first, then generate the PDF.");
      return;
    }
    setIsGeneratingPDF(true);
    try {
      const res = await fetch(`/api/biodata/${createdId}`, { method: "POST" });
      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || "Failed to generate PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${profile?.profile_id || createdId}-biodata.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Biodata PDF generated and downloaded!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate biodata";
      toast.error(message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Section navigator */}
      <div className="w-full lg:w-60 flex-shrink-0">
        <div className="bg-[#fffdf9] border border-[#1a2540]/10 rounded-2xl p-3.5 shadow-[0_8px_30px_-12px_rgba(26,37,64,0.08)] sticky top-6">
          <div className="px-3 py-2 mb-2 border-b border-[#1a2540]/10 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C8631C]">Sections</span>
            <span className="text-xs font-serif italic text-gray-500">{activeSection + 1} of {SECTIONS.length}</span>
          </div>
          <nav className="space-y-1">
            {SECTIONS.map((section, i) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(i)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs uppercase tracking-wider font-medium transition-all duration-200 ${
                  activeSection === i
                    ? "bg-[#1a2540] text-[#F3E5AB] shadow-md"
                    : "text-gray-600 hover:bg-[#1a2540]/5 hover:text-[#1a2540]"
                }`}
              >
                <section.icon className={`w-4 h-4 flex-shrink-0 ${activeSection === i ? "text-[#C8631C]" : "text-gray-400"}`} />
                <span className="truncate">{section.label}</span>
                {section.id === "personal" && duplicateMatches.length > 0 && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 ml-auto flex-shrink-0" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 min-w-0">
        {/* Duplicate candidate warning banner */}
        {duplicateMatches.length > 0 && (
          <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">
                Possible duplicate candidate{duplicateMatches.length > 1 ? "s" : ""} found
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Same full name and date of birth as {duplicateMatches.length === 1 ? "an existing profile" : "existing profiles"}. This must be resolved before the profile can be saved.
              </p>
              <ul className="mt-2 space-y-1">
                {duplicateMatches.map((m) => (
                  <li key={m.id}>
                    <a
                      href={`/admin/profiles/${m.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2"
                    >
                      {m.full_name} — {m.profile_id} ({m.status}) <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="bg-[#fffdf9] border border-[#1a2540]/10 rounded-2xl p-6 sm:p-8 shadow-[0_12px_40px_-12px_rgba(26,37,64,0.1)]">
              {activeSection === 0 && (
                <PersonalSection
                  data={formData.personal as Record<string, unknown>}
                  onChange={(d) => updateSection("personal", d)}
                  isCheckingDuplicate={isCheckingDuplicate}
                />
              )}
              {activeSection === 1 && <AddressSection data={formData.address as Record<string, unknown>} onChange={(d) => updateSection("address", d)} />}
              {activeSection === 2 && <ContactSection data={formData.contact as Record<string, unknown>} onChange={(d) => updateSection("contact", d)} />}
              {activeSection === 3 && <ProfessionSection data={formData.profession as Record<string, unknown>} onChange={(d) => updateSection("profession", d)} />}
              {activeSection === 4 && <EducationSection data={formData.education as Record<string, unknown>} onChange={(d) => updateSection("education", d)} />}
              {activeSection === 5 && <FamilySection data={formData.family as Record<string, unknown>} onChange={(d) => updateSection("family", d)} />}
              {activeSection === 6 && <PartnerSection data={formData.partner_preferences as Record<string, unknown>} onChange={(d) => updateSection("partner_preferences", d)} />}
              {activeSection === 7 && <MediaSection data={formData as Record<string, unknown>} onChange={(d) => setFormData(prev => ({ ...prev, ...d }))} profileId={createdId} />}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation + Save Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-[#1a2540]/10">
          <button
            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#1a2540]/20 text-[#1a2540] hover:bg-[#1a2540]/5 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#1a2540]/20 text-[#1a2540] hover:bg-[#1a2540]/5 text-xs font-semibold uppercase tracking-wider transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-[#C8631C]" /> : <Save className="w-4 h-4 text-[#C8631C]" />}
              Save Draft
            </button>

            {createdId && (
              <button
                type="button"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                title="Generate a complete, formatted biodata PDF for this profile"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C8631C]/10 border border-[#C8631C]/40 text-[#C8631C] hover:bg-[#C8631C]/20 disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-all"
              >
                {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                {isGeneratingPDF ? "Generating..." : "Generate PDF"}
              </button>
            )}

            {activeSection < SECTIONS.length - 1 ? (
              <button
                onClick={() => setActiveSection(Math.min(SECTIONS.length - 1, activeSection + 1))}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#1a2540] text-white hover:bg-[#C8631C] px-7 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider shadow-md transition-all duration-200"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSave(false)}
                disabled={isSaving || duplicateMatches.length > 0}
                title={duplicateMatches.length > 0 ? "Resolve the duplicate candidate warning above before saving" : undefined}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-[#1a2540] hover:opacity-95 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-current" />}
                {mode === "create"
                  ? actor === "admin" ? "Create Profile" : "Submit Profile"
                  : "Update Profile"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateCompletion(data: Record<string, unknown>): number {
  const personal = data.personal as Record<string, unknown> || {};
  const fields = ["first_name", "last_name", "gender", "date_of_birth", "religion", "caste", "marital_status"];
  const filled = fields.filter((f) => personal[f]).length;
  return Math.round((filled / fields.length) * 100);
}

// ─── Section Components ───────────────────────────────────────

/** 12-hour time-of-birth picker: hour (1–12) / minute (00–59) / AM-PM. Stores "hh:mm AM/PM". */
function TimeOfBirthInput({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
  const parts = parseTimeOfBirth(value);
  const [hour, setHour] = useState(parts.hour);
  const [minute, setMinute] = useState(parts.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(parts.period);

  const commit = (h: string, m: string, p: "AM" | "PM") => {
    onChange(buildTimeOfBirth(h, m, p));
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        className={inputClass}
        value={hour}
        onChange={(e) => { setHour(e.target.value); commit(e.target.value, minute, period); }}
      >
        <option value="">Hour</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
          <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
        ))}
      </select>
      <select
        className={inputClass}
        value={minute}
        onChange={(e) => { setMinute(e.target.value); commit(hour, e.target.value, period); }}
      >
        <option value="">Min</option>
        {Array.from({ length: 60 }, (_, i) => i).map((m) => (
          <option key={m} value={String(m).padStart(2, "0")}>{String(m).padStart(2, "0")}</option>
        ))}
      </select>
      <select
        className={inputClass}
        value={period}
        onChange={(e) => { const p = e.target.value as "AM" | "PM"; setPeriod(p); commit(hour, minute, p); }}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

/**
 * Annual income entry as an amount + LPA/CR unit; converts to/from the absolute
 * INR value that gets stored.
 *
 * FIX: previously used a flex row (`flex gap-2`) with the amount <input> given
 * no sizing class and the unit <select> locked to `w-28 flex-shrink-0`. As a
 * flex item with no explicit flex-basis, a `type="number"` input's min-content
 * width can collapse down to roughly the width of its spin-button arrows in
 * some browser/build combinations, even after adding `flex-1 min-w-0` — the
 * two properties intersect through flex-basis resolution rules that aren't
 * consistently reliable for number inputs specifically.
 *
 * Switched to an explicit CSS Grid layout instead: `grid-cols-[1fr_7rem]`
 * hard-defines the amount column as "all remaining space" and the unit
 * column as a fixed 7rem (112px, matching the old w-28), independent of
 * either child's own content-based sizing. This sidesteps the flex
 * min-content collapse entirely.
 */
function IncomeInput({ value, onChange, placeholder = "8" }: { value?: number; onChange: (absolute: number | undefined) => void; placeholder?: string }) {
  const initial = absoluteToIncomeParts(value);
  const [amount, setAmount] = useState<string>(initial.amount === "" ? "" : String(initial.amount));
  const [unit, setUnit] = useState<IncomeUnit>(initial.unit);

  const commit = (amt: string, u: IncomeUnit) => {
    if (amt === "") {
      onChange(undefined);
      return;
    }
    const n = Number(amt);
    if (Number.isNaN(n)) return;
    onChange(incomeToAbsolute(n, u));
  };

  return (
    <div className="grid grid-cols-[1fr_7rem] gap-2">
      <input
        className={inputClass}
        type="number"
        min={0}
        step="0.01"
        value={amount}
        onChange={(e) => { setAmount(e.target.value); commit(e.target.value, unit); }}
        placeholder={placeholder}
      />
      <select
        className={inputClass}
        value={unit}
        onChange={(e) => { const u = e.target.value as IncomeUnit; setUnit(u); commit(amount, u); }}
      >
        <option value="lpa">LPA</option>
        <option value="cr">CR</option>
      </select>
    </div>
  );
}

/** 1 foot = 30.48 cm exactly; 1 inch = 2.54 cm exactly. */
const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

function cmToFeetInches(cm: number | undefined): { feet: string; inches: string } {
  if (cm === undefined || cm === null || Number.isNaN(cm)) return { feet: "", inches: "" };
  const totalInches = cm / CM_PER_INCH;
  // Round to the nearest whole inch — feet/inches is a coarser unit than cm,
  // so a value saved as "5 ft 6 in" (167.64 cm exactly) still round-trips
  // back to 5 ft 6 in rather than drifting to 5 ft 5 in / 5 ft 7 in.
  const roundedInches = Math.round(totalInches);
  const feet = Math.floor(roundedInches / INCHES_PER_FOOT);
  const inches = roundedInches % INCHES_PER_FOOT;
  return { feet: String(feet), inches: String(inches) };
}

function feetInchesToCm(feet: string, inches: string): number | undefined {
  if (feet === "" && inches === "") return undefined;
  const f = feet === "" ? 0 : Number(feet);
  const i = inches === "" ? 0 : Number(inches);
  if (Number.isNaN(f) || Number.isNaN(i)) return undefined;
  const totalInches = f * INCHES_PER_FOOT + i;
  return Math.round(totalInches * CM_PER_INCH * 100) / 100;
}

/**
 * Height entered as feet + inches, stored as centimeters (`height_cm` /
 * `height_min_cm` / `height_max_cm`) so every other part of the app — the
 * biodata PDF, profile detail views, and partner-preference height-range
 * matching — keeps working against a single comparable number with no
 * changes needed there. Only the input experience changes.
 */
function HeightInput({ value, onChange }: { value?: number; onChange: (cm: number | undefined) => void }) {
  const initial = cmToFeetInches(value);
  const [feet, setFeet] = useState(initial.feet);
  const [inches, setInches] = useState(initial.inches);

  const commit = (f: string, i: string) => {
    onChange(feetInchesToCm(f, i));
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        className={inputClass}
        value={feet}
        onChange={(e) => { setFeet(e.target.value); commit(e.target.value, inches); }}
      >
        <option value="">Feet</option>
        {Array.from({ length: 8 }, (_, i) => i + 1).map((f) => (
          <option key={f} value={f}>{f} ft</option>
        ))}
      </select>
      <select
        className={inputClass}
        value={inches}
        onChange={(e) => { setInches(e.target.value); commit(feet, e.target.value); }}
      >
        <option value="">Inches</option>
        {Array.from({ length: 12 }, (_, i) => i).map((i) => (
          <option key={i} value={i}>{i} in</option>
        ))}
      </select>
    </div>
  );
}

function PersonalSection({ data, onChange, isCheckingDuplicate }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void; isCheckingDuplicate?: boolean }) {
  const update = (key: string, val: unknown) => onChange({ ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1a2540]/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1a2540]">Personal Details</h2>
        <p className="text-xs font-light text-gray-500 mt-1">
          Basic identification and ceremonial attributes.
          {isCheckingDuplicate && <span className="ml-2 text-[#C8631C] italic">Checking for duplicates…</span>}
        </p>
      </div>
      <div className={sectionClass}>
        <div>
          <label className={labelClass}>First Name *</label>
          <input className={inputClass} value={(data.first_name as string) || ""} onChange={(e) => update("first_name", e.target.value)} placeholder="Priya" />
        </div>
        <div>
          <label className={labelClass}>Middle Name</label>
          <input className={inputClass} value={(data.middle_name as string) || ""} onChange={(e) => update("middle_name", e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label className={labelClass}>Last Name *</label>
          <input className={inputClass} value={(data.last_name as string) || ""} onChange={(e) => update("last_name", e.target.value)} placeholder="Sharma" />
        </div>
        <div>
          <label className={labelClass}>Gender *</label>
          <select className={inputClass} value={(data.gender as string) || ""} onChange={(e) => update("gender", e.target.value)}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Date of Birth *</label>
          <input className={inputClass} type="date" value={(data.date_of_birth as string) || ""} onChange={(e) => update("date_of_birth", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Place of Birth</label>
          <input className={inputClass} value={(data.place_of_birth as string) || ""} onChange={(e) => update("place_of_birth", e.target.value)} placeholder="City, State" />
        </div>
        <div>
          <label className={labelClass}>Time of Birth</label>
          <TimeOfBirthInput value={data.time_of_birth as string} onChange={(v) => update("time_of_birth", v)} />
        </div>
        <div>
          <label className={labelClass}>Height *</label>
          <HeightInput value={data.height_cm as number} onChange={(cm) => update("height_cm", cm)} />
        </div>
        <div>
          <label className={labelClass}>Weight (kg)</label>
          <input className={inputClass} type="number" value={(data.weight_kg as number) || ""} onChange={(e) => update("weight_kg", Number(e.target.value))} placeholder="60" />
        </div>
        <div>
          <label className={labelClass}>Blood Group</label>
          <select className={inputClass} value={(data.blood_group as string) || ""} onChange={(e) => update("blood_group", e.target.value)}>
            <option value="">Select</option>
            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Complexion</label>
          <select className={inputClass} value={(data.complexion as string) || ""} onChange={(e) => update("complexion", e.target.value)}>
            <option value="">Select</option>
            {["Fair","Very Fair","Wheatish","Wheatish Medium","Dark"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Religion *</label>
          <input className={inputClass} value={(data.religion as string) || ""} onChange={(e) => update("religion", e.target.value)} placeholder="Hindu" />
        </div>
        <div>
          <label className={labelClass}>Caste *</label>
          <input className={inputClass} value={(data.caste as string) || ""} onChange={(e) => update("caste", e.target.value)} placeholder="Brahmin" />
        </div>
        <div>
          <label className={labelClass}>Sub Caste</label>
          <input className={inputClass} value={(data.sub_caste as string) || ""} onChange={(e) => update("sub_caste", e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label className={labelClass}>Gothram</label>
          <input className={inputClass} value={(data.gothram as string) || ""} onChange={(e) => update("gothram", e.target.value)} placeholder="Bharadwaj" />
        </div>
        <div>
          <label className={labelClass}>Nakshatram (Star)</label>
          <input className={inputClass} value={(data.nakshatram as string) || ""} onChange={(e) => update("nakshatram", e.target.value)} placeholder="Rohini" />
        </div>
        <div>
          <label className={labelClass}>Rashi</label>
          <input className={inputClass} value={(data.rashi as string) || ""} onChange={(e) => update("rashi", e.target.value)} placeholder="Vrishabha" />
        </div>
        <div>
          <label className={labelClass}>Manglik</label>
          <select className={inputClass} value={(data.manglik as string) || ""} onChange={(e) => update("manglik", e.target.value)}>
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="anshik">Anshik (Partial)</option>
            <option value="dont_know">Don&apos;t Know</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Languages Known</label>
          <input className={inputClass} value={((data.languages_known as string[]) || []).join(", ")} onChange={(e) => update("languages_known", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="Telugu, English, Hindi" />
        </div>
        <div>
          <label className={labelClass}>Marital Status *</label>
          <select className={inputClass} value={(data.marital_status as string) || ""} onChange={(e) => update("marital_status", e.target.value)}>
            <option value="">Select</option>
            <option value="never_married">Never Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Number of Children</label>
          <input className={inputClass} type="number" min={0} value={(data.children as number) || ""} onChange={(e) => update("children", Number(e.target.value))} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>Food Preference</label>
          <select className={inputClass} value={(data.food_preference as string) || ""} onChange={(e) => update("food_preference", e.target.value)}>
            <option value="">Select</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="non_vegetarian">Non-Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="eggetarian">Eggetarian</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Disability</label>
          <input className={inputClass} value={(data.disability as string) || ""} onChange={(e) => update("disability", e.target.value)} placeholder="None" />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Habits</label>
          <textarea className={inputClass} rows={2} value={(data.habits as string) || ""} onChange={(e) => update("habits", e.target.value)} placeholder="e.g. Non-smoker, occasional drinker, vegetarian diet..." />
        </div>
        <div>
          <label className={labelClass}>Nationality</label>
          <input className={inputClass} value={(data.nationality as string) || "Indian"} onChange={(e) => update("nationality", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function AddressSection({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const update = (key: string, val: unknown) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-6">
      <div className="border-b border-[#1a2540]/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1a2540]">Address Details</h2>
        <p className="text-xs font-light text-gray-500 mt-1">Residential locations and origins.</p>
      </div>
      <div className={sectionClass}>
        <div className="md:col-span-2">
          <label className={labelClass}>Current Address *</label>
          <textarea className={inputClass} rows={2} value={(data.current_address as string) || ""} onChange={(e) => update("current_address", e.target.value)} placeholder="Plot 12, Street Name, Area" />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Permanent Address *</label>
          <textarea className={inputClass} rows={2} value={(data.permanent_address as string) || ""} onChange={(e) => update("permanent_address", e.target.value)} placeholder="Same as current or different" />
        </div>
        <div><label className={labelClass}>Village</label><input className={inputClass} value={(data.village as string) || ""} onChange={(e) => update("village", e.target.value)} placeholder="Village name" /></div>
        <div><label className={labelClass}>Town</label><input className={inputClass} value={(data.town as string) || ""} onChange={(e) => update("town", e.target.value)} placeholder="Town name" /></div>
        <div><label className={labelClass}>District *</label><input className={inputClass} value={(data.district as string) || ""} onChange={(e) => update("district", e.target.value)} placeholder="Anantapur" /></div>
        <div><label className={labelClass}>State *</label><input className={inputClass} value={(data.state as string) || ""} onChange={(e) => update("state", e.target.value)} placeholder="Andhra Pradesh" /></div>
        <div><label className={labelClass}>Country *</label><input className={inputClass} value={(data.country as string) || "India"} onChange={(e) => update("country", e.target.value)} /></div>
        <div><label className={labelClass}>Pincode *</label><input className={inputClass} value={(data.pincode as string) || ""} onChange={(e) => update("pincode", e.target.value)} placeholder="515001" maxLength={6} /></div>
      </div>
    </div>
  );
}

function ContactSection({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const update = (key: string, val: unknown) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-6">
      <div className="border-b border-[#1a2540]/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1a2540]">Contact Details</h2>
        <p className="text-xs font-light text-gray-500 mt-1">Confidential communication methods.</p>
      </div>
      <div className={sectionClass}>
        <div><label className={labelClass}>Phone Number *</label><input className={inputClass} type="tel" value={(data.phone as string) || ""} onChange={(e) => update("phone", e.target.value)} placeholder="9876543210" /></div>
        <div><label className={labelClass}>Alternative Phone</label><input className={inputClass} type="tel" value={(data.alternative_phone as string) || ""} onChange={(e) => update("alternative_phone", e.target.value)} placeholder="Optional" /></div>
        <div><label className={labelClass}>Email Address *</label><input className={inputClass} type="email" value={(data.email as string) || ""} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" /></div>
        <div><label className={labelClass}>Emergency Contact</label><input className={inputClass} value={(data.emergency_contact as string) || ""} onChange={(e) => update("emergency_contact", e.target.value)} placeholder="Name & Phone" /></div>
      </div>
    </div>
  );
}

function ProfessionSection({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const update = (key: string, val: unknown) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-6">
      <div className="border-b border-[#1a2540]/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1a2540]">Profession Details</h2>
        <p className="text-xs font-light text-gray-500 mt-1">Career, occupation, and earnings.</p>
      </div>
      <div className={sectionClass}>
        <div><label className={labelClass}>Profession *</label><input className={inputClass} value={(data.profession as string) || ""} onChange={(e) => update("profession", e.target.value)} placeholder="Software Engineer" /></div>
        <div><label className={labelClass}>Designation</label><input className={inputClass} value={(data.designation as string) || ""} onChange={(e) => update("designation", e.target.value)} placeholder="Senior Developer" /></div>
        <div><label className={labelClass}>Company Name</label><input className={inputClass} value={(data.company_name as string) || ""} onChange={(e) => update("company_name", e.target.value)} /></div>
        <div><label className={labelClass}>Company Location</label><input className={inputClass} value={(data.company_location as string) || ""} onChange={(e) => update("company_location", e.target.value)} /></div>
        <div><label className={labelClass}>Work Country</label><input className={inputClass} value={(data.work_country as string) || ""} onChange={(e) => update("work_country", e.target.value)} /></div>
        <div>
          <label className={labelClass}>Annual Income</label>
          <IncomeInput value={data.annual_income as number} onChange={(v) => update("annual_income", v)} />
        </div>
        <div>
          <label className={labelClass}>Employment Type</label>
          <select className={inputClass} value={(data.employment_type as string) || ""} onChange={(e) => update("employment_type", e.target.value)}>
            <option value="">Select</option>
            <option value="salaried">Salaried</option>
            <option value="self_employed">Self-Employed</option>
            <option value="business">Business</option>
            <option value="government">Government</option>
            <option value="freelance">Freelance</option>
            <option value="not_working">Not Working</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Visa Status</label>
          <select className={inputClass} value={(data.visa_status as string) || ""} onChange={(e) => update("visa_status", e.target.value)}>
            <option value="">Select</option>
            <option value="citizen">Citizen</option>
            <option value="pr">Permanent Resident</option>
            <option value="work_permit">Work Permit</option>
            <option value="student">Student Visa</option>
            <option value="visit">Visit Visa</option>
            <option value="na">N/A</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Business Details</label>
          <textarea className={inputClass} rows={2} value={(data.business_details as string) || ""} onChange={(e) => update("business_details", e.target.value)} placeholder="Describe business if applicable" />
        </div>
      </div>
    </div>
  );
}

function EducationSection({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const update = (key: string, val: unknown) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-6">
      <div className="border-b border-[#1a2540]/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1a2540]">Educational Qualifications</h2>
        <p className="text-xs font-light text-gray-500 mt-1">Academic history and institutions.</p>
      </div>
      <div className={sectionClass}>
        <div><label className={labelClass}>10th Qualification</label><input className={inputClass} value={(data.qualification_10th as string) || ""} onChange={(e) => update("qualification_10th", e.target.value)} placeholder="SSC / 10th Grade board & school" /></div>
        <div><label className={labelClass}>12th Qualification</label><input className={inputClass} value={(data.qualification_12th as string) || ""} onChange={(e) => update("qualification_12th", e.target.value)} placeholder="Intermediate / 12th Grade board & college" /></div>
        <div><label className={labelClass}>Highest Qualification *</label><input className={inputClass} value={(data.highest_qualification as string) || ""} onChange={(e) => update("highest_qualification", e.target.value)} placeholder="B.Tech / MBA / MBBS" /></div>
        <div><label className={labelClass}>College / Institution</label><input className={inputClass} value={(data.college as string) || ""} onChange={(e) => update("college", e.target.value)} /></div>
        <div><label className={labelClass}>University / Board</label><input className={inputClass} value={(data.university as string) || ""} onChange={(e) => update("university", e.target.value)} /></div>
        <div><label className={labelClass}>Year Passed</label><input className={inputClass} type="number" value={(data.year_passed as number) || ""} onChange={(e) => update("year_passed", Number(e.target.value))} placeholder="2020" /></div>
        <div className="md:col-span-2">
          <label className={labelClass}>Additional Qualifications</label>
          <textarea className={inputClass} rows={2} value={(data.additional_qualifications as string) || ""} onChange={(e) => update("additional_qualifications", e.target.value)} placeholder="Certifications, diplomas, etc." />
        </div>
      </div>
    </div>
  );
}

/** e.g. "elder_brother", "younger_sister" — order + gender of the sibling relative to the candidate. */
type SiblingRelation = "elder_brother" | "younger_brother" | "elder_sister" | "younger_sister";

interface SiblingEntry {
  name?: string;
  relation?: SiblingRelation;
  marital_status?: string;
  occupation?: string;
  education?: string;
}

const SIBLING_RELATION_OPTIONS: { value: SiblingRelation; label: string }[] = [
  { value: "elder_brother", label: "Elder Brother" },
  { value: "younger_brother", label: "Younger Brother" },
  { value: "elder_sister", label: "Elder Sister" },
  { value: "younger_sister", label: "Younger Sister" },
];

const SIBLING_RELATION_LABELS: Record<SiblingRelation, string> = {
  elder_brother: "Elder Brother",
  younger_brother: "Younger Brother",
  elder_sister: "Elder Sister",
  younger_sister: "Younger Sister",
};

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Builds a display label like "1st Elder Brother" or "2nd Younger Sister"
 * for the sibling at `index`, based on how many siblings *before* it in the
 * list share the same relation. Siblings with no relation set yet just get
 * a plain "Sibling N" fallback so the card header never looks broken while
 * mid-edit.
 */
function siblingDisplayLabel(siblings: SiblingEntry[], index: number): string {
  const current = siblings[index];
  if (!current?.relation) return `Sibling ${index + 1}`;

  let countSoFar = 0;
  for (let i = 0; i <= index; i++) {
    if (siblings[i]?.relation === current.relation) countSoFar++;
  }

  return `${ordinal(countSoFar)} ${SIBLING_RELATION_LABELS[current.relation]}`;
}

function FamilySection({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const update = (key: string, val: unknown) => onChange({ ...data, [key]: val });
  const siblings = (data.siblings as SiblingEntry[]) || [];

  const addSibling = () => {
    update("siblings", [...siblings, { name: "", relation: undefined, marital_status: "", occupation: "", education: "" }]);
  };

  const updateSibling = (index: number, key: keyof SiblingEntry, val: string) => {
    const next = siblings.map((sib, i) => (i === index ? { ...sib, [key]: val || undefined } : sib));
    update("siblings", next);
  };

  const removeSibling = (index: number) => {
    update("siblings", siblings.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1a2540]/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1a2540]">Family Details</h2>
        <p className="text-xs font-light text-gray-500 mt-1">Parents and siblings.</p>
      </div>
      <div className={sectionClass}>
        <div><label className={labelClass}>Father&apos;s Name</label><input className={inputClass} value={(data.father_name as string) || ""} onChange={(e) => update("father_name", e.target.value)} /></div>
        <div><label className={labelClass}>Father&apos;s Profession</label><input className={inputClass} value={(data.father_profession as string) || ""} onChange={(e) => update("father_profession", e.target.value)} /></div>
        <div><label className={labelClass}>Mother&apos;s Name</label><input className={inputClass} value={(data.mother_name as string) || ""} onChange={(e) => update("mother_name", e.target.value)} /></div>
        <div><label className={labelClass}>Mother&apos;s Profession</label><input className={inputClass} value={(data.mother_profession as string) || ""} onChange={(e) => update("mother_profession", e.target.value)} /></div>
        <div><label className={labelClass}>Grandfather (Father&apos;s Side)</label><input className={inputClass} value={(data.grandfather_name_paternal as string) || ""} onChange={(e) => update("grandfather_name_paternal", e.target.value)} /></div>
        <div><label className={labelClass}>Grandmother (Father&apos;s Side)</label><input className={inputClass} value={(data.grandmother_name_paternal as string) || ""} onChange={(e) => update("grandmother_name_paternal", e.target.value)} /></div>
        <div><label className={labelClass}>Grandfather (Mother&apos;s Side)</label><input className={inputClass} value={(data.grandfather_name_maternal as string) || ""} onChange={(e) => update("grandfather_name_maternal", e.target.value)} /></div>
        <div><label className={labelClass}>Grandmother (Mother&apos;s Side)</label><input className={inputClass} value={(data.grandmother_name_maternal as string) || ""} onChange={(e) => update("grandmother_name_maternal", e.target.value)} /></div>
        <div><label className={labelClass}>Brothers</label><input className={inputClass} type="number" min={0} value={(data.brothers as number) ?? 0} onChange={(e) => update("brothers", Number(e.target.value))} /></div>
        <div><label className={labelClass}>Sisters</label><input className={inputClass} type="number" min={0} value={(data.sisters as number) ?? 0} onChange={(e) => update("sisters", Number(e.target.value))} /></div>
        <div><label className={labelClass}>Married Brothers</label><input className={inputClass} type="number" min={0} value={(data.married_brothers as number) ?? 0} onChange={(e) => update("married_brothers", Number(e.target.value))} /></div>
        <div><label className={labelClass}>Married Sisters</label><input className={inputClass} type="number" min={0} value={(data.married_sisters as number) ?? 0} onChange={(e) => update("married_sisters", Number(e.target.value))} /></div>
        <div className="md:col-span-2">
          <label className={labelClass}>Family Property</label>
          <textarea className={inputClass} rows={2} value={(data.family_property as string) || ""} onChange={(e) => update("family_property", e.target.value)} placeholder="Own house, agricultural land, etc." />
        </div>
      </div>

      {/* Sibling Profiles */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="font-serif text-base font-bold text-[#1a2540]">Sibling Profiles</h3>
            <p className="text-xs font-light text-gray-500 mt-0.5">Add individual details for each brother or sister.</p>
          </div>
          <button
            type="button"
            onClick={addSibling}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C8631C] border border-[#C8631C]/40 hover:bg-[#C8631C]/10 rounded-lg px-3 py-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Sibling
          </button>
        </div>

        {siblings.length === 0 ? (
          <p className="text-xs text-gray-400 font-light italic mt-3">No sibling profiles added yet.</p>
        ) : (
          <div className="space-y-4 mt-4">
            {siblings.map((sibling, index) => (
              <div key={index} className="relative border border-[#1a2540]/10 rounded-xl p-4 bg-[#1a2540]/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#1a2540]/60">{siblingDisplayLabel(siblings, index)}</span>
                  <button
                    type="button"
                    onClick={() => removeSibling(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove sibling"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className={sectionClass}>
                  <div>
                    <label className={labelClass}>Name</label>
                    <input
                      className={inputClass}
                      value={sibling.name || ""}
                      onChange={(e) => updateSibling(index, "name", e.target.value)}
                      placeholder="Sibling's full name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Relation</label>
                    <select
                      className={inputClass}
                      value={sibling.relation || ""}
                      onChange={(e) => updateSibling(index, "relation", e.target.value)}
                    >
                      <option value="">Select</option>
                      {SIBLING_RELATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Marital Status</label>
                    <select
                      className={inputClass}
                      value={sibling.marital_status || ""}
                      onChange={(e) => updateSibling(index, "marital_status", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="unmarried">Unmarried</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Occupation</label>
                    <input
                      className={inputClass}
                      value={sibling.occupation || ""}
                      onChange={(e) => updateSibling(index, "occupation", e.target.value)}
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Education</label>
                    <input
                      className={inputClass}
                      value={sibling.education || ""}
                      onChange={(e) => updateSibling(index, "education", e.target.value)}
                      placeholder="e.g. B.Tech, MBA"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PartnerSection({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const update = (key: string, val: unknown) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-6">
      <div className="border-b border-[#1a2540]/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1a2540]">Partner Preferences</h2>
        <p className="text-xs font-light text-gray-500 mt-1">Expectations and qualities sought in an eternal companion.</p>
      </div>
      <div className={sectionClass}>
        <div><label className={labelClass}>Minimum Age</label><input className={inputClass} type="number" value={(data.age_min as number) || ""} onChange={(e) => update("age_min", Number(e.target.value))} placeholder="22" /></div>
        <div><label className={labelClass}>Maximum Age</label><input className={inputClass} type="number" value={(data.age_max as number) || ""} onChange={(e) => update("age_max", Number(e.target.value))} placeholder="30" /></div>
        <div><label className={labelClass}>Min Height</label><HeightInput value={data.height_min_cm as number} onChange={(cm) => update("height_min_cm", cm)} /></div>
        <div><label className={labelClass}>Max Height</label><HeightInput value={data.height_max_cm as number} onChange={(cm) => update("height_max_cm", cm)} /></div>
        <div><label className={labelClass}>Education Preference</label><input className={inputClass} value={(data.education as string) || ""} onChange={(e) => update("education", e.target.value)} placeholder="Graduate and above" /></div>
        <div><label className={labelClass}>Profession Preference</label><input className={inputClass} value={(data.profession as string) || ""} onChange={(e) => update("profession", e.target.value)} placeholder="Any profession" /></div>
        <div><label className={labelClass}>Religion Preference</label><input className={inputClass} value={(data.religion as string) || ""} onChange={(e) => update("religion", e.target.value)} placeholder="Same religion preferred" /></div>
        <div><label className={labelClass}>Caste Preference</label><input className={inputClass} value={(data.caste as string) || ""} onChange={(e) => update("caste", e.target.value)} placeholder="Any caste considered" /></div>
        <div><label className={labelClass}>Location Preference</label><input className={inputClass} value={(data.location as string) || ""} onChange={(e) => update("location", e.target.value)} placeholder="Andhra Pradesh / Telangana" /></div>
        <div>
          <label className={labelClass}>Min Annual Income</label>
          <IncomeInput value={data.income_min as number} onChange={(v) => update("income_min", v)} placeholder="5" />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Other Preferences</label>
          <textarea className={inputClass} rows={3} value={(data.other_preferences as string) || ""} onChange={(e) => update("other_preferences", e.target.value)} placeholder="Any other specific preferences..." />
        </div>
      </div>
    </div>
  );
}

function MediaSection({ data, onChange, profileId }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void; profileId?: string }) {
  const images = data.images as Record<string, string | null> || {};
  const visibility = data.visibility as Record<string, boolean> || {};
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  const handlePickFile = (key: string) => {
    if (!profileId) {
      toast.error("Please click \"Save Draft\" first, then upload photos.");
      return;
    }
    fileInputRefs.current[key]?.click();
  };

  const handleFileChange = async (key: string, file: File | null) => {
    if (!file || !profileId) return;

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large (max 5MB).");
      return;
    }

    setUploadingKey(key);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("type", key);
      body.append("profile_id", profileId);

      const res = await fetch("/api/upload", { method: "POST", body });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Upload failed");
      }

      onChange({ images: { ...images, [key]: result.url } });
      toast.success("Photo uploaded!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#1a2540]/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1a2540]">Photos & Documents</h2>
        <p className="text-xs font-light text-gray-500 mt-1">Manage profile imagery and privacy permissions.</p>
      </div>

      {/* Photos */}
      <div>
        <h3 className="font-serif text-base font-bold text-[#1a2540] mb-3">Profile Photos (Max 3)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["profile_photo", "photo_2", "photo_3"].map((key, i) => (
            <div
              key={key}
              role="button"
              tabIndex={0}
              aria-label={
                key === "profile_photo"
                  ? "Upload primary profile photo"
                  : `Upload additional profile photo ${i + 1}`
              }
              onClick={() => handlePickFile(key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlePickFile(key);
                }
              }}
              className="aspect-[3/4] rounded-xl border-2 border-dashed border-[#1a2540]/20 hover:border-[#C8631C]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8631C]/60 focus-visible:ring-offset-2 transition-colors bg-[#1a2540]/5 flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden group"
            >
              <input
                ref={(el) => { fileInputRefs.current[key] = el; }}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  handleFileChange(key, e.target.files?.[0] || null);
                  e.target.value = "";
                }}
              />

              {uploadingKey === key ? (
                <Loader2 className="w-8 h-8 text-[#C8631C] animate-spin" />
              ) : images[key] ? (
                <>
                  <img
                    src={images[key]!}
                    alt={
                      key === "profile_photo"
                        ? "Primary profile photo"
                        : `Additional profile photo ${i + 1}`
                    }
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs font-semibold uppercase tracking-wider">Change Photo</span>
                  </div>
                </>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                  <p className="text-gray-500 font-medium text-xs text-center px-2">
                    {i === 0 ? "Profile Photo *" : `Photo ${i + 1}`}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
        <p className="text-gray-500 font-light text-xs mt-2.5">
          {profileId
            ? "Click a box to upload. Supported: JPG, PNG, WebP (max 5MB each)."
            : "Click \"Save Draft\" below first to enable photo uploads, then click a box to upload. Supported: JPG, PNG, WebP (max 5MB each)."}
        </p>
      </div>

      {/* Visibility Controls */}
      <div>
        <h3 className="font-serif text-base font-bold text-[#1a2540] mb-2">Profile Visibility Settings</h3>
        <p className="text-gray-500 text-xs font-light mb-4">Control what information is displayed publicly to members.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: "show_phone", label: "Show Phone" },
            { key: "show_email", label: "Show Email" },
            { key: "show_address", label: "Show Address" },
            { key: "show_family_details", label: "Show Family Details" },
            { key: "show_income", label: "Show Income" },
            { key: "show_documents", label: "Show Documents" },
          ].map((field) => (
            <label key={field.key} className="flex items-center gap-3 p-3.5 rounded-xl border border-[#1a2540]/15 cursor-pointer hover:border-[#C8631C]/40 hover:bg-[#C8631C]/5 transition-all">
              <input
                type="checkbox"
                checked={!!visibility[field.key]}
                onChange={(e) => onChange({ ...data, visibility: { ...visibility, [field.key]: e.target.checked } })}
                className="rounded border-gray-300 text-[#C8631C] focus:ring-[#C8631C] w-4 h-4"
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1a2540]">{field.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}