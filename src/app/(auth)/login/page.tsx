import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Sign In | Saptapadi",
  description: "Sign in to continue your journey to finding your eternal companion.",
};

export default function LoginPage() {
  return (
    <div className="relative w-full max-w-md mx-auto px-6 py-12 flex flex-col justify-center min-h-screen animate-fade-in">
      {/* Ambient champagne background glow for luxury depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#E5C158]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5C158]/10 border border-[#E5C158]/20 text-[#E5C158] text-[11px] font-medium tracking-[0.2em] uppercase mb-6 backdrop-blur-md">
          <Sparkles className="w-3 h-3" />
          <span>Welcome Back</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-white tracking-tight leading-snug">
          Sign In to <span className="italic font-light text-[#E5C158]">Saptapadi</span>
        </h1>
        
        <p className="text-white/60 mt-2.5 text-xs sm:text-sm tracking-wide font-light max-w-xs mx-auto leading-relaxed">
          Continue your sacred journey toward finding your eternal companion.
        </p>
      </div>

      {/* Main Form Container - Sleek & Minimalist */}
      <div className="relative z-10 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-7 sm:p-9 shadow-2xl">
        <LoginForm />

        {/* Security & Recovery Actions */}
        <div className="mt-7 pt-6 border-t border-white/10 flex items-center justify-between text-xs tracking-wider">
          <div className="flex items-center gap-1.5 text-white/50 font-light">
            <ShieldCheck className="w-4 h-4 text-[#E5C158]" />
            <span>Encrypted & Secure</span>
          </div>
          
          <Link
            href="/forgot-password"
            className="text-white/70 hover:text-[#E5C158] transition-colors duration-200 font-light"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="text-center mt-8 relative z-10">
        <p className="text-white/50 text-xs tracking-wide font-light">
          Don&apos;t have a profile yet?{" "}
          <Link 
            href="/register" 
            className="inline-flex items-center gap-1 text-[#E5C158] hover:text-white font-medium ml-1 transition-colors duration-200 group"
          >
            <span>Begin your journey</span>
            <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </p>
      </div>
    </div>
  );
}