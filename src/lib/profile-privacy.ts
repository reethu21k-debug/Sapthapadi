// ============================================================
// SAPTAPADI — Profile Sharing Privacy Controls
// ============================================================
// Canonical registry of every section/field on a Profile that an
// admin can choose to include or exclude when sharing that profile
// with a member. Used to:
//   1. Render the section/field checkboxes in SharedProfilesManager.
//   2. Filter the actual profile object before it's ever sent to the
//      recipient's page (server-side) or baked into a biodata PDF.
//
// IMPORTANT: filtering happens server-side (see user/profiles/[id]/page.tsx
// and api/biodata/[id]/route.ts) so a restricted field is never present in
// the response — this is real privacy control, not client-side hiding.

export interface FieldDef {
  key: string;
  label: string;
}

export interface SectionDef {
  key: string;
  label: string;
  /** true if this section is a plain top-level value rather than a JSONB object */
  scalar?: boolean;
  fields: FieldDef[];
}

export const PROFILE_SECTIONS: SectionDef[] = [
  {
    key: "personal",
    label: "Personal Details",
    fields: [
      { key: "first_name", label: "First Name" },
      { key: "middle_name", label: "Middle Name" },
      { key: "last_name", label: "Last Name" },
      { key: "gender", label: "Gender" },
      { key: "date_of_birth", label: "Date of Birth / Age" },
      { key: "place_of_birth", label: "Place of Birth" },
      { key: "time_of_birth", label: "Time of Birth" },
      { key: "height_cm", label: "Height" },
      { key: "weight_kg", label: "Weight" },
      { key: "blood_group", label: "Blood Group" },
      { key: "complexion", label: "Complexion" },
      { key: "religion", label: "Religion" },
      { key: "caste", label: "Caste" },
      { key: "sub_caste", label: "Sub-caste" },
      { key: "gothram", label: "Gothram" },
      { key: "nakshatram", label: "Nakshatram" },
      { key: "rashi", label: "Rashi" },
      { key: "manglik", label: "Manglik" },
      { key: "mother_tongue", label: "Mother Tongue" },
      { key: "languages_known", label: "Languages Known" },
      { key: "marital_status", label: "Marital Status" },
      { key: "children", label: "Children" },
      { key: "disability", label: "Disability" },
      { key: "habits", label: "Habits" },
      { key: "food_preference", label: "Food Preference" },
      { key: "nationality", label: "Nationality" },
    ],
  },
  {
    key: "contact",
    label: "Contact Details",
    fields: [
      { key: "phone", label: "Phone Number" },
      { key: "alternative_phone", label: "Alternative Phone" },
      { key: "email", label: "Email Address" },
      { key: "emergency_contact", label: "Emergency Contact" },
    ],
  },
  {
    key: "address",
    label: "Address",
    fields: [
      { key: "current_address", label: "Current Address" },
      { key: "permanent_address", label: "Permanent Address" },
      { key: "village", label: "Village" },
      { key: "town", label: "Town" },
      { key: "district", label: "District" },
      { key: "state", label: "State" },
      { key: "country", label: "Country" },
      { key: "pincode", label: "Pincode" },
    ],
  },
  {
    key: "profession",
    label: "Profession",
    fields: [
      { key: "profession", label: "Profession" },
      { key: "designation", label: "Designation" },
      { key: "company_name", label: "Company Name" },
      { key: "company_location", label: "Company Location" },
      { key: "work_country", label: "Work Country" },
      { key: "annual_income", label: "Annual Income" },
      { key: "employment_type", label: "Employment Type" },
      { key: "business_details", label: "Business Details" },
      { key: "visa_status", label: "Visa Status" },
    ],
  },
  {
    key: "education",
    label: "Education",
    fields: [
      { key: "qualification_10th", label: "10th Qualification" },
      { key: "qualification_12th", label: "12th Qualification" },
      { key: "highest_qualification", label: "Highest Qualification" },
      { key: "college", label: "College" },
      { key: "university", label: "University" },
      { key: "year_passed", label: "Year Passed" },
      { key: "additional_qualifications", label: "Additional Qualifications" },
    ],
  },
  {
    key: "family",
    label: "Family Details",
    fields: [
      { key: "father_name", label: "Father's Name" },
      { key: "father_profession", label: "Father's Profession" },
      { key: "mother_name", label: "Mother's Name" },
      { key: "mother_profession", label: "Mother's Profession" },
      { key: "grandfather_name_paternal", label: "Grandfather (Paternal)" },
      { key: "grandmother_name_paternal", label: "Grandmother (Paternal)" },
      { key: "grandfather_name_maternal", label: "Grandfather (Maternal)" },
      { key: "grandmother_name_maternal", label: "Grandmother (Maternal)" },
      { key: "brothers", label: "Brothers" },
      { key: "sisters", label: "Sisters" },
      { key: "family_type", label: "Family Type" },
      { key: "family_status", label: "Family Status" },
      { key: "family_values", label: "Family Values" },
      { key: "family_property", label: "Family Property" },
      { key: "native_place", label: "Native Place" },
    ],
  },
  {
    key: "property",
    label: "Property Details",
    fields: [
      { key: "owns_property", label: "Owns Property" },
      { key: "property_type", label: "Property Type" },
      { key: "property_location", label: "Property Location" },
      { key: "property_value", label: "Property Value" },
      { key: "property_description", label: "Property Description" },
    ],
  },
  {
    key: "partner_preferences",
    label: "Partner Preferences",
    fields: [
      { key: "age_min", label: "Age Range" },
      { key: "height_min_cm", label: "Height Range" },
      { key: "education", label: "Education Preference" },
      { key: "profession", label: "Profession Preference" },
      { key: "location", label: "Location Preference" },
      { key: "religion", label: "Religion Preference" },
      { key: "caste", label: "Caste Preference" },
      { key: "income_min", label: "Minimum Income" },
      { key: "other_preferences", label: "Other Preferences" },
    ],
  },
  {
    key: "about_me",
    label: "About Me",
    scalar: true,
    fields: [{ key: "about_me", label: "About Me" }],
  },
  {
    key: "images",
    label: "Photos",
    fields: [
      { key: "profile_photo", label: "Main Profile Photo" },
      { key: "photo_2", label: "Photo 2" },
      { key: "photo_3", label: "Photo 3" },
    ],
  },
  {
    key: "documents",
    label: "Documents",
    fields: [
      { key: "horoscope_pdf", label: "Horoscope" },
      { key: "biodata_pdf", label: "Generated Biodata PDF" },
      { key: "additional_docs", label: "Additional Documents" },
    ],
  },
];

