import type { ReactNode } from "react";
import { AuthImageSlider } from "@/components/auth/AuthImageSlider";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-navy-pattern flex items-center justify-center overflow-hidden">
      {/* Ambient Decorative Background Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-navy/40 blur-3xl" />
      </div>

      {/* Main Responsive Grid Container */}
      <div className="relative z-10 w-full min-h-screen grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Column: Image Slider Showcase (Hidden on Mobile, Takes 6/12 columns on Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col items-center justify-center relative border-r border-white/10 bg-black/10 backdrop-blur-sm">
          <AuthImageSlider />
        </div>

        {/* Right Column: Auth Form Content (Login / Register / Forgot Password) */}
        <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-8 md:p-12 overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}