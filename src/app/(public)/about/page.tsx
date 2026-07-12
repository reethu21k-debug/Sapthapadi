import { Metadata } from "next";
import Image from "next/image";
import { Shield, Users, Star, Heart, Sparkles, Award, CheckCircle2 } from "lucide-react";
import SevenStepsJourney from "@/components/SevenStepsJourney";
import { JsonLd } from "@/components/shared/JsonLd";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { aboutPageSchema, webPageSchema } from "@/lib/seo/schema";

// NOTE: fixed brand-name inconsistency — this page previously said "Sapthapadi"
// while the rest of the site (root layout, other pages) says "Saptapadi".
// Mismatched brand spelling across pages reads as duplicate/low-trust entities
// to search engines and confuses the Organization knowledge graph.
const TITLE = "About Us";
const DESCRIPTION =
  "Saptapadi Matrimony — established in 2023 to serve families with trust and transparency. Discover our story, values, and why families choose us for compatible, verified matchmaking.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `${TITLE} | Saptapadi Matrimony`,
    description: DESCRIPTION,
    url: "/about",
    type: "website",
  },
  twitter: {
    title: `${TITLE} | Saptapadi Matrimony`,
    description: DESCRIPTION,
  },
};

const STATS = [
  { value: "10,000+", label: "Curated Profiles", sub: "100% Manually Verified" },
  { value: "2,500+", label: "Sacred Unions", sub: "Across 15+ States" },
  { value: "98%", label: "Family Approval", sub: "Parent-First Approach" },
  { value: "3.5x", label: "Higher Match Rate", sub: "Via Dedicated Managers" },
];

