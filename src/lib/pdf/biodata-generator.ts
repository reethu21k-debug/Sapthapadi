import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Profile } from "@/types";
import { calculateAge, formatDate, formatHeight, formatIncome, formatTimeOfBirth } from "@/lib/utils";

// ─── Types & Configuration ─────────────────────────────────────

type RGB = [number, number, number];

// ─── Color Palette (Wedding Invitation — Maroon & Gold on Ivory) ──
const COLORS: Record<string, RGB> = {
  maroon: [92, 20, 32],       // Primary band / headline color
  maroonDeep: [58, 12, 20],   // Shadows, deep rules
  gold: [176, 137, 60],       // Primary gold accent
  goldDeep: [140, 105, 40],   // Borders, deeper gold rules
  goldPale: [222, 196, 140],  // Soft gold hairlines
  cream: [253, 249, 240],     // Page background
  blush: [247, 237, 222],     // Alternating row tint / panel fill
  ink: [46, 28, 22],          // Primary body text (warm near-black)
  warmGray: [120, 96, 78],    // Secondary text / labels
  white: [255, 255, 255],
  verified: [176, 137, 60],   // Verified badge accent (gold)
};

// ─── Font Setup ───────────────────────────────────────────────

function setupFonts(doc: jsPDF) {
  doc.setFont("helvetica");
}

// ─── Helper Functions ─────────────────────────────────────────

function setFillColor(doc: jsPDF, [r, g, b]: RGB) {
  doc.setFillColor(r, g, b);
}

function setTextColor(doc: jsPDF, [r, g, b]: RGB) {
  doc.setTextColor(r, g, b);
}

function setDrawColor(doc: jsPDF, [r, g, b]: RGB) {
  doc.setDrawColor(r, g, b);
}

// ─── Decorative Motifs ─────────────────────────────────────────

function drawDiamond(doc: jsPDF, x: number, y: number, r: number, color: RGB) {
  setFillColor(doc, color);
  doc.lines(
    [[r, r], [-r, r], [-r, -r], [r, -r]],
    x,
    y - r,
    [1, 1],
    "F",
    true
  );
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

async function drawHeader(doc: jsPDF, profile: Profile) {
  const pageW = doc.internal.pageSize.getWidth();
  const bandH = 64;

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
  doc.setFontSize(29);
  doc.setFont("times", "bold");
  doc.text("Saptapadi", pageW / 2, 23, { align: "center", charSpace: 2.5 });

  setTextColor(doc, [235, 222, 200]);
  doc.setFontSize(10);
  doc.setFont("times", "italic");
  doc.text("सप्तपदी • Where Souls Unite", pageW / 2, 31, { align: "center", charSpace: 0.5 });

  drawOrnamentDivider(doc, pageW / 2, 38, 20, COLORS.goldPale);

  setTextColor(doc, [240, 232, 216]);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text("MATRIMONIAL BIODATA", pageW / 2, 46, { align: "center", charSpace: 3 });

  doc.setFontSize(8);
  setTextColor(doc, [210, 190, 160]);
  doc.setFont("helvetica", "normal");
  doc.text(`Profile ID: ${profile.profile_id}`, 16, 57);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageW - 16, 57, { align: "right" });
}

// ─── Remote Image Fetching ─────────────────────────────────────

type ImageFormat = "JPEG" | "PNG" | "WEBP";

