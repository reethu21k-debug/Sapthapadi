import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PlansSection } from "@/components/shared/PlansSection";
import { ShieldCheck, Sparkles, HeartHandshake, Lock, PhoneCall, HelpCircle } from "lucide-react";
import { JsonLd } from "@/components/shared/JsonLd";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { membershipPlansSchema, webPageSchema } from "@/lib/seo/schema";

const TITLE = "Membership Plans";
const DESCRIPTION =
  "Choose the perfect Saptapadi membership plan for your family's journey. Transparent pricing, bespoke relationship assistance, and zero hidden charges.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/plans" },
  openGraph: {
    title: `${TITLE} | Saptapadi Matrimonial`,
    description: DESCRIPTION,
    url: "/plans",
    type: "website",
  },
  twitter: {
    title: `${TITLE} | Saptapadi Matrimonial`,
    description: DESCRIPTION,
  },
};

const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: "100% Verified Profiles",
    desc: "Manual screening & government ID checks for every single member.",
  },
  {
    icon: Lock,
    title: "Complete Privacy Control",
    desc: "Your photos and contact details are only shared with your explicit consent.",
  },
  {
    icon: HeartHandshake,
    title: "Dedicated Assistance",
    desc: "Human relationship managers available to guide your family's decisions.",
  },
];

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <>
      <JsonLd
        data={[
          membershipPlansSchema(
            (plans ?? []).map((p) => ({
              name: p.name,
              price: p.price,
              currency: p.currency,
              description: Array.isArray(p.features) ? p.features.join(", ") : undefined,
            }))
          ),
          webPageSchema({
            path: "/plans",
            name: `${TITLE} | Saptapadi Matrimonial`,
            description: DESCRIPTION,
            breadcrumb: [{ name: "Plans", path: "/plans" }],
          }),
        ]}
      />
      <main className="bg-cream text-navy-dark min-h-screen overflow-hidden">
      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-36 pb-32 bg-navy-pattern bg-navy-dark text-white px-4">
        <div className="relative max-w-6xl mx-auto mb-8">
          <Breadcrumbs items={[{ name: "Plans", path: "/plans" }]} currentPath="/plans" />
        </div>
        {/* Ambient Glows & Multi-layered Mandala Geometry */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-gold/15 via-transparent to-sindoor/10 rounded-full blur-3xl pointer-events-none" />

        <svg
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-[550px] h-[550px] opacity-[0.06] pointer-events-none animate-[spin_120s_linear_infinite]"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="90" stroke="#C6A15B" strokeDasharray="4 4" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="75" stroke="#C6A15B" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="55" stroke="#C6A15B" strokeWidth="0.3" />
        </svg>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 backdrop-blur-md mb-6">
            <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
            <span className="text-gold text-xs font-semibold uppercase tracking-[3px] font-marcellus">
              Transparent & Sacred Offerings
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight mb-6 leading-tight">
            Invest in a Union That <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-amber-200 to-gold">
              Lasts a Lifetime
            </span>
          </h1>

          <p className="text-white/75 text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed mb-10">
            Every journey begins with trust. Choose a membership plan tailored to your family&apos;s preferences with complete transparency, zero hidden charges, and personal assistance included.
          </p>

          {/* Knot Divider */}
          <div className="flex items-center justify-center gap-3 text-gold/60" aria-hidden="true">
            <span className="h-[1px] w-16 bg-gradient-to-r from-transparent to-gold/50" />
            <span className="w-2 h-2 rotate-45 bg-sindoor ring-4 ring-sindoor/20" />
            <span className="h-[1px] w-16 bg-gradient-to-l from-transparent to-gold/50" />
          </div>
        </div>
      </section>

      {/* ================= VALUE GUARANTEES STRIP ================= */}
      <section className="relative z-10 -mt-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gold/20 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {GUARANTEES.map((item, idx) => (
              <div
                key={item.title}
                className={`flex items-start gap-4 ${
                  idx !== 0 ? "pt-6 md:pt-0 md:pl-8" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-navy-dark text-base mb-1">
                    {item.title}
                  </h2>
                  <p className="text-gray-500 text-xs font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHAT EVERY MEMBERSHIP LEADS TO ================= */}
      <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7 text-center lg:text-left order-2 lg:order-1">
            <p className="text-gold text-xs font-semibold uppercase tracking-[3px] font-marcellus mb-3">
              Beyond the Price Tag
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy-dark mb-4 leading-tight">
              Some Connections Feel Like Home
            </h2>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Whichever tier you choose, every membership is built around one outcome: a match your whole family feels good about. The plan is just the beginning of the journey.
            </p>
          </div>
          <figure className="lg:col-span-5 relative mx-auto w-full max-w-xs sm:max-w-sm rounded-3xl overflow-hidden shadow-xl border border-gold/20 order-1 lg:order-2">
            <div className="relative w-full aspect-[1085/1449]">
              <Image
                src="/Love/love-4.png"
                alt="Some connections feel like home — find yours on Saptapadi"
                fill
                sizes="(max-width: 1024px) 80vw, 30vw"
                className="object-cover"
              />
            </div>
          </figure>
        </div>
      </section>

      {/* ================= PLANS GRID SECTION ================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-0">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-serif font-bold text-navy-dark mb-3">
            Select Your Membership Tier
          </h2>
          <p className="text-gray-500 text-sm sm:text-base font-light">
            Upgrade, downgrade, or pause your membership at any stage of your matchmaking search.
          </p>
        </div>

        {/* Dynamic Shared Component */}
        <PlansSection plans={plans || []} />
      </section>

      {/* ================= CONCIERGE & FAQ ADVISORY SECTION ================= */}
      <section className="py-20 bg-gradient-to-b from-cream via-white to-cream border-t border-gold/15">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-navy-dark text-white rounded-3xl p-8 sm:p-12 border border-gold/30 shadow-2xl relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-gold/5 rounded-full blur-2xl pointer-events-none" />
            <HelpCircle className="absolute -bottom-6 -right-6 w-48 h-48 text-gold/5 pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-8 text-center lg:text-left">
                <p className="text-gold text-xs font-semibold uppercase tracking-[3px] font-marcellus mb-2">
                  Need Custom Assistance?
                </p>
                <h3 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
                  Unsure Which Plan Fits Your Family?
                </h3>
                <p className="text-white/75 text-sm sm:text-base font-light leading-relaxed mb-6 max-w-xl">
                  Our bespoke matchmaking concierge can analyze your preferences and recommend the exact tier suitable for your search. We also offer elite offline matchmaking services.
                </p>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-gold/90 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Instant Activation
                  </span>
                  <span>•</span>
                  <span>100% Refund Guarantee on Duplicate Profiles</span>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="w-full sm:w-auto lg:w-full px-8 py-4 rounded-full bg-gradient-to-r from-gold via-yellow-600 to-gold text-navy-dark font-semibold text-sm tracking-wider uppercase text-center shadow-lg hover:shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Speak to an Advisor
                </Link>

                <a
                  href="tel:+9104088889999"
                  className="w-full sm:w-auto lg:w-full px-6 py-3.5 rounded-full border border-white/20 hover:border-gold/60 text-white font-medium text-xs tracking-wide uppercase flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-gold" />
                  <span>Call +91 (040) 8888 9999</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}