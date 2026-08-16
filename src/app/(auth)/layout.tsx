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

      {/* Main Responsive Container: stacked on mobile/tablet, grid on desktop */}
      <div className="relative z-10 w-full min-h-screen flex flex-col lg:grid lg:grid-cols-12">

        {/*
          Image Banner (below lg):
          - w-full: always edge-to-edge horizontally, on every phone/tablet width.
          - aspect-[1085/1449]: matches the source image ratio exactly, so on a
            normal portrait viewport the box IS the image shape -> true edge-to-edge.
          - max-h-[58vh] / min-h-[180px]: keeps the banner from ever taking over
            the whole screen on tall images or eating too much on short screens.
          - Extra landscape safeguard: on short/landscape phones, cap it further
            so the login form always stays reachable without excess scrolling.
          Desktop (lg+): completely unchanged from before.
        */}
        <div
          className="relative shrink-0 w-full aspect-[1085/1449] max-h-[58vh] min-h-[180px]
                     max-lg:[@media(orientation:landscape)]:max-h-[42vh]
                     max-lg:[@media(orientation:landscape)]:min-h-[160px]
                     lg:aspect-auto lg:w-auto lg:max-h-none lg:min-h-0 lg:h-auto
                     overflow-hidden lg:flex lg:col-span-6 xl:col-span-7 lg:flex-col
                     lg:items-center lg:justify-center lg:border-r border-white/10 bg-black/20"
        >
          <AuthImageSlider />
        </div>

        {/* Auth Form Content (Login / Register / Forgot Password) */}
        <div className="flex-1 min-h-0 relative z-10 lg:col-span-6 xl:col-span-5 flex items-start lg:items-center justify-center p-6 sm:p-8 md:p-12 overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}