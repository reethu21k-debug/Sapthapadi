// ============================================================
// SAPTAPADI — Complete Type Definitions
// ============================================================

// ─── Enums ──────────────────────────────────────────────────

export type Gender = "male" | "female";
export type MaritalStatus = "never_married" | "divorced" | "widowed";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type Manglik = "yes" | "no" | "anshik" | "dont_know";
export type FamilyType = "joint" | "nuclear";
export type FoodPreference = "vegetarian" | "non_vegetarian" | "vegan" | "eggetarian";
export type EmploymentType = "salaried" | "self_employed" | "business" | "government" | "freelance" | "not_working";
export type VisaStatus = "citizen" | "pr" | "work_permit" | "student" | "visit" | "na";
export type ProfileStatus = "pending" | "approved" | "rejected" | "deactivated" | "suspended";
export type SubscriptionPlan = "free" | "six_months" | "one_year" | "premium" | "vip";
export type SubscriptionStatus = "active" | "pending" | "expired" | "cancelled";
export type PaymentMode = "cash" | "upi" | "card" | "bank_transfer";
export type UserRole = "admin" | "user";
export type MatchMeetingStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";

// ─── Profile ─────────────────────────────────────────────────

export interface PersonalDetails {
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: Gender;
  date_of_birth: string; // ISO date string
  place_of_birth?: string;
  time_of_birth?: string; // e.g. "14:30" or "02:30 PM"
  age?: number; // computed
  height_cm: number;
  weight_kg?: number;
  blood_group?: BloodGroup;
  complexion?: string;
  religion: string;
  caste: string;
  sub_caste?: string;
  gothram?: string;
  nakshatram?: string;
  rashi?: string;
  manglik?: Manglik;
  mother_tongue: string;
  languages_known: string[];
  marital_status: MaritalStatus;
  children?: number;
  disability?: string;
  habits?: string; // free-text habits entry (replaces prior smoking/drinking booleans)
  food_preference: FoodPreference;
  nationality: string;
}

export interface AddressDetails {
  current_address: string;
  permanent_address: string;
  village?: string;
  town?: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
}

export interface ContactDetails {
  phone: string;
  alternative_phone?: string;
  email: string;
  emergency_contact?: string;
}

export interface ProfessionDetails {
  profession: string;
  designation?: string;
  company_name?: string;
  company_location?: string;
  work_country?: string;
  annual_income?: number;
  income_currency?: string;
  employment_type?: EmploymentType;
  business_details?: string;
  visa_status?: VisaStatus;
}

export interface EducationDetails {
  qualification_10th?: string;
  qualification_12th?: string;
  highest_qualification: string;
  college?: string;
  university?: string;
  year_passed?: number;
  additional_qualifications?: string;
}

export type SiblingMaritalStatus = "unmarried" | "married" | "divorced" | "widowed";

export interface SiblingDetail {
  name?: string;
  marital_status?: SiblingMaritalStatus;
  occupation?: string;
  education?: string;
}

export interface FamilyDetails {
  father_name?: string;
  father_profession?: string;
  mother_name?: string;
  mother_profession?: string;
  grandfather_name_paternal?: string;
  grandmother_name_paternal?: string;
  grandfather_name_maternal?: string;
  grandmother_name_maternal?: string;
  brothers: number;
  sisters: number;
  married_brothers: number;
  married_sisters: number;
  siblings?: SiblingDetail[];
  family_type?: FamilyType;
  family_status?: string;
  family_values?: string;
  family_property?: string;
  native_place?: string;
}

export interface PropertyDetails {
  owns_property?: boolean;
  property_type?: string; // e.g. "House", "Apartment", "Agricultural Land", "Plot"
  property_location?: string;
  property_value?: number;
  property_description?: string;
}

export interface PartnerPreferences {
  age_min?: number;
  age_max?: number;
  height_min_cm?: number;
  height_max_cm?: number;
  education?: string;
  profession?: string;
  location?: string;
  religion?: string;
  caste?: string;
  marital_status?: MaritalStatus[];
  income_min?: number;
  other_preferences?: string;
}

