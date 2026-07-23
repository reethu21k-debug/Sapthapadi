import jsPDF from "jspdf";
import { Profile } from "@/types";
import { calculateAge, formatDate, formatHeight, formatIncome, formatTimeOfBirth } from "@/lib/utils";

// ─── Types & Configuration ─────────────────────────────────────

type RGB = [number, number, number];

// Same palette as biodata-generator.ts — keep both PDFs visually consistent.
const COLORS: Record<string, RGB> = {
  maroon: [92, 20, 32],
  maroonDeep: [58, 12, 20],
  gold: [176, 137, 60],
  goldDeep: [140, 105, 40],
  goldPale: [222, 196, 140],
  cream: [253, 249, 240],
  blush: [247, 237, 222],
  ink: [46, 28, 22],
  warmGray: [120, 96, 78],
  white: [255, 255, 255],
  verified: [176, 137, 60],
  diffHighlight: [252, 231, 199], // slightly stronger than blush, marks differing rows
};

function setFillColor(doc: jsPDF, [r, g, b]: RGB) {
  doc.setFillColor(r, g, b);
}
function setTextColor(doc: jsPDF, [r, g, b]: RGB) {
  doc.setTextColor(r, g, b);
}
function setDrawColor(doc: jsPDF, [r, g, b]: RGB) {
  doc.setDrawColor(r, g, b);
}

// ─── Decorative Motifs (same as biodata-generator.ts) ──────────

function drawDiamond(doc: jsPDF, x: number, y: number, r: number, color: RGB) {
  setFillColor(doc, color);
  doc.lines([[r, r], [-r, r], [-r, -r], [r, -r]], x, y - r, [1, 1], "F", true);
}

function drawOrnamentDivider(doc: jsPDF, cx: number, y: number, armLength = 16, color: RGB = COLORS.gold) {
  setDrawColor(doc, color);
  doc.setLineWidth(0.35);
  doc.line(cx - armLength - 4, y, cx - 3, y);
  doc.line(cx + 3, y, cx + armLength + 4, y);
  drawDiamond(doc, cx, y, 1.6, color);
}

function drawCornerBracket(doc: jsPDF, x: number, y: number, dx: number, dy: number) {
  const len = 11;
  setDrawColor(doc, COLORS.gold);
  doc.setLineWidth(0.9);
  doc.line(x, y, x + dx * len, y);
  doc.line(x, y, x, y + dy * len);
  drawDiamond(doc, x + dx * 4, y + dy * 4, 0.9, COLORS.gold);
}

function drawPageBackdrop(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  setFillColor(doc, COLORS.cream);
  doc.rect(0, 0, pageW, pageH, "F");

  setDrawColor(doc, COLORS.goldDeep);
  doc.setLineWidth(0.6);
  doc.rect(6, 6, pageW - 12, pageH - 12, "S");

  setDrawColor(doc, COLORS.goldPale);
  doc.setLineWidth(0.25);
  doc.rect(9, 9, pageW - 18, pageH - 18, "S");

  drawCornerBracket(doc, 9, 9, 1, 1);
  drawCornerBracket(doc, pageW - 9, 9, -1, 1);
  drawCornerBracket(doc, 9, pageH - 9, 1, -1);
  drawCornerBracket(doc, pageW - 9, pageH - 9, -1, -1);
}

function startNewPage(doc: jsPDF): number {
  doc.addPage();
  drawPageBackdrop(doc);
  return 26;
}

// ─── Header ──────────────────────────────────────────────────

function drawHeader(doc: jsPDF, profileA: Profile, profileB: Profile) {
  const pageW = doc.internal.pageSize.getWidth();
  const bandH = 58;

  setFillColor(doc, COLORS.maroon);
  doc.rect(0, 0, pageW, bandH, "F");

  setDrawColor(doc, COLORS.gold);
  doc.setLineWidth(0.6);
  doc.line(0, bandH, pageW, bandH);
  setDrawColor(doc, COLORS.goldPale);
  doc.setLineWidth(0.25);
  doc.line(0, bandH + 1.6, pageW, bandH + 1.6);

  drawOrnamentDivider(doc, pageW / 2, 9, 14, COLORS.gold);

  setTextColor(doc, COLORS.gold);
  doc.setFontSize(24);
  doc.setFont("times", "bold");
  doc.text("Saptapadi", pageW / 2, 21, { align: "center", charSpace: 2.5 });

  setTextColor(doc, [235, 222, 200]);
  doc.setFontSize(9);
  doc.setFont("times", "italic");
  doc.text("सप्तपदी • Where Souls Unite", pageW / 2, 28, { align: "center", charSpace: 0.5 });

  drawOrnamentDivider(doc, pageW / 2, 34, 20, COLORS.goldPale);

  setTextColor(doc, [240, 232, 216]);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text("PROFILE COMPARISON", pageW / 2, 41, { align: "center", charSpace: 3 });

  doc.setFontSize(7.5);
  setTextColor(doc, [210, 190, 160]);
  doc.setFont("helvetica", "normal");
  doc.text(`${profileA.profile_id}  vs  ${profileB.profile_id}`, 16, 51);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageW - 16, 51, { align: "right" });
}