async function fetchImageAsDataUrl(
  url: string
): Promise<{ dataUrl: string; format: ImageFormat } | null> {
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

// ─── Profile Photo Box ────────────────────────────────────────

async function drawProfilePhoto(doc: jsPDF, profile: Profile, yStart: number): Promise<number> {
  const photoUrl = profile.images?.profile_photo;
  const photoW = 40;
  const photoH = 50;
  const photoX = 16;
  const photoY = yStart + 5;

  setDrawColor(doc, COLORS.maroon);
  doc.setLineWidth(0.8);
  doc.rect(photoX - 2, photoY - 2, photoW + 4, photoH + 4, "S");
  
  setDrawColor(doc, COLORS.gold);
  doc.setLineWidth(0.4);
  doc.rect(photoX - 4, photoY - 4, photoW + 8, photoH + 8, "S");

  drawDiamond(doc, photoX - 4, photoY - 4, 1.1, COLORS.gold);
  drawDiamond(doc, photoX + photoW + 4, photoY - 4, 1.1, COLORS.gold);
  drawDiamond(doc, photoX - 4, photoY + photoH + 4, 1.1, COLORS.gold);
  drawDiamond(doc, photoX + photoW + 4, photoY + photoH + 4, 1.1, COLORS.gold);

  const imageData = photoUrl ? await fetchImageAsDataUrl(photoUrl) : null;

  if (imageData) {
    try {
      doc.addImage(imageData.dataUrl, imageData.format, photoX, photoY, photoW, photoH);
    } catch {
      renderPhotoPlaceholder(doc, photoX, photoY, photoW, photoH, "Photo");
    }
  } else {
    renderPhotoPlaceholder(
      doc, 
      photoX, 
      photoY, 
      photoW, 
      photoH, 
      photoUrl ? "Photo unavailable" : ""
    );
  }

  return photoY + photoH;
}

function renderPhotoPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number, text: string) {
  setFillColor(doc, COLORS.blush);
  doc.rect(x, y, w, h, "F");
  if (text) {
    setTextColor(doc, COLORS.warmGray);
    doc.setFontSize(text === "Photo" ? 8 : 7);
    doc.text(text, x + w / 2, y + h / 2, { align: "center" });
  }
}

// ─── QR Code ─────────────────────────────────────────────────

async function drawQRCode(doc: jsPDF, profileId: string, x: number, y: number) {
  try {
    const qrDataUrl = await QRCode.toDataURL(
      `${process.env.NEXT_PUBLIC_APP_URL}/profiles/${profileId}`,
      { width: 80, margin: 1, color: { dark: "#5C1420", light: "#FDF9F0" } }
    );
    doc.addImage(qrDataUrl, "PNG", x, y, 22, 22);

    setDrawColor(doc, COLORS.gold);
    doc.setLineWidth(0.35);
    doc.rect(x - 1.5, y - 1.5, 25, 25, "S");

    setTextColor(doc, COLORS.warmGray);
    doc.setFontSize(6.5);
    doc.setFont("times", "italic");
    doc.text("Scan Profile", x + 11, y + 28.5, { align: "center" });
  } catch {
    // QR generation failed, gracefully skip
  }
}

// ─── Section Header ───────────────────────────────────────────

function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  const pageW = doc.internal.pageSize.getWidth();

  setDrawColor(doc, COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(16, y, pageW - 16, y);

  drawDiamond(doc, 16, y, 1.5, COLORS.gold);

  setTextColor(doc, COLORS.maroon);
  doc.setFontSize(11);
  doc.setFont("times", "bold");
  doc.text(title.toUpperCase(), 23, y + 6.8, { charSpace: 1.8 });

  setDrawColor(doc, COLORS.goldPale);
  doc.setLineWidth(0.2);
  doc.line(16, y + 10.5, pageW - 16, y + 10.5);

  return y + 16;
}

// ─── Info Table ───────────────────────────────────────────────

function drawInfoTable(
  doc: jsPDF,
  data: [string, string][],
  startY: number,
  startX = 16,
  colW = [70, 95]
): number {
  const pageW = doc.internal.pageSize.getWidth();
  const rowH = 9;
  let y = startY;

  data.forEach(([label, value], i) => {
    if (i % 2 === 0) {
      setFillColor(doc, COLORS.blush);
      doc.rect(16, y, pageW - 32, rowH, "F");
    }

    setTextColor(doc, COLORS.warmGray);
    doc.setFontSize(8.2);
    doc.setFont("helvetica", "normal");
    doc.text(label.toUpperCase(), startX + 3, y + 6, { charSpace: 0.3 });

    setTextColor(doc, COLORS.ink);
    doc.setFont("times", "bold");
    doc.text(value || "—", startX + colW[0], y + 6);

    setDrawColor(doc, COLORS.goldPale);
    doc.setLineWidth(0.15);
    doc.line(16, y + rowH, pageW - 16, y + rowH);

    y += rowH;
  });

  return y + 4;
}

