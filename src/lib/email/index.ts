import nodemailer from "nodemailer";
import { EmailData, EmailTemplate } from "@/types";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── Email Templates ──────────────────────────────────────────

const BASE_STYLES = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
    body { margin: 0; padding: 0; background-color: #f0ede8; font-family: 'Inter', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #2A0A0F 0%, #5A0F1D 60%, #D4AF37 100%); padding: 40px 30px; text-align: center; }
    .logo-text { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 700; color: #D4AF37; letter-spacing: 3px; margin: 0; }
    .logo-sub { color: rgba(255,255,255,0.7); font-size: 12px; letter-spacing: 4px; text-transform: uppercase; margin-top: 5px; }
    .divider { height: 3px; background: linear-gradient(90deg, transparent, #D4AF37, transparent); margin: 0; }
    .body { padding: 40px 40px; background: #ffffff; }
    .title { font-family: 'Cormorant Garamond', serif; font-size: 28px; color: #2A0A0F; font-weight: 700; margin: 0 0 10px 0; }
    .subtitle { color: #666; font-size: 14px; margin: 0 0 30px 0; }
    .info-box { background: linear-gradient(135deg, #f8f5f0, #fff); border: 1px solid #e8d9c0; border-left: 4px solid #D4AF37; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
    .info-label { color: #666; font-weight: 500; }
    .info-value { color: #2A0A0F; font-weight: 600; }
    .button { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #D4AF37, #F4D78C); color: #2A0A0F; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; margin: 20px 0; }
    .footer { background: #2A0A0F; padding: 30px; text-align: center; }
    .footer-text { color: rgba(255,255,255,0.5); font-size: 12px; }
    .footer-brand { color: #D4AF37; font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 700; margin-bottom: 10px; }
    .ornament { color: #D4AF37; font-size: 20px; margin: 0 10px; }
  </style>
`;

const HEADER = `
  <div class="header">
    <p class="logo-text">सप्तपदी</p>
    <p class="logo-text" style="font-size: 24px; margin-top: -5px;">SAPTAPADI</p>
    <p class="logo-sub">Where Souls Unite</p>
  </div>
  <div class="divider"></div>
`;

const FOOTER = `
  <div class="divider"></div>
  <div class="footer">
    <div class="footer-brand">SAPTAPADI</div>
    <p class="footer-text">
      <span class="ornament">✦</span>
      This is an automated email. Please do not reply directly to this email.
      <span class="ornament">✦</span>
    </p>
    <p class="footer-text">© ${new Date().getFullYear()} Saptapadi Matrimony. All rights reserved.</p>
  </div>
`;

function wrapEmail(content: string): string {
  return `<!DOCTYPE html><html><head>${BASE_STYLES}</head><body><div class="container">${HEADER}<div class="body">${content}</div>${FOOTER}</div></body></html>`;
}

// Template generators
function getTemplate(template: EmailTemplate, data: Record<string, unknown>): { subject: string; html: string } {
  switch (template) {
    case "registration":
      return {
        subject: "Welcome to Saptapadi — Your Journey Begins ✦",
        html: wrapEmail(`
          <p class="title">Welcome, ${data.name}!</p>
          <p class="subtitle">Your registration has been received. Our team will review and activate your profile shortly.</p>
          <div class="info-box">
            <div class="info-row"><span class="info-label">Profile ID</span><span class="info-value">${data.profile_id}</span></div>
            <div class="info-row"><span class="info-label">Email</span><span class="info-value">${data.email}</span></div>
            <div class="info-row"><span class="info-label">Status</span><span class="info-value">Pending Review</span></div>
          </div>
          <p style="color: #555; line-height: 1.8;">We'll notify you once your profile is approved. This usually takes 24-48 hours.</p>
          <p style="color: #D4AF37; font-family: 'Cormorant Garamond', serif; font-size: 18px; margin-top: 30px;">
            ✦ May your search be fruitful ✦
          </p>
        `),
      };

    case "profile_approved":
      return {
        subject: "Your Saptapadi Profile is Approved ✓",
        html: wrapEmail(`
          <p class="title">Profile Approved!</p>
          <p class="subtitle">Congratulations! Your profile has been reviewed and approved.</p>
          <div class="info-box">
            <div class="info-row"><span class="info-label">Profile ID</span><span class="info-value">${data.profile_id}</span></div>
            <div class="info-row"><span class="info-label">Status</span><span class="info-value" style="color: #16a34a;">✓ Approved</span></div>
          </div>
          <p style="color: #555; line-height: 1.8;">You can now log in to view profiles that have been shared with you by our team.</p>
          <a class="button" href="${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard">View Dashboard</a>
        `),
      };

    case "profile_rejected":
      return {
        subject: "Regarding Your Saptapadi Profile",
        html: wrapEmail(`
          <p class="title">Profile Update Required</p>
          <p class="subtitle">We have reviewed your profile and require some changes.</p>
          <div class="info-box">
            <div class="info-row"><span class="info-label">Profile ID</span><span class="info-value">${data.profile_id}</span></div>
            <div class="info-row"><span class="info-label">Reason</span><span class="info-value">${data.reason}</span></div>
          </div>
          <p style="color: #555; line-height: 1.8;">Please contact our team for assistance with updating your profile.</p>
          <a class="button" href="${process.env.NEXT_PUBLIC_APP_URL}/contact">Contact Us</a>
        `),
      };

    case "profile_verified":
      return {
        subject: "Your Saptapadi Profile is Now Verified ✓",
        html: wrapEmail(`
          <p class="title">You're Verified!</p>
          <p class="subtitle">Our team has confirmed your details and added the Verified badge to your profile.</p>
          <div class="info-box">
            <div class="info-row"><span class="info-label">Profile ID</span><span class="info-value">${data.profile_id}</span></div>
            <div class="info-row"><span class="info-label">Verification</span><span class="info-value" style="color: #2563eb;">✓ Verified</span></div>
          </div>
          <p style="color: #555; line-height: 1.8;">The Verified badge now appears on your profile everywhere it's shown, helping build trust with potential matches.</p>
          <a class="button" href="${process.env.NEXT_PUBLIC_APP_URL}/user/biodata">View My Profile</a>
        `),
      };

    case "subscription_activated":
      return {
        subject: "Subscription Activated — Saptapadi ✦",
        html: wrapEmail(`
          <p class="title">Subscription Activated!</p>
          <p class="subtitle">Your subscription is now active. Begin your journey!</p>
          <div class="info-box">
            <div class="info-row"><span class="info-label">Plan</span><span class="info-value">${data.plan}</span></div>
            <div class="info-row"><span class="info-label">Amount Paid</span><span class="info-value">₹${data.amount}</span></div>
            <div class="info-row"><span class="info-label">Valid Until</span><span class="info-value">${data.expiry_date}</span></div>
            <div class="info-row"><span class="info-label">Profile Views</span><span class="info-value">${data.view_limit || 'Unlimited'}</span></div>
          </div>
          <a class="button" href="${process.env.NEXT_PUBLIC_APP_URL}/user/dashboard">Start Exploring</a>
        `),
      };

    case "subscription_expiring":
      return {
        subject: `Your Saptapadi Subscription Expires in ${data.days} Days`,
        html: wrapEmail(`
          <p class="title">Subscription Expiring Soon</p>
          <p class="subtitle">Your subscription will expire in ${data.days} days. Renew now to continue your journey.</p>
          <div class="info-box">
            <div class="info-row"><span class="info-label">Plan</span><span class="info-value">${data.plan}</span></div>
            <div class="info-row"><span class="info-label">Expiry Date</span><span class="info-value">${data.expiry_date}</span></div>
            <div class="info-row"><span class="info-label">Days Remaining</span><span class="info-value" style="color: #d97706;">${data.days} days</span></div>
          </div>
          <a class="button" href="${process.env.NEXT_PUBLIC_APP_URL}/user/subscription">Renew Now</a>
        `),
      };

    case "subscription_expired":
      return {
        subject: "Your Saptapadi Subscription Has Expired",
        html: wrapEmail(`
          <p class="title">Subscription Expired</p>
          <p class="subtitle">Your subscription has ended. Renew to continue accessing profiles.</p>
          <a class="button" href="${process.env.NEXT_PUBLIC_APP_URL}/plans">View Plans</a>
        `),
      };

    case "password_reset":
      return {
        subject: "Reset Your Saptapadi Password",
        html: wrapEmail(`
          <p class="title">Password Reset</p>
          <p class="subtitle">You requested a password reset. Click the button below to set a new password.</p>
          <a class="button" href="${data.reset_url}">Reset Password</a>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        `),
      };

    case "profile_shared":
      return {
        subject: "New Profiles Shared With You — Saptapadi ✦",
        html: wrapEmail(`
          <p class="title">New Profiles Shared!</p>
          <p class="subtitle">Our team has shared new profiles with you. Log in to view them.</p>
          <div class="info-box">
            <div class="info-row"><span class="info-label">Profiles Shared</span><span class="info-value">${data.count} profile(s)</span></div>
            <div class="info-row"><span class="info-label">By</span><span class="info-value">Saptapadi Team</span></div>
          </div>
          <a class="button" href="${process.env.NEXT_PUBLIC_APP_URL}/user/profiles">View Profiles</a>
        `),
      };

    case "biodata_generated":
      return {
        subject: "Your Biodata is Ready — Saptapadi",
        html: wrapEmail(`
          <p class="title">Biodata Generated!</p>
          <p class="subtitle">Your premium biodata PDF has been generated and is ready for download.</p>
          <a class="button" href="${process.env.NEXT_PUBLIC_APP_URL}/user/biodata">Download Biodata</a>
        `),
      };

    default:
      return {
        subject: "Notification from Saptapadi",
        html: wrapEmail(`<p class="title">Notification</p><p>You have a new notification from Saptapadi.</p>`),
      };
  }
}

// ─── Send Email ────────────────────────────────────────────────

export async function sendEmail(emailData: EmailData): Promise<void> {
  const { subject, html } = getTemplate(
    emailData.template,
    { name: emailData.name, ...emailData.data }
  );

  await transporter.sendMail({
    from: `"Saptapadi Matrimony" <${process.env.GMAIL_USER}>`,
    to: emailData.to,
    subject,
    html,
  });
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