// ─── Remote Image Fetching (same as biodata-generator.ts) ──────

type ImageFormat = "JPEG" | "PNG" | "WEBP";

async function fetchImageAsDataUrl(url: string): Promise<{ dataUrl: string; format: ImageFormat } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    let format: ImageFormat = "JPEG";
    let mime = "image/jpeg";
    if (contentType.includes("png")) {
      format = "PNG";
      mime = "image/png";
    } else if (contentType.includes("webp")) {
      format = "WEBP";
      mime = "image/webp";
    }
    return { dataUrl: `data:${mime};base64,${base64}`, format };
  } catch {
    return null;
  }
}

// ─── Twin Photo + Name Header ──────────────────────────────────

async function drawTwinPhotoHeader(doc: jsPDF, profileA: Profile, profileB: Profile, yStart: number): Promise<number> {
  const pageW = doc.internal.pageSize.getWidth();
  const photoW = 32;
  const photoH = 40;
  const colWidth = (pageW - 32) / 2;
  const photoAX = 16 + colWidth / 2 - photoW / 2;
  const photoBX = 16 + colWidth + colWidth / 2 - photoW / 2;
  const photoY = yStart;

  const fullName = (p: Profile) =>
    [p.personal?.first_name, p.personal?.middle_name, p.personal?.last_name].filter(Boolean).join(" ");

  for (const [profile, photoX] of [
    [profileA, photoAX],
    [profileB, photoBX],
  ] as [Profile, number][]) {
    setDrawColor(doc, COLORS.maroon);
    doc.setLineWidth(0.7);
    doc.rect(photoX - 1.5, photoY - 1.5, photoW + 3, photoH + 3, "S");
    setDrawColor(doc, COLORS.gold);
    doc.setLineWidth(0.35);
    doc.rect(photoX - 3, photoY - 3, photoW + 6, photoH + 6, "S");

    const photoUrl = profile.images?.profile_photo;
    const imageData = photoUrl ? await fetchImageAsDataUrl(photoUrl) : null;
    if (imageData) {
      try {
        doc.addImage(imageData.dataUrl, imageData.format, photoX, photoY, photoW, photoH);
      } catch {
        setFillColor(doc, COLORS.blush);
        doc.rect(photoX, photoY, photoW, photoH, "F");
      }
    } else {
      setFillColor(doc, COLORS.blush);
      doc.rect(photoX, photoY, photoW, photoH, "F");
    }

    const name = fullName(profile) || "Unnamed";
    const centerX = photoX + photoW / 2;

    setTextColor(doc, COLORS.maroon);
    doc.setFontSize(11.5);
    doc.setFont("times", "bold");
    doc.text(name, centerX, photoY + photoH + 8, { align: "center", maxWidth: colWidth - 6 });

    setTextColor(doc, COLORS.goldDeep);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(profile.profile_id, centerX, photoY + photoH + 13.5, { align: "center", charSpace: 1 });

    if (profile.is_verified) {
      setTextColor(doc, COLORS.verified);
      doc.setFontSize(6.5);
      doc.text("✓ VERIFIED", centerX, photoY + photoH + 18, { align: "center", charSpace: 0.5 });
    }
  }

  return photoY + photoH + 24;
}

// ─── Section Header ───────────────────────────────────────────

function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  const pageW = doc.internal.pageSize.getWidth();

  setDrawColor(doc, COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(16, y, pageW - 16, y);
  drawDiamond(doc, 16, y, 1.5, COLORS.gold);

  setTextColor(doc, COLORS.maroon);
  doc.setFontSize(10.5);
  doc.setFont("times", "bold");
  doc.text(title.toUpperCase(), 23, y + 6.5, { charSpace: 1.6 });

  setDrawColor(doc, COLORS.goldPale);
  doc.setLineWidth(0.2);
  doc.line(16, y + 10, pageW - 16, y + 10);

  return y + 15.5;
}

