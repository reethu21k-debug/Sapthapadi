"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, MapPin, Phone, Briefcase, GraduationCap,
  Users, Heart, Image as ImageIcon, FileText, ChevronRight, ChevronLeft, Save, Loader2, Sparkles, Check, FileDown, Home, Plus, Trash2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";

const SECTIONS = [
  { id: "personal", label: "Personal", icon: User },
  { id: "address", label: "Address", icon: MapPin },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "profession", label: "Profession", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "family", label: "Family", icon: Users },
  { id: "property", label: "Property", icon: Home },
  { id: "partner", label: "Partner Prefs", icon: Heart },
  { id: "media", label: "Photos & Docs", icon: ImageIcon },
  { id: "about", label: "About Me", icon: FileText },
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
    property: profile?.property || {},
    partner_preferences: profile?.partner_preferences || {},
    about_me: profile?.about_me || "",
    visibility: profile?.visibility || {
      show_phone: false, show_email: false, show_address: false,
      show_family_details: false, show_income: false, show_documents: false,
    },
  });

  const updateSection = (section: string, data: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, [section]: data }));
  };

  const defaultRedirect = actor === "admin" ? "/admin/profiles" : "/user/biodata";

  const handleSave = async (isDraft = false) => {
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
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="bg-[#fffdf9] border border-[#1a2540]/10 rounded-2xl p-6 sm:p-8 shadow-[0_12px_40px_-12px_rgba(26,37,64,0.1)]">
              {activeSection === 0 && <PersonalSection data={formData.personal as Record<string, unknown>} onChange={(d) => updateSection("personal", d)} />}
              {activeSection === 1 && <AddressSection data={formData.address as Record<string, unknown>} onChange={(d) => updateSection("address", d)} />}
              {activeSection === 2 && <ContactSection data={formData.contact as Record<string, unknown>} onChange={(d) => updateSection("contact", d)} />}
              {activeSection === 3 && <ProfessionSection data={formData.profession as Record<string, unknown>} onChange={(d) => updateSection("profession", d)} />}
              {activeSection === 4 && <EducationSection data={formData.education as Record<string, unknown>} onChange={(d) => updateSection("education", d)} />}
              {activeSection === 5 && <FamilySection data={formData.family as Record<string, unknown>} onChange={(d) => updateSection("family", d)} />}
              {activeSection === 6 && <PropertySection data={formData.property as Record<string, unknown>} onChange={(d) => updateSection("property", d)} />}
              {activeSection === 7 && <PartnerSection data={formData.partner_preferences as Record<string, unknown>} onChange={(d) => updateSection("partner_preferences", d)} />}
              {activeSection === 8 && <MediaSection data={formData as Record<string, unknown>} onChange={(d) => setFormData(prev => ({ ...prev, ...d }))} profileId={createdId} />}
              {activeSection === 9 && <AboutSection data={formData.about_me as string} onChange={(v) => setFormData(prev => ({ ...prev, about_me: v }))} />}
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
                disabled={isSaving}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] text-[#1a2540] hover:opacity-95 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all duration-200"
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
  const fields = ["first_name", "last_name", "gender", "date_of_birth", "religion", "caste", "mother_tongue", "marital_status"];
  const filled = fields.filter((f) => personal[f]).length;
  return Math.round((filled / fields.length) * 100);
}

// ─── Section Components ───────────────────────────────────────

