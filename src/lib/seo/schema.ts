/**
 * JSON-LD structured data builders (Schema.org).
 *
 * Each function returns a plain object ready to be serialized into a
 * <script type="application/ld+json"> tag via <JsonLd /> — never build
 * schema by string-concatenating JSON, since escaping mistakes there are
 * a common cause of invalid structured data in Search Console.
 */

import { absoluteUrl, siteConfig } from "./config";

type BreadcrumbItem = { name: string; path: string };

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logo-full.png"),
    },
    foundingDate: siteConfig.foundingDate,
    address: {
      "@type": "PostalAddress",
      ...siteConfig.address,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: siteConfig.telephone,
        contactType: "customer support",
        email: siteConfig.email,
        areaServed: "IN",
        availableLanguage: ["en", "te", "hi"],
      },
    ],
    ...(siteConfig.sameAs.length ? { sameAs: siteConfig.sameAs } : {}),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    inLanguage: "en-IN",
  };
}

export function webPageSchema(opts: {
  path: string;
  name: string;
  description: string;
  breadcrumb?: BreadcrumbItem[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl(opts.path)}#webpage`,
    url: absoluteUrl(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": `${siteConfig.url}/#website` },
    about: { "@id": `${siteConfig.url}/#organization` },
    inLanguage: "en-IN",
    ...(opts.breadcrumb
      ? { breadcrumb: { "@id": `${absoluteUrl(opts.path)}#breadcrumb` } }
      : {}),
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[], path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(path)}#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${absoluteUrl("/contact")}#webpage`,
    url: absoluteUrl("/contact"),
    name: "Contact Saptapadi",
    about: { "@id": `${siteConfig.url}/#organization` },
  };
}

export function aboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${absoluteUrl("/about")}#webpage`,
    url: absoluteUrl("/about"),
    name: "About Saptapadi",
    mainEntity: { "@id": `${siteConfig.url}/#organization` },
  };
}

/** Membership plans -> Product/Offer schema (used on /plans). */
export function membershipPlansSchema(
  plans: { name: string; price: number | string; currency?: string; description?: string | null }[]
) {
  if (!plans.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: plans.map((plan, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: `Saptapadi ${plan.name} Membership`,
        description: plan.description || `${plan.name} membership plan on Saptapadi matrimony.`,
        brand: { "@type": "Brand", name: siteConfig.name },
        offers: {
          "@type": "Offer",
          price: plan.price,
          priceCurrency: plan.currency || "INR",
          availability: "https://schema.org/InStock",
          url: absoluteUrl("/plans"),
        },
      },
    })),
  };
}

/** Success stories -> Review schema (used on /success-stories). */
export function successStoriesSchema(
  stories: { coupleNames: string; story: string; datePublished?: string }[]
) {
  if (!stories.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: stories.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Review",
        reviewBody: s.story,
        author: { "@type": "Person", name: s.coupleNames },
        itemReviewed: { "@id": `${siteConfig.url}/#organization` },
        datePublished: s.datePublished,
      },
    })),
  };
}