// ─── Two-Column Comparison Table ───────────────────────────────

interface CompareRow {
  label: string;
  a: string;
  b: string;
}

function drawCompareTable(doc: jsPDF, rows: CompareRow[], startY: number): number {
  const pageW = doc.internal.pageSize.getWidth();
  const labelW = 42;
  const colW = (pageW - 32 - labelW) / 2;
  const colAX = 16 + labelW;
  const colBX = colAX + colW;
  const rowH = 8.2;
  let y = startY;

  rows.forEach((row, i) => {
    const differs = row.a !== row.b;

    if (differs) {
      setFillColor(doc, COLORS.diffHighlight);
      doc.rect(16, y, pageW - 32, rowH, "F");
    } else if (i % 2 === 0) {
      setFillColor(doc, COLORS.blush);
      doc.rect(16, y, pageW - 32, rowH, "F");
    }

    setTextColor(doc, COLORS.warmGray);
    doc.setFontSize(7.3);
    doc.setFont("helvetica", "normal");
    doc.text(row.label.toUpperCase(), 18, y + 5.4, { charSpace: 0.2, maxWidth: labelW - 4 });

    setTextColor(doc, COLORS.ink);
    doc.setFont("times", differs ? "bold" : "normal");
    doc.setFontSize(8.3);
    doc.text(row.a || "—", colAX + 2, y + 5.4, { maxWidth: colW - 4 });
    doc.text(row.b || "—", colBX + 2, y + 5.4, { maxWidth: colW - 4 });

    setDrawColor(doc, COLORS.goldPale);
    doc.setLineWidth(0.15);
    doc.line(16, y + rowH, pageW - 16, y + rowH);
    // Vertical divider between the two profile columns
    doc.line(colBX - 1, y, colBX - 1, y + rowH);

    y += rowH;
  });

  return y + 4;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 20) {
    return startNewPage(doc);
  }
  return y;
}

// ─── Main Generator ───────────────────────────────────────────

