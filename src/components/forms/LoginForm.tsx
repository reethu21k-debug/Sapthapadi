"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { loginSchema, LoginFormData } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";

// Framer Motion variants for staggering children
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  },
};

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Get user role
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      toast.success("Welcome back!");

      if (userData?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/user/dashboard");
      }
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid email or password";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="show"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 w-full"
    >
      {/* EMAIL FIELD */}
      <motion.div variants={itemVariants} className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-[0.15em] text-white/70 ml-0.5">
          Email Address
        </label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#E5C158] transition-colors duration-300 pointer-events-none" />
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            className="w-full bg-black/40 border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#E5C158] focus:bg-black/60 focus:ring-1 focus:ring-[#E5C158] transition-all duration-300"
          />
        </div>
        <AnimatePresence>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-xs ml-0.5 overflow-hidden font-light"
            >
              <span className="block pt-1">{errors.email.message}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* PASSWORD FIELD */}
      <motion.div variants={itemVariants} className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-[0.15em] text-white/70 ml-0.5">
          Password
        </label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-[#E5C158] transition-colors duration-300 pointer-events-none" />
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full bg-black/40 border border-white/15 rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#E5C158] focus:bg-black/60 focus:ring-1 focus:ring-[#E5C158] transition-all duration-300"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white transition-colors duration-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <AnimatePresence>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-xs ml-0.5 overflow-hidden font-light"
            >
              <span className="block pt-1">{errors.password.message}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* SUBMIT BUTTON */}
      <motion.div variants={itemVariants} className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C59B27] bg-[length:200%_auto] hover:bg-right text-neutral-950 font-semibold text-xs uppercase tracking-[0.2em] py-4 rounded-xl transition-all duration-500 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(229,193,88,0.15)] hover:shadow-[0_4px_25px_rgba(229,193,88,0.25)] active:scale-[0.99] overflow-hidden"
        >
          {/* Subtle inner light reflection */}
          <div className="absolute inset-0 bg-white/30 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out" />
          
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 relative z-10"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </motion.div>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative z-10"
              >
                Sign In
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    </motion.form>
  );
}