export interface ProfileImages {
  profile_photo?: string;    // Cloudinary URL - main profile pic
  photo_2?: string;          // Cloudinary URL
  photo_3?: string;          // Cloudinary URL
}

export interface ProfileDocuments {
  horoscope_pdf?: string;     // Cloudinary URL
  biodata_pdf?: string;       // Cloudinary URL (generated)
  additional_docs?: string[]; // Cloudinary URLs
}

/**
 * Admin-only document record. Lives in a separate `profile_admin_documents`
 * table (not on `profiles`) so it can never be read by the profile owner —
 * see migration 0005_sa_form_admin_document.sql for why.
 */
export interface ProfileAdminDocuments {
  id: string;
  profile_id: string;
  sa_form_url?: string | null;
  sa_form_public_id?: string | null;
  sa_form_format?: string | null;
  sa_form_uploaded_at?: string | null;
  sa_form_uploaded_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisibilitySettings {
  show_phone: boolean;
  show_email: boolean;
  show_address: boolean;
  show_family_details: boolean;
  show_income: boolean;
  show_documents: boolean;
}

export interface Profile {
  id: string;
  profile_id: string; // Auto-generated e.g., SPT-2024-00001
  user_id?: string;   // linked Supabase auth user (null for admin-created)

  // Details (stored as JSONB in DB)
  personal: PersonalDetails;
  address: AddressDetails;
  contact: ContactDetails;
  profession: ProfessionDetails;
  education: EducationDetails;
  family: FamilyDetails;
  property: PropertyDetails;
  partner_preferences: PartnerPreferences;
  about_me?: string;

  images: ProfileImages;
  documents: ProfileDocuments;
  visibility: VisibilitySettings;

  status: ProfileStatus;
  is_verified: boolean;
  profile_completion: number; // 0-100

  created_at: string;
  updated_at: string;
  created_by?: string; // admin user id
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;

