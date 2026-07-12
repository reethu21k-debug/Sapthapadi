"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Supabase sets the session automatically when the page loads via the URL hash
  // from the recovery email. We just need to wait for it.
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
    // Also check if user already has a session (e.g. page was refreshed)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (data: ResetPasswordData) => {
    if (!sessionReady) {
      toast.error("Session not ready. Please use the link from your email.");
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (error) throw error;
      setDone(true);
      toast.success("Password updated successfully!");
      setTimeout(() => router.push("/login"), 2500);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-white font-semibold text-lg mb-2">
          Password Updated!
        </h3>
        <p className="text-white/60 text-sm">
          Redirecting you to the login page…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* New password */}
      <div>
        <label className="text-white/70 text-sm font-medium mb-1.5 block">
          New Password
        </label>
        <div className="relative">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 8 characters"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-11 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60 focus:bg-white/15 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label className="text-white/70 text-sm font-medium mb-1.5 block">
          Confirm Password
        </label>
        <div className="relative">
          <input
            {...register("confirmPassword")}
            type={showConfirm ? "text" : "password"}
            placeholder="Repeat your new password"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-11 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60 focus:bg-white/15 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
          >
            {showConfirm ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-400 text-xs mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <p className="text-white/40 text-xs">
        At least 8 characters, one uppercase letter, and one number.
      </p>

      <button
        type="submit"
        disabled={isLoading || !sessionReady}
        className="w-full btn-gold justify-center py-3.5 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Updating…
          </>
        ) : (
          "Set New Password"
        )}
      </button>

      {!sessionReady && (
        <p className="text-yellow-400/70 text-xs text-center">
          Waiting for recovery session… Make sure you opened this page from the
          password reset email.
        </p>
      )}
    </form>
  );
}