function PersonalSection({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const update = (key: string, val: unknown) => onChange({ ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1a2540]/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1a2540]">Personal Details</h2>
        <p className="text-xs font-light text-gray-500 mt-1">Basic identification and ceremonial attributes.</p>
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
          <input className={inputClass} type="time" value={(data.time_of_birth as string) || ""} onChange={(e) => update("time_of_birth", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Height (cm) *</label>
          <input className={inputClass} type="number" value={(data.height_cm as number) || ""} onChange={(e) => update("height_cm", Number(e.target.value))} placeholder="165" />
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
          <label className={labelClass}>Mother Tongue *</label>
          <input className={inputClass} value={(data.mother_tongue as string) || ""} onChange={(e) => update("mother_tongue", e.target.value)} placeholder="Telugu" />
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
          <label className={labelClass}>Annual Income (₹)</label>
          <input className={inputClass} type="number" value={(data.annual_income as number) || ""} onChange={(e) => update("annual_income", Number(e.target.value))} placeholder="800000" />
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

interface SiblingEntry {
  name?: string;
  marital_status?: string;
  occupation?: string;
  education?: string;
}

function FamilySection({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const update = (key: string, val: unknown) => onChange({ ...data, [key]: val });
  const siblings = (data.siblings as SiblingEntry[]) || [];

  const addSibling = () => {
    update("siblings", [...siblings, { name: "", marital_status: "", occupation: "", education: "" }]);
  };

  const updateSibling = (index: number, key: keyof SiblingEntry, val: string) => {
    const next = siblings.map((sib, i) => (i === index ? { ...sib, [key]: val } : sib));
    update("siblings", next);
  };

  const removeSibling = (index: number) => {
    update("siblings", siblings.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1a2540]/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1a2540]">Family Details</h2>
        <p className="text-xs font-light text-gray-500 mt-1">Parents, siblings, and family values.</p>
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
        <div>
          <label className={labelClass}>Family Type</label>
          <select className={inputClass} value={(data.family_type as string) || ""} onChange={(e) => update("family_type", e.target.value)}>
            <option value="">Select</option>
            <option value="joint">Joint Family</option>
            <option value="nuclear">Nuclear Family</option>
          </select>
        </div>
        <div><label className={labelClass}>Family Status</label><input className={inputClass} value={(data.family_status as string) || ""} onChange={(e) => update("family_status", e.target.value)} placeholder="Middle Class / Upper Middle Class" /></div>
        <div><label className={labelClass}>Family Values</label><input className={inputClass} value={(data.family_values as string) || ""} onChange={(e) => update("family_values", e.target.value)} placeholder="Traditional / Modern" /></div>
        <div><label className={labelClass}>Native Place</label><input className={inputClass} value={(data.native_place as string) || ""} onChange={(e) => update("native_place", e.target.value)} /></div>
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
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#1a2540]/60">Sibling {index + 1}</span>
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

function PropertySection({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const update = (key: string, val: unknown) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-6">
      <div className="border-b border-[#1a2540]/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1a2540]">Property Details</h2>
        <p className="text-xs font-light text-gray-500 mt-1">Personally owned assets and real estate.</p>
      </div>
      <div className={sectionClass}>
        <div className="flex items-center gap-2.5 md:col-span-2 pb-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={!!(data.owns_property)} onChange={(e) => update("owns_property", e.target.checked)} className="rounded border-gray-300 text-[#C8631C] focus:ring-[#C8631C] w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">Owns Property</span>
          </label>
        </div>
        <div>
          <label className={labelClass}>Property Type</label>
          <input className={inputClass} value={(data.property_type as string) || ""} onChange={(e) => update("property_type", e.target.value)} placeholder="House / Apartment / Agricultural Land / Plot" />
        </div>
        <div>
          <label className={labelClass}>Property Location</label>
          <input className={inputClass} value={(data.property_location as string) || ""} onChange={(e) => update("property_location", e.target.value)} placeholder="City, State" />
        </div>
        <div>
          <label className={labelClass}>Estimated Value (₹)</label>
          <input className={inputClass} type="number" value={(data.property_value as number) || ""} onChange={(e) => update("property_value", Number(e.target.value))} placeholder="5000000" />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Property Description</label>
          <textarea className={inputClass} rows={3} value={(data.property_description as string) || ""} onChange={(e) => update("property_description", e.target.value)} placeholder="Describe any additional property details..." />
        </div>
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
        <div><label className={labelClass}>Min Height (cm)</label><input className={inputClass} type="number" value={(data.height_min_cm as number) || ""} onChange={(e) => update("height_min_cm", Number(e.target.value))} placeholder="155" /></div>
        <div><label className={labelClass}>Max Height (cm)</label><input className={inputClass} type="number" value={(data.height_max_cm as number) || ""} onChange={(e) => update("height_max_cm", Number(e.target.value))} placeholder="185" /></div>
        <div><label className={labelClass}>Education Preference</label><input className={inputClass} value={(data.education as string) || ""} onChange={(e) => update("education", e.target.value)} placeholder="Graduate and above" /></div>
        <div><label className={labelClass}>Profession Preference</label><input className={inputClass} value={(data.profession as string) || ""} onChange={(e) => update("profession", e.target.value)} placeholder="Any profession" /></div>
        <div><label className={labelClass}>Religion Preference</label><input className={inputClass} value={(data.religion as string) || ""} onChange={(e) => update("religion", e.target.value)} placeholder="Same religion preferred" /></div>
        <div><label className={labelClass}>Caste Preference</label><input className={inputClass} value={(data.caste as string) || ""} onChange={(e) => update("caste", e.target.value)} placeholder="Any caste considered" /></div>
        <div><label className={labelClass}>Location Preference</label><input className={inputClass} value={(data.location as string) || ""} onChange={(e) => update("location", e.target.value)} placeholder="Andhra Pradesh / Telangana" /></div>
        <div><label className={labelClass}>Min Annual Income (₹)</label><input className={inputClass} type="number" value={(data.income_min as number) || ""} onChange={(e) => update("income_min", Number(e.target.value))} placeholder="500000" /></div>
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

function AboutSection({ data, onChange }: { data: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#1a2540]/10 pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#1a2540]">About Me</h2>
        <p className="text-xs font-light text-gray-500 mt-1">Personal narrative and lifestyle aspirations.</p>
      </div>
      <div>
        <label className={labelClass}>Write about yourself, your personality, hobbies, and what you&apos;re looking for</label>
        <textarea
          className={inputClass}
          rows={12}
          value={data}
          onChange={(e) => onChange(e.target.value)}
          placeholder="I am a simple, caring person who values family and traditions. I enjoy reading, traveling, and cooking. I am looking for a life partner who shares similar values..."
        />
        <p className="text-gray-500 font-light text-xs mt-2 text-right">{data.length} characters</p>
      </div>
    </div>
  );
}