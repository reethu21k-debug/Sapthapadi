import { Metadata } from "next";
import { LegalPageShell } from "@/components/shared/LegalPageShell";
import { JsonLd } from "@/components/shared/JsonLd";
import { webPageSchema } from "@/lib/seo/schema";
import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Saptapadi collects, uses, shares, and protects your personal and profile information across our matrimonial platform.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy Policy | Saptapadi", url: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          path: "/privacy",
          name: "Privacy Policy | Saptapadi",
          description: String(metadata.description),
          breadcrumb: [{ name: "Privacy Policy", path: "/privacy" }],
        })}
      />
      <LegalPageShell
        eyebrow="Your Data, Your Trust"
        title="Privacy Policy"
        intro="This policy explains what information Saptapadi collects, how it is used, who it may be shared with, and the choices you have."
        lastUpdated="12 July 2026"
        crumbName="Privacy Policy"
        crumbPath="/privacy"
        sections={[
          {
            heading: "1. Information We Collect",
            body: (
              <p>
                We collect information you provide directly — such as your name, contact details,
                date of birth, photographs, family and educational background, and preferences —
                when you create a biodata profile, contact our team, or subscribe to a membership
                plan. We also collect limited technical data (device, browser, and usage data)
                automatically to keep the platform secure and reliable.
              </p>
            ),
          },
          {
            heading: "2. How We Use Your Information",
            body: (
              <ul className="list-disc pl-5 space-y-1">
                <li>To create and display your matrimonial biodata to prospective, verified matches.</li>
                <li>To facilitate match introductions, meetings, and communication between families.</li>
                <li>To process membership payments and provide customer support.</li>
                <li>To verify profile authenticity and maintain platform trust and safety.</li>
                <li>To send service updates, and — only with your consent — promotional messages.</li>
              </ul>
            ),
          },
          {
            heading: "3. Who We Share Information With",
            body: (
              <p>
                Profile details are shared only with other verified, active members according to
                your chosen privacy and sharing settings. We share limited data with trusted
                service providers who help us operate the platform — for example, cloud storage
                and image hosting, payment processing, and email delivery — solely to provide
                those services, under confidentiality obligations. We do not sell your personal
                information to third parties.
              </p>
            ),
          },
          {
            heading: "4. Your Choices & Rights",
            body: (
              <p>
                You may review, correct, or delete your biodata, adjust who can view your profile,
                opt out of promotional communication, and request a copy or deletion of your data
                by contacting us at{" "}
                <a href={`mailto:${siteConfig.email}`} className="text-maroon underline">
                  {siteConfig.email}
                </a>
                . We will respond within a reasonable time as required by applicable law.
              </p>
            ),
          },
          {
            heading: "5. Data Security & Retention",
            body: (
              <p>
                We use industry-standard safeguards — including encrypted storage, access
                controls, and manual verification — to protect your information. Profile data is
                retained for as long as your account is active, and for a limited period
                afterward for legal and record-keeping purposes, after which it is deleted or
                anonymized.
              </p>
            ),
          },
          {
            heading: "6. Changes to This Policy",
            body: (
              <p>
                We may update this policy from time to time to reflect changes in our practices or
                for legal reasons. Material changes will be notified on this page with an updated
                revision date.
              </p>
            ),
          },
          {
            heading: "7. Contact Us",
            body: (
              <p>
                Questions about this policy can be directed to {siteConfig.legalName} at{" "}
                <a href={`mailto:${siteConfig.email}`} className="text-maroon underline">
                  {siteConfig.email}
                </a>{" "}
                or via our <a href="/contact" className="text-maroon underline">contact page</a>.
              </p>
            ),
          },
        ]}
      />
    </>
  );
}
