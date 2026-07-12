import { Metadata } from "next";
import Image from "next/image";
import { ContactSection } from "@/components/shared/PublicSections";
import { Clock, MapPin, PhoneCall, ShieldCheck, Sparkles } from "lucide-react";
import { JsonLd } from "@/components/shared/JsonLd";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { contactPageSchema, webPageSchema } from "@/lib/seo/schema";

const TITLE = "Contact Our Concierge";
const DESCRIPTION =
  "Connect with our dedicated matchmaking concierge. We are here to assist your family with membership queries, verification, and profile guidance.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `${TITLE} | Saptapadi Matrimonial`,
    description: DESCRIPTION,
    url: "/contact",
    type: "website",
  },
  twitter: {
    title: `${TITLE} | Saptapadi Matrimonial`,
    description: DESCRIPTION,
  },
};

const QUICK_CONTACTS = [
  {
    icon: PhoneCall,
    title: "Dedicated Helpline",
    value: "+91 (040) 8888 9999",
    sub: "Priority support for active members",
  },
  {
    icon: Clock,
    title: "Operating Hours",
    value: "9:00 AM – 7:00 PM IST",
    sub: "Monday to Saturday",
  },
  {
    icon: MapPin,
    title: "Headquarters",
    value: "Banjara Hills, Hyderabad",
    sub: "Serving families globally",
  },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          contactPageSchema(),
          webPageSchema({
            path: "/contact",
            name: `${TITLE} | Saptapadi Matrimonial`,
            description: DESCRIPTION,
            breadcrumb: [{ name: "Contact", path: "/contact" }],
          }),
        ]}
      />
      <main className="bg-cream text-navy-dark min-h-screen overflow-hidden">
      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-36 pb-32 bg-navy-pattern bg-navy-dark text-white px-4">
        <div className="relative max-w-6xl mx-auto mb-8">
          <Breadcrumbs items={[{ name: "Contact", path: "/contact" }]} currentPath="/contact" />
        </div>
        {/* Ambient Glows & Subtle Geometry */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-gold/10 via-transparent to-sindoor/10 rounded-full blur-3xl pointer-events-none" />
        
        <svg
          className="absolute -top-12 right-1/4 w-[400px] h-[400px] opacity-[0.05] pointer-events-none animate-[spin_100s_linear_infinite]"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="90" stroke="#C6A15B" strokeDasharray="3 3" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="70" stroke="#C6A15B" strokeWidth="0.5" />
        </svg>

        <div className="relative max-w-3xl mx-auto text-center">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 backdrop-blur-md mb-6">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-gold text-xs font-semibold uppercase tracking-[3px] font-marcellus">
              Personalized Guidance
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight mb-6 leading-tight">
            We Are Here For Your <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-amber-200 to-gold">
              Family&apos;s Journey
            </span>
          </h1>

          <p className="text-white/75 text-lg sm:text-xl max-w-xl mx-auto font-light leading-relaxed mb-10">
            Whether you need assistance setting up a profile, understanding our verification process, or speaking with a relationship manager—reach out anytime.
          </p>

          {/* Knot Divider */}
          <div className="flex items-center justify-center gap-3 text-gold/60" aria-hidden="true">
            <span className="h-[1px] w-14 bg-gradient-to-r from-transparent to-gold/50" />
            <span className="w-2 h-2 rotate-45 bg-sindoor ring-4 ring-sindoor/20" />
            <span className="h-[1px] w-14 bg-gradient-to-l from-transparent to-gold/50" />
          </div>
        </div>
      </section>

      {/* ================= QUICK LOGISTICS BAR ================= */}
      <section className="relative z-10 -mt-14 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gold/20 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {QUICK_CONTACTS.map((item, idx) => (
              <div 
                key={item.title} 
                className={`flex items-start gap-4 ${idx !== 0 ? "pt-6 md:pt-0 md:pl-6" : ""}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-navy-dark text-base">
                    {item.title}
                  </h2>
                  <p className="text-gold font-medium text-sm mt-0.5">
                    {item.value}
                  </p>
                  <p className="text-gray-400 text-xs mt-1 font-light">
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= A PERSONAL WELCOME ================= */}
      <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <figure className="lg:col-span-5 relative mx-auto w-full max-w-xs sm:max-w-sm rounded-3xl overflow-hidden shadow-xl border border-gold/20">
            <div className="relative w-full aspect-[1085/1449]">
              <Image
                src="/Love/love-16.png"
                alt="Find your life partner who truly suits you, with Saptapadi"
                fill
                sizes="(max-width: 1024px) 80vw, 30vw"
                className="object-cover"
              />
            </div>
          </figure>
          <div className="lg:col-span-7 text-center lg:text-left">
            <p className="text-gold text-xs font-semibold uppercase tracking-[3px] font-marcellus mb-3">
              Before You Reach Out
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy-dark mb-4 leading-tight">
              Every Conversation Begins a New Story
            </h2>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Behind every message is a family hoping for the right introduction. Our concierge team reads each note personally, so tell us as much as you&apos;d like — we&apos;re listening.
            </p>
          </div>
        </div>
      </section>

      {/* ================= SHARED CONTACT SECTION ================= */}
      <section className="py-16 sm:py-24 relative z-0">
        <div className="max-w-7xl mx-auto">
          {/* 
            The ContactSection handles its own internal structure, 
            sitting comfortably inside our styled background wrap.
          */}
          <ContactSection />
        </div>
      </section>

      {/* ================= PRIVACY & CONFIDENTIALITY ASSURANCE ================= */}
      <section className="pb-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-navy-dark/5 via-gold/10 to-navy-dark/5 rounded-2xl p-6 sm:p-8 border border-gold/20 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-4 flex-col sm:flex-row">
            <div className="w-12 h-12 rounded-full bg-navy-dark text-gold flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-navy-dark text-lg">
                Strict Discretion & Privacy Guaranteed
              </h4>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 font-light max-w-xl leading-relaxed">
                All communications with our concierge team are strictly confidential. We never share your contact details or family inquiries without your explicit consent.
              </p>
            </div>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}