const PILLARS = [
  {
    number: "01",
    icon: Heart,
    title: "Rooted in Tradition",
    body: "Taking our name from the seven sacred steps of the Hindu wedding ceremony—we believe a lifelong bond is witnessed and cherished, not casually swiped into.",
  },
  {
    number: "02",
    icon: Shield,
    title: "Uncompromising Privacy",
    body: "Every profile undergoes rigorous manual verification. Contact details are strictly shared only with active, consented members. Your family's dignity is protected.",
  },
  {
    number: "03",
    icon: Users,
    title: "Family-Centred Union",
    body: "In Indian culture, marriage unites two lineages. Our interface and process are explicitly built to welcome parents and elders at every crucial decision point.",
  },
  {
    number: "04",
    icon: Star,
    title: "Boutique Assistance",
    body: "Algorithms can only see data; humans see soul. A dedicated relationship manager acts as your family's trusted confidant throughout the matchmaking journey.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          aboutPageSchema(),
          webPageSchema({
            path: "/about",
            name: `${TITLE} | Saptapadi Matrimony`,
            description: DESCRIPTION,
            breadcrumb: [{ name: "About", path: "/about" }],
          }),
        ]}
      />
      <main className="bg-cream text-navy-dark overflow-hidden">
      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-36 pb-16 bg-navy-pattern bg-navy-dark text-white px-4">
        <div className="relative max-w-6xl mx-auto mb-8">
          <Breadcrumbs items={[{ name: "About", path: "/about" }]} currentPath="/about" />
        </div>
        {/* Animated & Multi-layered Ambient Mandala */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.07] pointer-events-none animate-[spin_120s_linear_infinite]">
          <svg viewBox="0 0 200 200" fill="none" aria-hidden="true">
            <circle cx="100" cy="100" r="95" stroke="#C6A15B" strokeDasharray="4 4" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="80" stroke="#C6A15B" strokeWidth="0.8" />
            <circle cx="100" cy="100" r="60" stroke="#C6A15B" strokeWidth="0.4" />
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15 * Math.PI) / 180;
              const x2 = 100 + 95 * Math.cos(angle);
              const y2 = 100 + 95 * Math.sin(angle);
              return (
                <line key={i} x1="100" y1="100" x2={x2} y2={y2} stroke="#C6A15B" strokeWidth="0.3" />
              );
            })}
          </svg>
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-sindoor/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 backdrop-blur-md mb-8">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-gold text-xs font-semibold uppercase tracking-[3px] font-marcellus">
              The Sapthapadi Story
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight mb-8 leading-[1.15]">
            Where Families Trust, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-amber-200 to-gold">
              Destinies Unite
            </span>
          </h1>

          <p className="text-white/75 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-light mb-12">
            Established in 2023 by retired professionals, Sapthapadi Matrimony was built on a noble vision: 
            to serve the community by helping eligible brides and grooms find their perfect, lifelong partners.
          </p>

          {/* Traditional Knot Motif */}
          <div className="flex items-center justify-center gap-4 text-gold/60" aria-hidden="true">
            <span className="h-[1px] w-20 bg-gradient-to-r from-transparent to-gold/50" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="w-2.5 h-2.5 rounded-full bg-sindoor ring-4 ring-sindoor/20" />
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            </div>
            <span className="h-[1px] w-20 bg-gradient-to-l from-transparent to-gold/50" />
          </div>
        </div>
      </section>

      {/* ================= FLOATING STATS BAR ================= */}
      <section className="relative z-10 -mt-16 max-w-6xl mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gold/20 p-8 md:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:gap-4">
            {STATS.map((stat, idx) => (
              <div 
                key={stat.label} 
                className={`pt-6 sm:pt-0 flex flex-col items-center text-center ${
                  idx !== 0 ? "lg:border-l lg:border-gray-100" : ""
                }`}
              >
                <p className="text-4xl md:text-5xl font-serif font-bold text-navy-dark mb-1">
                  {stat.value}
                </p>
                <p className="text-gold font-semibold text-sm tracking-wide mb-1">
                  {stat.label}
                </p>
                <p className="text-gray-400 text-xs font-sans">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SIGNATURE SEVEN STEPS ================= */}
      <div className="py-12">
        <SevenStepsJourney />
      </div>

      {/* ================= OUR STORY, IN TWO FRAMES ================= */}
      <section className="py-20 bg-cream border-t border-gold/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-gold text-xs font-semibold uppercase tracking-[4px] mb-3 font-marcellus">
              ✦ Where Hearts Find Home ✦
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy-dark">
              A Girl Dreams, A Family Supports, A Bond Begins
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 max-w-3xl mx-auto">
            <figure className="relative rounded-3xl overflow-hidden shadow-xl border border-gold/20">
              <div className="relative w-full aspect-[1085/1449]">
                <Image
                  src="/Love/love-13.png"
                  alt="A couple beginning their forever, a lifetime together"
                  fill
                  sizes="(max-width: 640px) 90vw, 40vw"
                  className="object-cover"
                />
              </div>
            </figure>
            <figure className="relative rounded-3xl overflow-hidden shadow-xl border border-gold/20 sm:mt-12">
              <div className="relative w-full aspect-[1085/1449]">
                <Image
                  src="/Love/love-14.png"
                  alt="A girl dreams of a partner who respects, supports, and stands by her always"
                  fill
                  sizes="(max-width: 640px) 90vw, 40vw"
                  className="object-cover"
                />
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* ================= EDITORIAL MISSION & PILLARS ================= */}
      <section className="py-24 bg-gradient-to-b from-cream via-white to-cream border-t border-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header & Editorial Callout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
            <div className="lg:col-span-7">
              <p className="text-gold text-xs font-semibold uppercase tracking-[4px] mb-3 font-marcellus">
                ✦ Our Philosophy & Mission ✦
              </p>
              <h2 className="text-4xl sm:text-5xl font-serif font-bold text-navy-dark leading-tight mb-6">
                Bridging Sacred Traditions With Modern Trust
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Over the years, marriage has become a more challenging and important aspect of life. Changing lifestyles, career priorities, and limited social networks have made it increasingly difficult for families to identify compatible matches. Recognizing this need, Sapthapadi Matrimony provides a trusted, reliable, and service-oriented platform.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                For the past three years, our primary goal has not merely been to register profiles, but to guide families in finding compatible matches with sincerity, transparency, and respect for traditional values. Our mission is to:
              </p>
              
              <div className="space-y-4 text-sm font-semibold text-navy-dark">
                {[
                  "Serve the community with honesty and dedication.",
                  "Help families find suitable life partners based on compatibility and values.",
                  "Maintain the privacy and confidentiality of member information.",
                  "Promote meaningful and lasting matrimonial relationships.",
                  "Uphold the sacred institution of marriage with trust, integrity, and compassion."
                ].map((mission, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{mission}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote Box / Curator Note */}
            <div className="lg:col-span-5 bg-navy-dark text-white p-8 sm:p-10 rounded-2xl relative overflow-hidden border border-gold/30 shadow-lg">
              <Award className="absolute -bottom-6 -right-6 w-36 h-36 text-gold/5 pointer-events-none" />
              <p className="text-gold font-serif italic text-lg mb-4">
                &ldquo;We don&apos;t just introduce individuals; we align family values, lifestyles, and astrological harmony to ensure unions that stand the test of time.&rdquo;
              </p>
              <div className="h-px w-12 bg-gold/40 my-4" />
              <p className="text-xs uppercase tracking-[2px] text-white/60 font-marcellus">
                The Sapthapadi Promise
              </p>
            </div>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PILLARS.map((v) => (
              <div
                key={v.title}
                className="group relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gold/40 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Background Watermark Number */}
                <span className="absolute right-6 top-4 text-6xl font-serif font-bold text-gray-100 group-hover:text-gold/10 transition-colors duration-300 select-none pointer-events-none">
                  {v.number}
                </span>

                <div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <v.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-navy-dark mb-3">
                    {v.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {v.body}
                  </p>
                </div>

                {/* Subtle bottom border highlight on hover */}
                <div className="w-0 group-hover:w-full h-[2px] bg-gradient-to-r from-gold to-sindoor mt-6 transition-all duration-500" />
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ================= ROYAL INVITATION CTA ================= */}
      <section className="relative py-24 bg-navy-dark text-white text-center px-4 overflow-hidden border-t border-gold/20">
        {/* Background Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(198,161,91,0.12)_0,transparent_70%)] pointer-events-none" />

        <div className="relative max-w-2xl mx-auto border border-gold/30 p-10 sm:p-14 rounded-2xl bg-navy-dark/50 backdrop-blur-sm shadow-2xl">
          {/* Decorative Corner Ornaments (CSS) */}
          <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-gold/60" />
          <span className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-gold/60" />
          <span className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-gold/60" />
          <span className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-gold/60" />

          {/* Knot Motif */}
          <div className="flex items-center justify-center gap-3 mb-6" aria-hidden="true">
            <span className="h-px w-12 bg-gold/40" />
            <span className="w-2 h-2 rotate-45 bg-sindoor ring-4 ring-sindoor/20" />
            <span className="h-px w-12 bg-gold/40" />
          </div>

          <p className="text-gold text-xs uppercase tracking-[3px] font-marcellus mb-3">
            Your Auspicious Beginning
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
            Ready to Take the First Step?
          </h2>
          <p className="text-white/70 text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed font-light">
            Register your family profile today. Let our dedicated relationship managers curate matches worthy of your legacy.
          </p>
          
          <a 
            href="/register" 
            className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-gold via-yellow-600 to-gold text-navy-dark font-medium text-sm tracking-wider uppercase shadow-lg hover:shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Create Sacred Profile
          </a>

          {/* Contact Details Grid */}
          <div className="mt-12 pt-10 border-t border-gold/20 text-white/70 text-sm grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-lg mx-auto">
            <div>
              <p className="text-gold font-serif font-bold text-lg mb-2">Sapthapadi Matrimony</p>
              <p className="leading-relaxed">
                Obuladeva Nagar<br />
                Anantapuramu-515001
              </p>
            </div>
            <div>
              <p className="text-gold font-serif font-bold text-lg mb-2">Contact Us</p>
              <p className="leading-relaxed space-y-1 flex flex-col">
                <a href="tel:9440733232" className="hover:text-gold transition-colors">+91 9440733232</a>
                <a href="tel:9866608963" className="hover:text-gold transition-colors">+91 9866608963</a>
                <a href="tel:9390855133" className="hover:text-gold transition-colors">+91 9390855133</a>
              </p>
            </div>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}