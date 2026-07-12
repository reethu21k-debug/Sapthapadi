import Image from "next/image";
import { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSection } from "@/components/shared/HeroSection";
import { HowItWorksSection } from "@/components/shared/HowItWorksSection";
import { PlansSection } from "@/components/shared/PlansSection";
import { TestimonialsSection, FAQSection, ContactSection } from "@/components/shared/PublicSections";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { InteractiveStoryCard, type SuccessStory } from "@/components/shared/InteractiveStoryCard";
import { MagneticLink } from "@/components/shared/MagneticLink";
import { JsonLd } from "@/components/shared/JsonLd";
import { faqSchema, webPageSchema } from "@/lib/seo/schema";
import { siteConfig } from "@/lib/seo/config";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  description: siteConfig.description,
  keywords: [
    "Saptapadi Matrimony",
    "premium matchmaking",
    "verified matrimonial profiles",
    "sacred unions",
    "Indian matchmaking",
    "bespoke matchmakers",
    "matrimony services"
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: siteConfig.titleDefault,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name || "Saptapadi Matrimony",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Saptapadi - Where Sacred Unions Begin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.titleDefault,
    description: siteConfig.description,
    images: ["/og-image.jpg"],
  },
};

export type { SuccessStory };

// ─── Main Page Component ───────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient();

  const [plansRes, testimonialsRes, storiesRes, faqsRes] = await Promise.all([
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("testimonials").select("*").eq("is_published", true).limit(6),
    supabase.from("success_stories").select("*").eq("is_published", true).limit(3),
    supabase.from("faqs").select("*").eq("is_published", true).order("sort_order").limit(8),
  ]);

  const plans = plansRes.data ?? [];
  const testimonials = testimonialsRes.data ?? [];
  const stories = (storiesRes.data ?? []) as SuccessStory[];
  const faqs = faqsRes.data ?? [];

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteConfig.name || "Saptapadi Matrimony",
            url: siteConfig.url || "https://www.saptapadi.com",
            potentialAction: {
              "@type": "SearchAction",
              target: `${siteConfig.url || "https://www.saptapadi.com"}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          },
          webPageSchema({
            path: "/",
            name: siteConfig.titleDefault,
            description: siteConfig.description,
          }),
          faqSchema(faqs.map((f: { question: string; answer: string }) => ({ question: f.question, answer: f.answer }))),
        ]}
      />
      <div className="min-h-screen bg-[#FDFBF7] font-sans selection:bg-[#C9982D]/30 selection:text-[#341014] text-gray-800 overflow-x-hidden">
        <style>{`
          @keyframes floatSlow {
            0%, 100% { transform: translate3d(0, 0px, 0); }
            50%      { transform: translate3d(0, -15px, 0); }
          }
          @media (prefers-reduced-motion: reduce) {
            [style*="floatSlow"] {
              animation: none !important;
            }
          }
        `}</style>

        <PublicNavbar />
        <main className="flex flex-col w-full overflow-hidden">
          <HeroSection />
          <TrustMetricsStrip />
          <SevenVowsSection />
          <LoveStorySection />
          <HowItWorksSection />
          <PlansSection plans={plans} />
          {stories.length > 0 && <SuccessStoriesSection stories={stories} />}
          {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} />}
          <FAQSection faqs={faqs} />
          <ContactSection />
        </main>
        <PublicFooter />
      </div>
    </>
  );
}

// ─── Immediate Trust Bar ───────────────────────────────────────

function TrustMetricsStrip() {
  const metrics = [
    { label: "Sacred Unions Formed", value: "12,400+" },
    { label: "Gov-ID Verified Profiles", value: "100%" },
    { label: "Bespoke Matchmakers", value: "85+" },
    { label: "Privacy & Confidentiality", value: "Tier-1" },
  ];

  return (
    <section className="relative z-10 bg-gradient-to-r from-[#1a080a] via-[#341014] to-[#1a080a] py-8 sm:py-10 border-y border-[#C9982D]/20 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C9982D]/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10 text-center">
          {metrics.map((m, idx) => (
            <ScrollReveal
              key={m.label}
              variant="fade-up"
              delay={idx * 75}
              className={`flex flex-col justify-center min-w-0 ${idx > 0 ? "pt-6 md:pt-0 md:pl-8" : ""} group`}
            >
              <dd className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E8871E] to-[#C9982D] tracking-tight mb-1.5 drop-shadow-sm group-hover:scale-105 transition-transform duration-300">
                {m.value}
              </dd>
              <dt className="text-xs sm:text-sm font-medium text-[#F7EFE1]/80 uppercase tracking-[0.15em] leading-snug">
                {m.label}
              </dt>
            </ScrollReveal>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ─── Seven Vows Thread ─────────────────────────────────────────

const VOWS = [
  { mark: "१", sanskrit: "Isham", title: "Nourishment", note: "Providing health, abundance, and care for one another through every season." },
  { mark: "२", sanskrit: "Urje", title: "Strength", note: "Growing unwavering mental, physical, and spiritual resolve together." },
  { mark: "३", sanskrit: "Rayasposhaya", title: "Prosperity", note: "Stewardship of wealth, ethics, and shared aspirations for a legacy." },
  { mark: "४", sanskrit: "Mayobhavaya", title: "Wisdom", note: "Nurturing deep mutual respect, peace, and harmony in daily life." },
  { mark: "५", sanskrit: "Prajabhyah", title: "Progeny", note: "Raising compassionate, values-driven generations imbued with love." },
  { mark: "६", sanskrit: "Ritubhyah", title: "Well-being", note: "Being each other's sanctuary through sickness, health, and aging." },
  { mark: "७", sanskrit: "Sakhya", title: "Friendship", note: "An eternal partnership rooted in unshakeable trust and joy." },
] as const;

function SevenVowsSection() {
  return (
    <section className="relative bg-[#FDFBF7] py-20 sm:py-28 md:py-36 border-b border-[#C9982D]/15 overflow-hidden z-0">
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#C9982D]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#341014]/5 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3"
        style={{ animation: "floatSlow 15s ease-in-out infinite" }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 md:mb-24">
          <ScrollReveal variant="scale-in" duration={800}>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 drop-shadow-xl">
              <Image
                src="/logo-full.png"
                alt="Saptapadi Matrimony Emblem"
                fill
                sizes="(max-width: 640px) 64px, 80px"
                className="object-contain"
                priority
              />
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={80}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#341014]/5 border border-[#341014]/10 text-[#C8631C] text-[11px] font-bold tracking-[0.25em] uppercase mb-5">
              <Sparkles className="w-3 h-3" />
              <span>सप्तपदी · The Sacred Journey</span>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={160}>
            <h2 className="text-[#341014] font-serif italic text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              Seven Steps. Seven Promises.
            </h2>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={240}>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed font-light px-2 max-w-2xl mx-auto">
              Every lasting marriage walked these seven steps together.
              At <strong className="font-semibold text-[#341014]">Saptapadi</strong>, we infuse this timeless rigor into how we discover and curate your ideal partner.
            </p>
          </ScrollReveal>
        </header>

        <div className="relative mt-12 sm:mt-20">
          <ol className="flex flex-wrap justify-center gap-x-6 gap-y-14 sm:gap-y-16 m-0 p-0 relative z-10">
            {VOWS.map((vow, i) => (
              <ScrollReveal
                key={vow.mark}
                as="li"
                variant="fade-up"
                delay={i * 80}
                duration={700}
                className="group relative flex flex-col items-center text-center p-6 sm:p-8 pt-12 sm:pt-14 rounded-2xl sm:rounded-[2rem] bg-white/70 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(52,16,20,0.05)] border border-[#C9982D]/20 hover:border-[#C9982D]/50 hover:bg-white hover:shadow-[0_12px_40px_-8px_rgba(201,152,45,0.15)] transition-all duration-500 hover:-translate-y-2 list-none w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] max-w-sm"
              >
                <div className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-[#FDFBF7] to-white border border-[#C9982D]/30 shadow-lg flex items-center justify-center text-[#C9982D] font-serif text-2xl sm:text-3xl transition-all duration-500 group-hover:scale-110 group-hover:border-[#C9982D]/80 group-hover:bg-gradient-to-b group-hover:from-[#341014] group-hover:to-[#1a080a] group-hover:text-[#F7EFE1] z-10">
                  {vow.mark}
                </div>
                
                <div className="flex flex-col items-center w-full">
                  <span className="text-[#C8631C] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] mb-3">
                    Step {i + 1} <span className="mx-1.5 opacity-40">•</span> {vow.sanskrit}
                  </span>
                  <h3 className="text-[#341014] font-serif font-bold text-lg sm:text-xl tracking-wide mb-3 transition-colors duration-300 group-hover:text-[#C8631C]">
                    {vow.title}
                  </h3>
                  <div className="w-10 h-px bg-[#C9982D]/30 mb-4 transition-all duration-300 group-hover:w-16 group-hover:bg-[#C9982D]" />
                  <p className="text-gray-600 text-xs sm:text-sm font-light leading-relaxed">
                    {vow.note}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ─── Clean Editorial Love Story Showcase ───────────────────────

function LoveStorySection() {
  return (
    <section className="relative bg-[#341014] py-20 sm:py-28 md:py-36 overflow-hidden text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] max-w-5xl bg-[#C9982D]/10 blur-[150px] pointer-events-none rounded-full" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl mx-auto mb-16 sm:mb-20">
          <ScrollReveal variant="fade-up">
            <span className="text-[#F3E5AB] text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-4 block opacity-80">
              Editorial Showcase
            </span>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={100}>
            <h2 className="text-[#F7EFE1] font-serif font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
              Where Family Heritage <br className="hidden sm:block" /> Meets Modern Romance
            </h2>
          </ScrollReveal>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 max-w-5xl mx-auto">
          {/* Card 1 */}
          <ScrollReveal variant="scale-in" duration={800}>
            <figure className="group relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 hover:border-[#C9982D]/40 transition-all duration-700 m-0 bg-[#1a080a]">
              <div className="relative w-full aspect-[1086/1449]">
                <Image
                  src="/Love/love-6.png"
                  alt="A radiant couple celebrating their union during traditional festivities"
                  fill
                  sizes="(max-width: 768px) 92vw, 500px"
                  className="object-contain group-hover:scale-[1.03] transition-transform duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a080a] via-[#1a080a]/40 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none" />
              </div>

              <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-700 ease-out flex flex-col items-center text-center">
                <span className="w-8 h-px bg-[#C9982D] mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100" />
                <p className="text-[#F7EFE1] font-serif text-lg sm:text-xl md:text-2xl font-medium tracking-wide leading-snug">
                  Some bonds are written on hearts
                </p>
              </figcaption>
            </figure>
          </ScrollReveal>

          {/* Card 2 */}
          <ScrollReveal variant="scale-in" duration={800} delay={150} className="md:mt-16">
            <figure className="group relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 hover:border-[#C9982D]/40 transition-all duration-700 m-0 bg-[#1a080a]">
              <div className="relative w-full aspect-[1086/1449]">
                <Image
                  src="/Love/love-9.png"
                  alt="A couple taking their sacred steps together"
                  fill
                  sizes="(max-width: 768px) 92vw, 500px"
                  className="object-contain group-hover:scale-[1.03] transition-transform duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a080a] via-[#1a080a]/40 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none" />
              </div>

              <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-700 ease-out flex flex-col items-center text-center">
                <span className="w-8 h-px bg-[#C9982D] mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100" />
                <p className="text-[#F7EFE1] font-serif text-lg sm:text-xl md:text-2xl font-medium tracking-wide leading-snug">
                  Find your partner, for a lifetime of togetherness
                </p>
              </figcaption>
            </figure>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ─── Success Stories Section ───────────────────────────────────

function SuccessStoriesSection({ stories }: { stories: SuccessStory[] }) {
  const [featured, ...rest] = stories;

  return (
    <section className="relative py-20 sm:py-28 md:py-36 bg-[#FDFBF7] overflow-hidden border-t border-[#C9982D]/10">
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-[#F7EFE1] to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <ScrollReveal variant="fade-up">
            <span className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#E8871E]/10 border border-[#E8871E]/20 text-[#C8631C] text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-[#E8871E] animate-pulse flex-shrink-0" />
              Real Alliances
            </span>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={100}>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#341014] mb-6 tracking-tight">
              Two Families, Now One
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={180}>
            <p className="text-gray-600 text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
              Every verified profile on Saptapadi begins with a search and ends with a legacy. Explore recent celebrations of love and alignment.
            </p>
          </ScrollReveal>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {featured && (
            <ScrollReveal
              variant="fade-up"
              duration={800}
              className={rest.length > 0 ? "md:col-span-2 lg:col-span-2 lg:row-span-1" : "md:col-span-2 lg:col-span-3"}
            >
              <div className="rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-500 bg-white border border-[#341014]/5 overflow-hidden h-full">
                <InteractiveStoryCard story={featured} imageAspect="aspect-[16/10]" featured />
              </div>
            </ScrollReveal>
          )}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-8 sm:gap-10 lg:col-span-1">
              {rest.map((story, i) => (
                <ScrollReveal key={story.id} variant="fade-up" delay={120 * (i + 1)} duration={800} className="h-full">
                  <div className="rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-500 bg-white border border-[#341014]/5 overflow-hidden h-full">
                    <InteractiveStoryCard story={story} imageAspect="aspect-[4/3]" />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-16 sm:mt-20">
          <ScrollReveal variant="fade-up" delay={200}>
            <MagneticLink
              href="/success-stories"
              className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 bg-transparent border-2 border-[#341014] text-[#341014] rounded-full font-medium tracking-wide overflow-hidden hover:text-[#F7EFE1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#341014] transition-all duration-300 shadow-md text-sm sm:text-base"
            >
              <span className="absolute inset-0 w-full h-full bg-[#341014] -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 font-semibold">Explore All Success Stories</span>
              <svg
                className="relative z-10 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </MagneticLink>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}