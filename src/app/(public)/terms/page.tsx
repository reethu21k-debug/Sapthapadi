import { Metadata } from "next";
import { LegalPageShell } from "@/components/shared/LegalPageShell";
import { JsonLd } from "@/components/shared/JsonLd";
import { webPageSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions governing use of the Saptapadi matrimonial platform, membership plans, and profile listings.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms of Service | Saptapadi", url: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          path: "/terms",
          name: "Terms of Service | Saptapadi",
          description: String(metadata.description),
          breadcrumb: [{ name: "Terms of Service", path: "/terms" }],
        })}
      />
      <LegalPageShell
        eyebrow="Please Read Carefully"
        title="Terms of Service"
        intro="These terms govern your access to and use of Saptapadi. By creating a profile or purchasing a membership, you agree to the terms below."
        lastUpdated="12 July 2026"
        crumbName="Terms of Service"
        crumbPath="/terms"
        sections={[
          {
            heading: "1. Eligibility",
            body: (
              <p>
                Saptapadi is intended for individuals of legal marriageable age under applicable
                law who are genuinely seeking a matrimonial match for themselves or, with consent,
                on behalf of an immediate family member. Profiles must be truthful, current, and
                created with the knowledge and consent of the individual featured.
              </p>
            ),
          },
          {
            heading: "2. Profile Accuracy & Verification",
            body: (
              <p>
                Members are responsible for the accuracy of the biodata, photographs, and
                documents they submit. Saptapadi performs manual verification checks but does not
                guarantee the accuracy of information provided by members, and is not a party to
                and does not endorse any match, introduction, or subsequent relationship.
              </p>
            ),
          },
          {
            heading: "3. Membership & Payments",
            body: (
              <p>
                Paid membership plans unlock additional features such as expanded contact reveals,
                priority support, or relationship manager assistance, as described on our{" "}
                <a href="/plans" className="text-maroon underline">Membership Plans</a> page.
                Fees are payable in advance and are non-transferable between accounts. See our{" "}
                <a href="/refunds" className="text-maroon underline">Refund Policy</a> for
                cancellation and refund terms.
              </p>
            ),
          },
          {
            heading: "4. Acceptable Use",
            body: (
              <ul className="list-disc pl-5 space-y-1">
                <li>No fraudulent, misleading, defamatory, or offensive content or conduct.</li>
                <li>No harassment, solicitation, or commercial advertising directed at other members.</li>
                <li>No scraping, automated data collection, or reverse engineering of the platform.</li>
                <li>No creation of duplicate or impersonating profiles.</li>
              </ul>
            ),
          },
          {
            heading: "5. Suspension & Termination",
            body: (
              <p>
                We may suspend or remove any profile that violates these terms, contains false
                information, or is reported for misconduct, at our reasonable discretion and,
                where practical, with notice to the member.
              </p>
            ),
          },
          {
            heading: "6. Limitation of Liability",
            body: (
              <p>
                Saptapadi facilitates introductions between members but cannot guarantee the
                outcome, safety, or suitability of any match. Members are strongly encouraged to
                independently verify details and exercise reasonable caution before meeting in
                person or sharing sensitive personal or financial information.
              </p>
            ),
          },
          {
            heading: "7. Governing Law",
            body: (
              <p>
                These terms are governed by the laws of India, and any disputes are subject to the
                exclusive jurisdiction of the courts of Hyderabad, Telangana.
              </p>
            ),
          },
        ]}
      />
    </>
  );
}