export async function generateComparePDF(profileA: Profile, profileB: Profile): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setFont("helvetica");

  drawPageBackdrop(doc);
  drawHeader(doc, profileA, profileB);

  let y = await drawTwinPhotoHeader(doc, profileA, profileB, 66);

  const age = (p: Profile) => (p.personal?.date_of_birth ? `${calculateAge(p.personal.date_of_birth)} yrs` : "—");
  const height = (p: Profile) => (p.personal?.height_cm ? formatHeight(p.personal.height_cm) : "—");
  const income = (p: Profile) => (p.profession?.annual_income ? formatIncome(p.profession.annual_income) : "—");

  // ─── Personal Details ─────────────────────────────────────
  y = ensureSpace(doc, y, 40);
  y = drawSectionHeader(doc, "Personal Details", y);
  y = drawCompareTable(doc, [
    { label: "Date of Birth", a: profileA.personal?.date_of_birth ? formatDate(profileA.personal.date_of_birth) : "—", b: profileB.personal?.date_of_birth ? formatDate(profileB.personal.date_of_birth) : "—" },
    { label: "Age", a: age(profileA), b: age(profileB) },
    { label: "Gender", a: profileA.personal?.gender || "—", b: profileB.personal?.gender || "—" },
    { label: "Marital Status", a: profileA.personal?.marital_status?.replace(/_/g, " ") || "—", b: profileB.personal?.marital_status?.replace(/_/g, " ") || "—" },
    { label: "Height", a: height(profileA), b: height(profileB) },
    { label: "Weight", a: profileA.personal?.weight_kg ? `${profileA.personal.weight_kg} kg` : "—", b: profileB.personal?.weight_kg ? `${profileB.personal.weight_kg} kg` : "—" },
    { label: "Blood Group", a: profileA.personal?.blood_group || "—", b: profileB.personal?.blood_group || "—" },
    { label: "Complexion", a: profileA.personal?.complexion || "—", b: profileB.personal?.complexion || "—" },
    { label: "Religion", a: profileA.personal?.religion || "—", b: profileB.personal?.religion || "—" },
    { label: "Caste / Sub-caste", a: [profileA.personal?.caste, profileA.personal?.sub_caste].filter(Boolean).join(" / ") || "—", b: [profileB.personal?.caste, profileB.personal?.sub_caste].filter(Boolean).join(" / ") || "—" },
    { label: "Gothram", a: profileA.personal?.gothram || "—", b: profileB.personal?.gothram || "—" },
    { label: "Nakshatram", a: profileA.personal?.nakshatram || "—", b: profileB.personal?.nakshatram || "—" },
    { label: "Rashi", a: profileA.personal?.rashi || "—", b: profileB.personal?.rashi || "—" },
    { label: "Manglik", a: profileA.personal?.manglik?.replace(/_/g, " ") || "—", b: profileB.personal?.manglik?.replace(/_/g, " ") || "—" },
    { label: "Time of Birth", a: formatTimeOfBirth(profileA.personal?.time_of_birth), b: formatTimeOfBirth(profileB.personal?.time_of_birth) },
    { label: "Place of Birth", a: profileA.personal?.place_of_birth || "—", b: profileB.personal?.place_of_birth || "—" },
    { label: "Languages", a: (profileA.personal?.languages_known || []).join(", ") || "—", b: (profileB.personal?.languages_known || []).join(", ") || "—" },
    { label: "Diet", a: profileA.personal?.food_preference?.replace(/_/g, " ") || "—", b: profileB.personal?.food_preference?.replace(/_/g, " ") || "—" },
    { label: "Habits", a: profileA.personal?.habits || "—", b: profileB.personal?.habits || "—" },
    { label: "Nationality", a: profileA.personal?.nationality || "—", b: profileB.personal?.nationality || "—" },
  ], y);

  // ─── Contact Details ─────────────────────────────────────
  y = ensureSpace(doc, y, 30);
  y = drawSectionHeader(doc, "Contact Details", y);
  y = drawCompareTable(doc, [
    { label: "Phone", a: profileA.contact?.phone || "—", b: profileB.contact?.phone || "—" },
    { label: "Alt. Phone", a: profileA.contact?.alternative_phone || "—", b: profileB.contact?.alternative_phone || "—" },
    { label: "Email", a: profileA.contact?.email || "—", b: profileB.contact?.email || "—" },
    { label: "Emergency Contact", a: profileA.contact?.emergency_contact || "—", b: profileB.contact?.emergency_contact || "—" },
  ], y);

  // ─── Address ──────────────────────────────────────────────
  y = ensureSpace(doc, y, 30);
  y = drawSectionHeader(doc, "Address", y);
  y = drawCompareTable(doc, [
    { label: "Village / Town", a: [profileA.address?.village, profileA.address?.town].filter(Boolean).join(", ") || "—", b: [profileB.address?.village, profileB.address?.town].filter(Boolean).join(", ") || "—" },
    { label: "District", a: profileA.address?.district || "—", b: profileB.address?.district || "—" },
    { label: "State", a: profileA.address?.state || "—", b: profileB.address?.state || "—" },
    { label: "Country", a: profileA.address?.country || "—", b: profileB.address?.country || "—" },
    { label: "Pincode", a: profileA.address?.pincode || "—", b: profileB.address?.pincode || "—" },
  ], y);

  // ─── Professional Background ───────────────────────────────
  y = ensureSpace(doc, y, 40);
  y = drawSectionHeader(doc, "Professional Background", y);
  y = drawCompareTable(doc, [
    { label: "Profession", a: profileA.profession?.profession || "—", b: profileB.profession?.profession || "—" },
    { label: "Designation", a: profileA.profession?.designation || "—", b: profileB.profession?.designation || "—" },
    { label: "Company", a: profileA.profession?.company_name || "—", b: profileB.profession?.company_name || "—" },
    { label: "Work Location", a: profileA.profession?.company_location || "—", b: profileB.profession?.company_location || "—" },
    { label: "Work Country", a: profileA.profession?.work_country || "—", b: profileB.profession?.work_country || "—" },
    { label: "Employment Type", a: profileA.profession?.employment_type?.replace(/_/g, " ") || "—", b: profileB.profession?.employment_type?.replace(/_/g, " ") || "—" },
    { label: "Annual Income", a: income(profileA), b: income(profileB) },
    { label: "Visa Status", a: profileA.profession?.visa_status?.toUpperCase() || "—", b: profileB.profession?.visa_status?.toUpperCase() || "—" },
  ], y);

  // ─── Education ────────────────────────────────────────────
  y = ensureSpace(doc, y, 30);
  y = drawSectionHeader(doc, "Education", y);
  y = drawCompareTable(doc, [
    { label: "Highest Qualification", a: profileA.education?.highest_qualification || "—", b: profileB.education?.highest_qualification || "—" },
    { label: "College", a: profileA.education?.college || "—", b: profileB.education?.college || "—" },
    { label: "University", a: profileA.education?.university || "—", b: profileB.education?.university || "—" },
    { label: "Passing Year", a: profileA.education?.year_passed?.toString() || "—", b: profileB.education?.year_passed?.toString() || "—" },
  ], y);

  // ─── Family Background ──────────────────────────────────────
  y = ensureSpace(doc, y, 40);
  y = drawSectionHeader(doc, "Family Background", y);
  y = drawCompareTable(doc, [
    { label: "Father", a: [profileA.family?.father_name, profileA.family?.father_profession].filter(Boolean).join(" — ") || "—", b: [profileB.family?.father_name, profileB.family?.father_profession].filter(Boolean).join(" — ") || "—" },
    { label: "Mother", a: [profileA.family?.mother_name, profileA.family?.mother_profession].filter(Boolean).join(" — ") || "—", b: [profileB.family?.mother_name, profileB.family?.mother_profession].filter(Boolean).join(" — ") || "—" },
    { label: "Brothers (Married)", a: `${profileA.family?.brothers || 0} (${profileA.family?.married_brothers || 0})`, b: `${profileB.family?.brothers || 0} (${profileB.family?.married_brothers || 0})` },
    { label: "Sisters (Married)", a: `${profileA.family?.sisters || 0} (${profileA.family?.married_sisters || 0})`, b: `${profileB.family?.sisters || 0} (${profileB.family?.married_sisters || 0})` },
    { label: "Family Property", a: profileA.family?.family_property || "—", b: profileB.family?.family_property || "—" },
  ], y);

  // ─── Property ────────────────────────────────────────────
  y = ensureSpace(doc, y, 30);
  y = drawSectionHeader(doc, "Property", y);
  y = drawCompareTable(doc, [
    { label: "Owns Property", a: profileA.property?.owns_property ? "Yes" : "No", b: profileB.property?.owns_property ? "Yes" : "No" },
    { label: "Property Type", a: profileA.property?.property_type || "—", b: profileB.property?.property_type || "—" },
    { label: "Location", a: profileA.property?.property_location || "—", b: profileB.property?.property_location || "—" },
    { label: "Estimated Value", a: profileA.property?.property_value ? formatIncome(profileA.property.property_value) : "—", b: profileB.property?.property_value ? formatIncome(profileB.property.property_value) : "—" },
  ], y);

  // ─── Partner Expectations ───────────────────────────────────
  y = ensureSpace(doc, y, 30);
  y = drawSectionHeader(doc, "Partner Expectations", y);
  y = drawCompareTable(doc, [
    { label: "Age Bracket", a: `${profileA.partner_preferences?.age_min || "Any"} – ${profileA.partner_preferences?.age_max || "Any"}`, b: `${profileB.partner_preferences?.age_min || "Any"} – ${profileB.partner_preferences?.age_max || "Any"}` },
    { label: "Preferred Religion", a: profileA.partner_preferences?.religion || "—", b: profileB.partner_preferences?.religion || "—" },
    { label: "Preferred Caste", a: profileA.partner_preferences?.caste || "—", b: profileB.partner_preferences?.caste || "—" },
    { label: "Preferred Location", a: profileA.partner_preferences?.location || "—", b: profileB.partner_preferences?.location || "—" },
    { label: "Education Criteria", a: profileA.partner_preferences?.education || "—", b: profileB.partner_preferences?.education || "—" },
    { label: "Min Income", a: profileA.partner_preferences?.income_min ? formatIncome(profileA.partner_preferences.income_min) : "—", b: profileB.partner_preferences?.income_min ? formatIncome(profileB.partner_preferences.income_min) : "—" },
  ], y);

  // ─── Footer (all pages) ────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const footH = 14;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    setFillColor(doc, COLORS.maroon);
    doc.rect(0, pageH - footH, pageW, footH, "F");
    setDrawColor(doc, COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(0, pageH - footH, pageW, pageH - footH);
    drawDiamond(doc, pageW / 2, pageH - footH, 1.2, COLORS.gold);

    setTextColor(doc, COLORS.gold);
    doc.setFontSize(8);
    doc.setFont("times", "bold");
    doc.text("SAPTAPADI MATRIMONY", 16, pageH - 5.5, { charSpace: 0.6 });

    setTextColor(doc, [210, 190, 160]);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${i} of ${totalPages}  |  Comparison Report`, pageW - 16, pageH - 5.5, { align: "right" });
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}