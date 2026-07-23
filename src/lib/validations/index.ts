import { z } from "zod";

// ─── Auth Schemas ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/(?=.*[0-9])/, "Must contain at least one number")
    .regex(/(?=.*[A-Z])/, "Must contain at least one uppercase letter"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

// ─── Profile Schemas ──────────────────────────────────────────

// Accepts "hh:mm AM/PM", e.g. "02:30 PM"
const timeOfBirth12hRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;

export const personalDetailsSchema = z.object({
  first_name: z.string().min(2, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female"]),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  place_of_birth: z.string().optional(),
  time_of_birth: z.string().regex(timeOfBirth12hRegex, "Use 12-hour format, e.g. 02:30 PM").optional().or(z.literal("")),
  height_cm: z.number().min(100, "Height must be at least 100cm").max(250, "Height seems too tall"),
  weight_kg: z.number().min(30).max(300).optional(),
  blood_group: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  complexion: z.string().optional(),
  religion: z.string().min(1, "Religion is required"),
  caste: z.string().min(1, "Caste is required"),
  sub_caste: z.string().optional(),
  gothram: z.string().optional(),
  nakshatram: z.string().optional(),
  rashi: z.string().optional(),
  manglik: z.enum(["yes", "no", "anshik", "dont_know"]).optional(),
  languages_known: z.array(z.string()).default([]),
  marital_status: z.enum(["never_married", "divorced", "widowed"]),
  children: z.number().min(0).optional(),
  disability: z.string().optional(),
  habits: z.string().optional(),
  food_preference: z.enum(["vegetarian", "non_vegetarian", "vegan", "eggetarian"]),
  nationality: z.string().default("Indian"),
});

export const addressSchema = z.object({
  current_address: z.string().min(5, "Current address is required"),
  permanent_address: z.string().min(5, "Permanent address is required"),
  village: z.string().optional(),
  town: z.string().optional(),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().default("India"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

export const contactSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  alternative_phone: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email"),
  emergency_contact: z.string().optional(),
});

export const professionSchema = z.object({
  profession: z.string().min(1, "Profession is required"),
  designation: z.string().optional(),
  company_name: z.string().optional(),
  company_location: z.string().optional(),
  work_country: z.string().optional(),
  // Absolute INR value, derived from the LPA/CR entry widget — see incomeToAbsolute() in lib/utils.
  annual_income: z.number().min(0).optional(),
  income_currency: z.string().default("INR"),
  employment_type: z.enum(["salaried", "self_employed", "business", "government", "freelance", "not_working"]).optional(),
  business_details: z.string().optional(),
  visa_status: z.enum(["citizen", "pr", "work_permit", "student", "visit", "na"]).optional(),
});

export const educationSchema = z.object({
  qualification_10th: z.string().optional(),
  qualification_12th: z.string().optional(),
  highest_qualification: z.string().min(1, "Qualification is required"),
  college: z.string().optional(),
  university: z.string().optional(),
  year_passed: z.number().min(1970).max(new Date().getFullYear()).optional(),
  additional_qualifications: z.string().optional(),
});

export const siblingSchema = z.object({
  name: z.string().optional(),
  marital_status: z.enum(["unmarried", "married", "divorced", "widowed"]).optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
});

export const familySchema = z.object({
  father_name: z.string().optional(),
  father_profession: z.string().optional(),
  mother_name: z.string().optional(),
  mother_profession: z.string().optional(),
  grandfather_name_paternal: z.string().optional(),
  grandmother_name_paternal: z.string().optional(),
  grandfather_name_maternal: z.string().optional(),
  grandmother_name_maternal: z.string().optional(),
  brothers: z.number().min(0).default(0),
  sisters: z.number().min(0).default(0),
  married_brothers: z.number().min(0).default(0),
  married_sisters: z.number().min(0).default(0),
  siblings: z.array(siblingSchema).optional(),
  family_property: z.string().optional(),
});

export const propertyDetailsSchema = z.object({
  owns_property: z.boolean().default(false),
  property_type: z.string().optional(),
  property_location: z.string().optional(),
  property_value: z.number().min(0).optional(),
  property_description: z.string().optional(),
});

export const partnerPreferencesSchema = z.object({
  age_min: z.number().min(18).max(80).optional(),
  age_max: z.number().min(18).max(80).optional(),
  height_min_cm: z.number().min(100).max(250).optional(),
  height_max_cm: z.number().min(100).max(250).optional(),
  education: z.string().optional(),
  profession: z.string().optional(),
  location: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  marital_status: z.array(z.enum(["never_married", "divorced", "widowed"])).optional(),
  income_min: z.number().min(0).optional(),
  other_preferences: z.string().optional(),
});

export const visibilitySchema = z.object({
  show_phone: z.boolean().default(false),
  show_email: z.boolean().default(false),
  show_address: z.boolean().default(false),
  show_family_details: z.boolean().default(false),
  show_income: z.boolean().default(false),
  show_documents: z.boolean().default(false),
});

// ─── Subscription Schema ──────────────────────────────────────

export const subscriptionSchema = z.object({
  user_id: z.string().uuid("Invalid user"),
  profile_id: z.string().uuid().optional(),
  plan: z.enum(["free", "six_months", "one_year", "premium", "vip"]),
  plan_config_id: z.string().uuid("Select a plan"),
  start_date: z.string().min(1, "Start date is required"),
  expiry_date: z.string().min(1, "Expiry date is required"),
  payment_mode: z.enum(["cash", "upi", "card", "bank_transfer"]),
  amount_paid: z.number().min(0),
  payment_reference: z.string().optional(),
  notes: z.string().optional(),
});

/** Simplified schema for the "Assign Plan" quick-action in the admin Users list. */
export const assignSubscriptionSchema = z.object({
  user_id: z.string().uuid("Select a user"),
  plan_config_id: z.string().uuid("Select a plan"),
  payment_mode: z.enum(["cash", "upi", "card", "bank_transfer"]).default("cash"),
  amount_paid: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// ─── Plan Schema ──────────────────────────────────────────────

export const planSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  plan: z.enum(["free", "six_months", "one_year", "premium", "vip"]),
  duration_days: z.number().min(0),
  price: z.number().min(0),
  currency: z.string().default("INR"),
  profile_view_limit: z.number().min(1).nullable(),
  features: z.array(z.string()),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
});

// ─── Profile Access Schema ────────────────────────────────────

export const profileAccessSchema = z.object({
  granted_to_user_id: z.string().uuid("Select a user"),
  profile_ids: z.array(z.string().uuid()).min(1, "Select at least one profile"),
  expires_at: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Filter Schema ────────────────────────────────────────────

export const profileFilterSchema = z.object({
  gender: z.enum(["male", "female"]).optional(),
  age_min: z.number().optional(),
  age_max: z.number().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  sub_caste: z.string().optional(),
  profession: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  marital_status: z.enum(["never_married", "divorced", "widowed"]).optional(),
  subscription: z.enum(["paid", "free", "expired", "expiring_soon"]).optional(),
  status: z.enum(["pending", "approved", "rejected", "deactivated", "suspended"]).optional(),
  search: z.string().optional(),
});

// ─── Duplicate Candidate Check Schema ──────────────────────────

export const duplicateCheckSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  date_of_birth: z.string().min(1),
  exclude_id: z.string().uuid().optional(),
});

// ─── Settings Schema ──────────────────────────────────────────

export const siteSettingsSchema = z.object({
  site_name: z.string().min(1, "Site name is required"),
  site_tagline: z.string().min(1, "Tagline is required"),
  contact_email: z.string().email("Enter a valid email"),
  contact_phone: z.string().min(10, "Enter a valid phone"),
  contact_address: z.string().min(5, "Address is required"),
  banner_title: z.string().optional(),
  banner_subtitle: z.string().optional(),
  social_links: z.object({
    facebook: z.string().url().optional().or(z.literal("")),
    instagram: z.string().url().optional().or(z.literal("")),
    twitter: z.string().url().optional().or(z.literal("")),
    youtube: z.string().url().optional().or(z.literal("")),
    whatsapp: z.string().optional(),
  }).optional(),
});

// ─── Types ────────────────────────────────────────────────────

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type ProfessionFormData = z.infer<typeof professionSchema>;
export type EducationFormData = z.infer<typeof educationSchema>;
export type FamilyFormData = z.infer<typeof familySchema>;
export type PropertyDetailsFormData = z.infer<typeof propertyDetailsSchema>;
export type PartnerPreferencesFormData = z.infer<typeof partnerPreferencesSchema>;
export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;
export type AssignSubscriptionFormData = z.infer<typeof assignSubscriptionSchema>;
export type ProfileAccessFormData = z.infer<typeof profileAccessSchema>;
export type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;
export type DuplicateCheckFormData = z.infer<typeof duplicateCheckSchema>;