  // Verification ("blue check") trust badge — separate from approval.
  // Set when an admin verifies the profile (or automatically when an
  // admin creates the profile themselves).
  verified_by?: string;
  verified_at?: string;
}

// ─── User ─────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  profile_id?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// ─── Subscription ─────────────────────────────────────────────

export interface SubscriptionPlanConfig {
  id: string;
  name: string;
  plan: SubscriptionPlan;
  duration_days: number;
  price: number;
  currency: string;
  profile_view_limit: number | null; // null = unlimited
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  profile_id?: string;
  plan: SubscriptionPlan;
  plan_config_id: string;
  status: SubscriptionStatus;
  start_date: string;
  expiry_date: string;
  remaining_days?: number; // computed
  payment_mode: PaymentMode;
  amount_paid: number;
  payment_reference?: string;
  notes?: string;
  created_by: string; // admin
  created_at: string;
  updated_at: string;
}

// ─── Profile Access ────────────────────────────────────────────

export interface ProfileAccess {
  id: string;
  granted_to_user_id: string;
  profile_id: string;
  granted_by_admin_id: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
  notes?: string;
  // Per-section, per-field visibility map (see src/lib/profile-privacy.ts).
  // null/undefined = no restrictions, full profile visible to the recipient.
  visible_fields?: Record<string, Record<string, boolean>> | null;
  // Relations
  profile?: Profile;
}

export interface ProfileInteraction {
  id: string;
  user_id: string;
  profile_id: string;
  interaction_type: "view" | "favourite" | "download" | "share" | "block";
  created_at: string;
}

// ─── Match Meeting Requests ────────────────────────────────────
// A member who has been granted access to a shared profile can request an
// in-person "match meeting" with that profile. The admin accepts/rejects
// the request and later marks a completed meeting.

export interface MatchMeetingRequest {
  id: string;
  requested_by_user_id: string;
  profile_id: string;
  status: MatchMeetingStatus;
  requested_at: string;
  responded_by_admin_id?: string;
  responded_at?: string;
  completed_by_admin_id?: string;
  completed_at?: string;
  meeting_date?: string;
  meeting_location?: string;
  admin_notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  // Relations (when joined)
  profiles?: Profile;
  users?: AppUser;
}

// ─── Audit Log ─────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: UserRole;
  actor_name: string;
  action: AuditAction;
  entity_type: "profile" | "user" | "subscription" | "plan" | "setting" | "match_meeting";
  entity_id: string;
  entity_name?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export type AuditAction =
  | "profile_created"
  | "profile_edited"
  | "profile_deleted"
  | "profile_approved"
  | "profile_rejected"
  | "profile_deactivated"
  | "profile_suspended"
  | "profile_reactivated"
  | "profile_viewed"
  | "biodata_generated"
  | "biodata_downloaded"
  | "profile_shared"
  | "profile_access_revoked"
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "user_created"
  | "user_updated"
  | "user_deactivated"
  | "plan_created"
  | "plan_updated"
  | "setting_updated"
  | "login"
  | "logout"
  | "profile_verified"
  | "profile_unverified"
  | "profile_self_registered"
  | "profile_share_updated"
  | "match_meeting_requested"
  | "match_meeting_accepted"
  | "match_meeting_rejected"
  | "match_meeting_completed"
  | "match_meeting_cancelled";

// ─── Notifications ─────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

// ─── Analytics ─────────────────────────────────────────────────

export interface DashboardStats {
  total_users: number;
  male_profiles: number;
  female_profiles: number;
  paid_users: number;
  free_users: number;
  expired_subscriptions: number;
  expiring_within_30_days: number;
  pending_profiles: number;
  verified_profiles: number;
  total_biodatas: number;
  today_registrations: number;
  total_revenue: number;
  pending_match_meetings: number;
  total_completed_match_meetings: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  paid_users: number;
}

export interface ProfileViewStats {
  profile_id: string;
  profile_name: string;
  view_count: number;
}

// ─── Success Stories ──────────────────────────────────────────

export interface SuccessStory {
  id: string;
  couple_names: string;
  wedding_date?: string;
  story: string;
  image_url?: string;
  is_published: boolean;
  created_at: string;
}

// ─── Testimonials ─────────────────────────────────────────────

export interface Testimonial {
  id: string;
  name: string;
  location?: string;
  rating: number;
  content: string;
  image_url?: string;
  is_published: boolean;
  created_at: string;
}

// ─── FAQs ─────────────────────────────────────────────────────

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

// ─── Settings ─────────────────────────────────────────────────

export interface SiteSettings {
  id: string;
  site_name: string;
  site_tagline: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  banner_title?: string;
  banner_subtitle?: string;
  banner_image_url?: string;
  social_links?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
  };
  updated_at: string;
}

// ─── Filters & Pagination ─────────────────────────────────────

export interface ProfileFilters {
  gender?: Gender;
  age_min?: number;
  age_max?: number;
  dob_year?: number;
  religion?: string;
  caste?: string;
  sub_caste?: string;
  profession?: string;
  district?: string;
  state?: string;
  country?: string;
  marital_status?: MaritalStatus;
  subscription?: "paid" | "free" | "expired" | "expiring_soon";
  education?: string;
  income_min?: number;
  income_max?: number;
  status?: ProfileStatus;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ─── API Response ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Email Templates ──────────────────────────────────────────

export type EmailTemplate =
  | "registration"
  | "profile_approved"
  | "profile_rejected"
  | "profile_verified"
  | "subscription_activated"
  | "subscription_expiring"
  | "subscription_expired"
  | "password_reset"
  | "profile_shared"
  | "biodata_generated";

export interface EmailData {
  to: string;
  name: string;
  template: EmailTemplate;
  data?: Record<string, unknown>;
}

// ─── Form Types ───────────────────────────────────────────────

export type ProfileFormSection =
  | "personal"
  | "address"
  | "contact"
  | "profession"
  | "education"
  | "family"
  | "property"
  | "partner_preferences"
  | "about"
  | "images"
  | "documents";

export interface ProfileFormData {
  personal: Partial<PersonalDetails>;
  address: Partial<AddressDetails>;
  contact: Partial<ContactDetails>;
  profession: Partial<ProfessionDetails>;
  education: Partial<EducationDetails>;
  family: Partial<FamilyDetails>;
  property: Partial<PropertyDetails>;
  partner_preferences: Partial<PartnerPreferences>;
  about_me?: string;
}