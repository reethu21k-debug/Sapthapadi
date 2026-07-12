import { Metadata } from "next";
import { LegalPageShell } from "@/components/shared/LegalPageShell";
import { JsonLd } from "@/components/shared/JsonLd";
import { webPageSchema } from "@/lib/seo/schema";
import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Saptapadi's refund and cancellation policy for membership plans and paid services.",
  alternates: { canonical: "/refunds" },
  openGraph: { title: "Refund Policy | Saptapadi", url: "/refunds" },
};

export default function RefundsPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          path: "/refunds",
          name: "Refund Policy | Saptapadi",
          description: String(metadata.description),
          breadcrumb: [{ name: "Refund Policy", path: "/refunds" }],
        })}
      />
      <LegalPageShell
        eyebrow="Fair & Transparent"
        title="Refund Policy"
        intro="We want every family to feel confident subscribing to Saptapadi. Here's how cancellations and refunds work."
        lastUpdated="12 July 2026"
        crumbName="Refund Policy"
        crumbPath="/refunds"
        sections={[
          {
            heading: "1. Eligibility for Refunds",
            body: (
              <p>
                Membership fees are generally non-refundable once a plan has been activated and
                profile visibility or contact-reveal features have been used. If you believe you
                were charged in error, or a paid feature was not delivered as described, contact
                us within 7 days of the transaction for review.
              </p>
            ),
          },
          {
            heading: "2. How to Request a Refund",
            body: (
              <p>
                Email{" "}
                <a href={`mailto:${siteConfig.email}`} className="text-maroon underline">
                  {siteConfig.email}
                </a>{" "}
                with your registered email/profile ID, the plan purchased, transaction date, and
                the reason for your request. Our team reviews requests on a case-by-case basis and
                will respond within 5–7 business days.
              </p>
            ),
          },
          {
            heading: "3. Approved Refunds",
            body: (
              <p>
                Where a refund is approved, it will be issued to the original payment method used
                at checkout. Processing times depend on your bank or payment provider and
                typically take 7–10 business days to reflect.
              </p>
            ),
          },
          {
            heading: "4. Cancellations",
            body: (
              <p>
                You may cancel auto-renewal of your membership at any time from your account
                settings or by contacting support; cancellation stops future billing but does not
                itself entitle you to a refund of the current billing period unless it falls under
                the eligibility criteria above.
              </p>
            ),
          },
          {
            heading: "5. Non-Refundable Circumstances",
            body: (
              <ul className="list-disc pl-5 space-y-1">
                <li>Change of mind after actively using contact-reveal or premium features.</li>
                <li>Profile suspension due to a violation of our Terms of Service.</li>
                <li>Dissatisfaction with match outcomes, which Saptapadi cannot guarantee.</li>
              </ul>
            ),
          },
        ]}
      />
    </>
  );
}