/** section.key -> field.key -> visible (true = shown to the recipient) */
export type VisibleFieldsMap = Record<string, Record<string, boolean>>;

/** Everything visible — the default when an admin hasn't restricted anything. */
export function defaultVisibleFields(): VisibleFieldsMap {
  const map: VisibleFieldsMap = {};
  for (const section of PROFILE_SECTIONS) {
    map[section.key] = {};
    for (const field of section.fields) {
      map[section.key][field.key] = true;
    }
  }
  return map;
}

/** True if a given field is visible under a (possibly partial / null) visibility map. */
export function isFieldVisible(
  visibleFields: VisibleFieldsMap | null | undefined,
  sectionKey: string,
  fieldKey: string
): boolean {
  // No map at all = legacy access grant made before this feature existed,
  // or an admin viewing their own dashboard — default to fully visible.
  if (!visibleFields) return true;
  const section = visibleFields[sectionKey];
  if (!section) return true;
  if (!(fieldKey in section)) return true;
  return !!section[fieldKey];
}

/** True if every field within a section is hidden. */
export function isSectionFullyHidden(
  visibleFields: VisibleFieldsMap | null | undefined,
  sectionKey: string
): boolean {
  if (!visibleFields) return false;
  const def = PROFILE_SECTIONS.find((s) => s.key === sectionKey);
  if (!def) return false;
  return def.fields.every((f) => !isFieldVisible(visibleFields, sectionKey, f.key));
}

/**
 * Returns a deep copy of the profile with every field the admin excluded
 * stripped out (set to null/undefined). Safe to call with visibleFields
 * of null/undefined — returns the profile unchanged in that case.
 */
export function filterProfileByVisibility<T extends Record<string, unknown>>(
  profile: T,
  visibleFields: VisibleFieldsMap | null | undefined
): T {
  if (!visibleFields) return profile;

  const filtered: Record<string, unknown> = { ...profile };

  for (const section of PROFILE_SECTIONS) {
    if (section.scalar) {
      if (!isFieldVisible(visibleFields, section.key, section.key)) {
        filtered[section.key] = null;
      }
      continue;
    }

    const original = profile[section.key] as Record<string, unknown> | null | undefined;
    if (!original || typeof original !== "object") continue;

    const copy: Record<string, unknown> = { ...original };
    for (const field of section.fields) {
      if (!isFieldVisible(visibleFields, section.key, field.key)) {
        delete copy[field.key];
      }
    }
    filtered[section.key] = copy;
  }

  return filtered as T;
}