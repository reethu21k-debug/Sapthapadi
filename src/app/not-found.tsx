import Link from "next/link";
import { Heart } from "lucide-react";
import { Metadata } from "next";

// 404s must be noindex so search engines don't waste crawl budget on, or
// index, an empty/error page — this was previously unset and inherited the
// site-wide `index: true` default.
export const metadata: Metadata = {
  title: "404 - Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-pattern flex items-center justify-center p-4 selection:bg-gold/30 selection:text-navy-dark">
      <div className="text-center max-w-2xl mx-auto animate-fade-in-up">
        {/* Subtle pulsing glow for the premium icon container */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gold-gradient flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(212,175,55,0.3)] animate-[pulse_4s_ease-in-out_infinite]">
          <Heart 
            className="w-10 h-10 sm:w-12 sm:h-12 text-navy-dark fill-navy-dark" 
            aria-hidden="true"
          />
        </div>

        <p className="text-gold text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] mb-4">
          Error 404
        </p>
        
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
          A Minor Detour on Your Journey
        </h1>
        
        <p className="text-white/70 text-base sm:text-lg max-w-md mx-auto mb-10 font-light leading-relaxed">
          Like finding the perfect match, sometimes we take a wrong turn. The page you are looking for has been moved or no longer exists.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/" 
            className="btn-gold py-3.5 px-8 w-full sm:w-auto text-center"
          >
            Return to Homepage
          </Link>
          <Link 
            href="/contact" 
            className="py-3.5 px-8 w-full sm:w-auto text-center border border-white/20 text-white rounded-full hover:bg-white hover:text-navy-dark transition-all duration-300 font-semibold text-sm"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}