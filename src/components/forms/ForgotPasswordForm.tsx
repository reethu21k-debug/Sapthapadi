"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, CheckCircle } from "lucide-react";
import { forgotPasswordSchema } from "@/lib/validations";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-white font-semibold text-lg mb-2">Email Sent!</h3>
        <p className="text-white/60 text-sm">
          Check your inbox for a password reset link. It may take a few minutes to arrive.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="text-white/70 text-sm font-medium mb-1.5 block">Email Address</label>
        <input
          {...register("email")}
          type="email"
          placeholder="your@email.com"
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60 focus:bg-white/15 transition-all"
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-gold justify-center py-3.5 disabled:opacity-60"
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
        ) : (
          "Send Reset Link"
        )}
      </button>
    </form>
  );
}
