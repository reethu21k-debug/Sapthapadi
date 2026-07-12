import { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { Heart } from "lucide-react";

export const metadata: Metadata = { title: "Reset Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="relative w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center shadow-gold">
            <Heart className="w-6 h-6 text-navy-dark fill-navy-dark" />
          </div>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-white">Forgot Password?</h1>
        <p className="text-white/50 mt-2 text-sm">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-luxury">
        <ForgotPasswordForm />
      </div>

      <p className="text-center mt-6 text-white/50 text-sm">
        Remember your password?{" "}
        <Link href="/login" className="text-gold hover:text-gold-light font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