// ─── Main Generator ───────────────────────────────────────────

export async function generateBiodataPDF(profile: Profile): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  setupFonts(doc);

  const { personal, address, contact, profession, education, family, property, partner_preferences } = profile;
  const pageW = doc.internal.pageSize.getWidth();

  drawPageBackdrop(doc);
  await drawHeader(doc, profile);

  const fullName = [personal.first_name, personal.middle_name, personal.last_name]
    .filter(Boolean)
    .join(" ");

  let y = 71;

  await drawProfilePhoto(doc, profile, y - 5);

  setTextColor(doc, COLORS.maroon);
  doc.setFontSize(20);
  doc.setFont("times", "bold");
  doc.text(fullName, 64, y + 10);

  if (profile.is_verified) {
    const nameWidth = doc.getTextWidth(fullName);
    const badgeX = 64 + nameWidth + 4;
    
    setDrawColor(doc, COLORS.verified);
    doc.setLineWidth(0.3);
    doc.roundedRect(badgeX, y + 4.5, 18, 5.5, 1, 1, "S");
    
    setTextColor(doc, COLORS.verified);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("VERIFIED", badgeX + 9, y + 8.3, { align: "center", charSpace: 0.4 });
  }

  setTextColor(doc, COLORS.goldDeep);
  doc.setFontSize(10);
  doc.setFont("times", "italic");
  doc.text(
    [personal.religion, personal.caste, personal.sub_caste].filter(Boolean).join(" • "),
    64, y + 18
  );

  setTextColor(doc, COLORS.warmGray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const age = personal.date_of_birth ? calculateAge(personal.date_of_birth) : null;
  const heightLabel = personal.height_cm ? formatHeight(personal.height_cm) : "";

  doc.text([
    [age !== null ? `Age: ${age} Years` : "", personal.marital_status?.replace("_", " ") ?? "", heightLabel]
      .filter(Boolean).join("  |  "),
    [profession.profession ?? "", education.highest_qualification ?? ""].filter(Boolean).join("  |  "),
    [address.district, address.state, address.country].filter(Boolean).join(", "),
  ], 64, y + 26);

  await drawQRCode(doc, profile.profile_id, pageW - 39, y + 4);

  y = 131;
  drawOrnamentDivider(doc, pageW / 2, y - 8, 18, COLORS.goldPale);

  // ─── Personal Details ─────────────────────────────────────
  y = drawSectionHeader(doc, "Personal Details", y);
  
  const personalData: [string, string][] = [
    ["Profile ID", profile.profile_id],
    ["Full Name", fullName],
    ["Date of Birth", personal.date_of_birth ? formatDate(personal.date_of_birth) : "—"],
    ["Place of Birth", personal.place_of_birth ?? "—"],
    ["Time of Birth", personal.time_of_birth ? formatTimeOfBirth(personal.time_of_birth) : "—"],
    ["Age", age !== null ? `${age} Years` : "—"],
    ["Height", personal.height_cm ? formatHeight(personal.height_cm) : "—"],
    ["Weight", personal.weight_kg ? `${personal.weight_kg} kg` : "—"],
    ["Blood Group", personal.blood_group ?? "—"],
    ["Complexion", personal.complexion ?? "—"],
    ["Languages Known", (personal.languages_known ?? []).join(", ") || "—"],
    ["Marital Status", personal.marital_status?.replace("_", " ") ?? "—"],
    ["Religion", personal.religion ?? "—"],
    ["Caste", personal.caste ?? "—"],
    ["Sub Caste", personal.sub_caste ?? "—"],
    ["Gothram", personal.gothram ?? "—"],
    ["Nakshatram (Star)", personal.nakshatram ?? "—"],
    ["Rashi", personal.rashi ?? "—"],
    ["Manglik", personal.manglik?.replace("_", " ") ?? "—"],
    ["Food Preference", personal.food_preference?.replace("_", " ") ?? "—"],
    ["Habits", personal.habits ?? "—"],
    ["Nationality", personal.nationality ?? "Indian"],
  ];
  y = drawInfoTable(doc, personalData, y);

  // ─── Contact Details ─────────────────────────────────────
  if (y > 240) { y = startNewPage(doc); }
  y = drawSectionHeader(doc, "Contact Details", y);
  
  const contactData: [string, string][] = [
    ["Phone", contact.phone ?? "—"],
    ["Alternative Phone", contact.alternative_phone ?? "—"],
    ["Email", contact.email ?? "—"],
  ];
  y = drawInfoTable(doc, contactData, y);

  // ─── Address ──────────────────────────────────────────────
  if (y > 240) { y = startNewPage(doc); }
  y = drawSectionHeader(doc, "Address", y);
  
  const addressData: [string, string][] = [
    ["Village / Town", [address.village, address.town].filter(Boolean).join(", ") || "—"],
    ["District", address.district ?? "—"],
    ["State", address.state ?? "—"],
    ["Country", address.country ?? "India"],
    ["Pincode", address.pincode ?? "—"],
  ];
  y = drawInfoTable(doc, addressData, y);

  // ─── Education ───────────────────────────────────────────
  if (y > 230) { y = startNewPage(doc); }
  y = drawSectionHeader(doc, "Education", y);
  
  const educationData: [string, string][] = [
    ["10th Qualification", education.qualification_10th ?? "—"],
    ["12th Qualification", education.qualification_12th ?? "—"],
    ["Highest Qualification", education.highest_qualification ?? "—"],
    ["College / Institution", education.college ?? "—"],
    ["University / Board", education.university ?? "—"],
    ["Year Passed", education.year_passed?.toString() ?? "—"],
    ["Additional Qualifications", education.additional_qualifications ?? "—"],
  ];
  y = drawInfoTable(doc, educationData, y);

  // ─── Profession ──────────────────────────────────────────
  if (y > 220) { y = startNewPage(doc); }
  y = drawSectionHeader(doc, "Profession", y);
  
  const professionData: [string, string][] = [
    ["Profession", profession.profession ?? "—"],
    ["Designation", profession.designation ?? "—"],
    ["Company Name", profession.company_name ?? "—"],
    ["Company Location", profession.company_location ?? "—"],
    ["Work Country", profession.work_country ?? "—"],
    ["Employment Type", profession.employment_type?.replace("_", " ") ?? "—"],
    ["Annual Income", profession.annual_income ? formatIncome(profession.annual_income) : "—"],
    ["Visa Status", profession.visa_status?.replace("_", " ").toUpperCase() ?? "—"],
  ];
  
  if (profession.business_details) {
    professionData.push(["Business Details", profession.business_details]);
  }
  y = drawInfoTable(doc, professionData, y);

  // ─── Family Details ───────────────────────────────────────
  if (y > 180) { y = startNewPage(doc); }
  y = drawSectionHeader(doc, "Family Details", y);
  
  const familyData: [string, string][] = [
    ["Father's Name", family.father_name ?? "—"],
    ["Father's Profession", family.father_profession ?? "—"],
    ["Mother's Name", family.mother_name ?? "—"],
    ["Mother's Profession", family.mother_profession ?? "—"],
    ["Grandfather (Father's)", family.grandfather_name_paternal ?? "—"],
    ["Grandmother (Father's)", family.grandmother_name_paternal ?? "—"],
    ["Grandfather (Mother's)", family.grandfather_name_maternal ?? "—"],
    ["Grandmother (Mother's)", family.grandmother_name_maternal ?? "—"],
    ["Brothers", `${family.brothers ?? 0} (Married: ${family.married_brothers ?? 0})`],
    ["Sisters", `${family.sisters ?? 0} (Married: ${family.married_sisters ?? 0})`],
    ["Family Property", family.family_property ?? "—"],
  ];

  (family.siblings ?? []).forEach((sibling, i) => {
    const details = [
      sibling.name,
      sibling.marital_status ? sibling.marital_status.replace(/^\w/, (c) => c.toUpperCase()) : null,
      sibling.occupation,
      sibling.education,
    ].filter(Boolean).join(", ");
    familyData.push([`Sibling ${i + 1}`, details || "—"]);
  });

  y = drawInfoTable(doc, familyData, y);

  // ─── Property Details ──────────────────────────────────────
  if (y > 210) { y = startNewPage(doc); }
  y = drawSectionHeader(doc, "Property Details", y);
  
  const propertyData: [string, string][] = [
    ["Owns Property", property?.owns_property === undefined ? "—" : property.owns_property ? "Yes" : "No"],
    ["Property Type", property?.property_type ?? "—"],
    ["Property Location", property?.property_location ?? "—"],
    ["Estimated Value", property?.property_value ? formatIncome(property.property_value) : "—"],
    ["Description", property?.property_description ?? "—"],
  ];
  y = drawInfoTable(doc, propertyData, y);

  // ─── Partner Preferences ──────────────────────────────────
  if (y > 210) { y = startNewPage(doc); }
  y = drawSectionHeader(doc, "Partner Preferences", y);
  
  const prefs = partner_preferences;
  const prefData: [string, string][] = [
    ["Age", `${prefs.age_min ?? "Any"} — ${prefs.age_max ?? "Any"} Years`],
    ["Height", prefs.height_min_cm ? `${formatHeight(prefs.height_min_cm)} — ${formatHeight(prefs.height_max_cm ?? 220)}` : "No preference"],
    ["Education", prefs.education ?? "No preference"],
    ["Profession", prefs.profession ?? "No preference"],
    ["Location", prefs.location ?? "No preference"],
    ["Religion", prefs.religion ?? "No preference"],
    ["Caste", prefs.caste ?? "No preference"],
    ["Marital Status", (prefs.marital_status ?? []).map(s => s.replace("_", " ")).join(", ") || "No preference"],
    ["Minimum Income", prefs.income_min ? formatIncome(prefs.income_min) : "No preference"],
  ];
  y = drawInfoTable(doc, prefData, y);

  // ─── Gallery Photos ───────────────────────────────────────
  const photos = [profile.images?.photo_2, profile.images?.photo_3].filter(Boolean) as string[];
  
  if (photos.length > 0) {
    if (y > 200) { y = startNewPage(doc); }

    y = drawSectionHeader(doc, "Photo Gallery", y);
    let photoX = 16;
    
    for (const photoUrl of photos) {
      const imageData = await fetchImageAsDataUrl(photoUrl);
      if (!imageData) continue;
      
      try {
        doc.addImage(imageData.dataUrl, imageData.format, photoX, y, 55, 70);
        
        setDrawColor(doc, COLORS.maroon);
        doc.setLineWidth(0.6);
        doc.rect(photoX, y, 55, 70, "S");
        
        setDrawColor(doc, COLORS.gold);
        doc.setLineWidth(0.3);
        doc.rect(photoX - 2, y - 2, 59, 74, "S");
        
        photoX += 62;
      } catch {
        // Skip specific photo if rendering fails
      }
    }
    y += 80;
  }

  // ─── Footer (Applies to all pages) ─────────────────────────
  const totalPages = doc.getNumberOfPages();
  const footH = 16;
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    setFillColor(doc, COLORS.maroon);
    doc.rect(0, pageH - footH, pageW, footH, "F");

    setDrawColor(doc, COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(0, pageH - footH, pageW, pageH - footH);

    drawDiamond(doc, pageW / 2, pageH - footH, 1.3, COLORS.gold);

    setTextColor(doc, COLORS.gold);
    doc.setFontSize(8.5);
    doc.setFont("times", "bold");
    doc.text("SAPTAPADI MATRIMONY", 16, pageH - 6, { charSpace: 0.6 });

    setTextColor(doc, [210, 190, 160]);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Page ${i} of ${totalPages}  |  Generated on ${formatDate(new Date().toISOString())}`,
      pageW - 16,
      pageH - 6,
      { align: "right" }
    );
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}