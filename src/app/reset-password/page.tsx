import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set New Password",
  description: "Create a new password for your Saptapadi account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen bg-navy-pattern flex items-center justify-center overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-navy/30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full min-h-screen grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Portrait Showcase Image (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 items-center justify-center p-10 border-r border-white/10 bg-black/10 backdrop-blur-sm">
          <div className="relative w-full max-w-[420px] aspect-[1085/1449] rounded-3xl overflow-hidden shadow-luxury">
            <Image
              src="/Love/love-10.png"
              alt="The right partner makes every moment meaningful — Saptapadi"
              fill
              sizes="50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Right Column: Reset Password Form */}
        <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-8 md:p-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-3 group mb-4">
                <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center shadow-gold">
                  <Heart className="w-6 h-6 text-navy-dark fill-navy-dark" />
                </div>
              </Link>
              <h1 className="font-serif text-3xl font-bold text-white">
                Set New Password
              </h1>
              <p className="text-white/50 mt-2 text-sm">
                Choose a strong password for your account
              </p>
            </div>

            {/* Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-luxury">
              <ResetPasswordForm />
            </div>

            <p className="text-center mt-6 text-white/50 text-sm">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-gold hover:text-gold-light font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
