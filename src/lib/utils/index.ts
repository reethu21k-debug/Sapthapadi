import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInYears, format, formatDistanceToNow } from "date-fns";
import { IncomeUnit } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date Utils ───────────────────────────────────────────────

export function calculateAge(dob: string): number {
  return differenceInYears(new Date(), new Date(dob));
}

export function formatDate(date: string | Date, pattern = "dd MMM yyyy"): string {
  return format(new Date(date), pattern);
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getDaysRemaining(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ─── Time of Birth Utils (12-hour clock) ───────────────────────

/**
 * Normalizes a stored time-of-birth value for display. New records are
 * always saved as "hh:mm AM/PM" (see ProfileForm's TimeOfBirthInput), but
 * older records may still hold a bare 24-hour "HH:mm" string — this
 * converts either shape into a consistent 12-hour display string.
 */
export function formatTimeOfBirth(time?: string | null): string {
  if (!time) return "—";

  // Already in 12-hour form, e.g. "02:30 PM"
  if (/\s?(AM|PM)$/i.test(time.trim())) {
    const [hm, period] = time.trim().split(/\s+/);
    const [h, m] = hm.split(":");
    return `${h.padStart(2, "0")}:${(m || "00").padStart(2, "0")} ${period.toUpperCase()}`;
  }

  // Legacy 24-hour "HH:mm"
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
}

/** Splits a "hh:mm AM/PM" (or legacy 24h) string into parts for a 12-hour picker UI. */
export function parseTimeOfBirth(time?: string | null): { hour: string; minute: string; period: "AM" | "PM" } {
  const normalized = formatTimeOfBirth(time);
  const match = normalized.match(/^(\d{2}):(\d{2}) (AM|PM)$/);
  if (!match) return { hour: "", minute: "", period: "AM" };
  return { hour: String(parseInt(match[1], 10)), minute: match[2], period: match[3] as "AM" | "PM" };
}

/** Builds a "hh:mm AM/PM" string from picker parts. Returns undefined if incomplete. */
export function buildTimeOfBirth(hour: string, minute: string, period: "AM" | "PM"): string | undefined {
  if (!hour || !minute) return undefined;
  const h = parseInt(hour, 10);
  if (Number.isNaN(h) || h < 1 || h > 12) return undefined;
  return `${String(h).padStart(2, "0")}:${minute.padStart(2, "0")} ${period}`;
}

// ─── Income Utils (LPA / CR entry ↔ absolute INR storage) ──────

const LAKH = 100_000;
const CRORE = 10_000_000;

/** Converts an admin-entered amount + unit into the absolute INR value that gets stored. */
export function incomeToAbsolute(amount: number, unit: IncomeUnit): number {
  if (!amount || amount < 0) return 0;
  return unit === "cr" ? Math.round(amount * CRORE) : Math.round(amount * LAKH);
}

/** Converts a stored absolute INR value back into the best-fit amount + unit for editing. */
export function absoluteToIncomeParts(value?: number | null): { amount: number | ""; unit: IncomeUnit } {
  if (!value) return { amount: "", unit: "lpa" };
  if (value >= CRORE) {
    return { amount: Math.round((value / CRORE) * 100) / 100, unit: "cr" };
  }
  return { amount: Math.round((value / LAKH) * 100) / 100, unit: "lpa" };
}

// ─── Profile Utils ────────────────────────────────────────────

export function formatHeight(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}' ${inches}" (${cm} cm)`;
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formats an absolute INR value as an LPA/CR string, e.g. "₹8.5 LPA" or "₹1.2 CR". */
export function formatIncome(amount: number): string {
  if (amount >= CRORE) {
    return `₹${(amount / CRORE).toFixed(2).replace(/\.?0+$/, "")} CR/year`;
  } else if (amount >= LAKH) {
    return `₹${(amount / LAKH).toFixed(2).replace(/\.?0+$/, "")} LPA`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K/year`;
  }
  return `₹${amount}/year`;
}

export function calculateProfileCompletion(profile: Record<string, unknown>): number {
  const fields = [
    "personal.first_name", "personal.last_name", "personal.gender",
    "personal.date_of_birth", "personal.religion", "personal.caste",
    "personal.marital_status",
    "address.current_address", "address.district", "address.state",
    "contact.phone", "contact.email",
    "profession.profession",
    "education.highest_qualification",
    "family.father_name", "family.mother_name",
    "images.profile_photo",
  ];

  let filled = 0;
  for (const field of fields) {
    const parts = field.split(".");
    let value: unknown = profile;
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part];
    }
    if (value !== null && value !== undefined && value !== "") {
      filled++;
    }
  }

  return Math.round((filled / fields.length) * 100);
}

// ─── String Utils ─────────────────────────────────────────────

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Normalizes a full name for duplicate-candidate comparison (case/whitespace-insensitive). */
export function normalizeNameForComparison(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

// ─── Number Utils ─────────────────────────────────────────────

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// ─── Object Utils ─────────────────────────────────────────────

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result as Omit<T, K>;
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
}

// ─── Subscription Utils ───────────────────────────────────────

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  six_months: "6 Months",
  one_year: "1 Year",
  premium: "Premium",
  vip: "VIP",
};

export const PLAN_COLORS: Record<string, string> = {
  free: "text-gray-500 bg-gray-100",
  six_months: "text-blue-700 bg-blue-100",
  one_year: "text-purple-700 bg-purple-100",
  premium: "text-gold-700 bg-gold-100",
  vip: "text-amber-800 bg-amber-100",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-700 bg-yellow-100",
  approved: "text-green-700 bg-green-100",
  rejected: "text-red-700 bg-red-100",
  deactivated: "text-gray-700 bg-gray-100",
  suspended: "text-orange-700 bg-orange-100",
  active: "text-green-700 bg-green-100",
  expired: "text-red-700 bg-red-100",
  cancelled: "text-gray-700 bg-gray-100",
};

/**
 * Builds a real monthly revenue series from raw subscription rows,
 * filling in every month (even ones with zero revenue) so the chart
 * always shows a full, honest timeline instead of only months that
 * happen to have data.
 */
export function getMonthlyRevenue(
  subscriptions: { amount_paid: number | null; created_at: string }[],
  monthsBack = 12
): { month: string; revenue: number; count: number }[] {
  const now = new Date();
  const buckets: { key: string; month: string; revenue: number; count: number }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: format(d, "MMM"),
      revenue: 0,
      count: 0,
    });
  }

  const byKey = new Map(buckets.map((b) => [b.key, b]));

  subscriptions.forEach((s) => {
    const d = new Date(s.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.revenue += Number(s.amount_paid || 0);
      bucket.count += 1;
    }
  });

  return buckets.map(({ month, revenue, count }) => ({ month, revenue, count }));
}

// ─── File Utils ───────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function isValidImageType(file: File): boolean {
  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);
}

export function isValidPDFType(file: File): boolean {
  return file.type === "application/pdf";
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}