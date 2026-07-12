"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, User, Mail, Phone, Lock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { registerSchema, RegisterFormData } from "@/lib/validations";
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
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Pass phone + full_name in metadata so the DB trigger can pick them up,
      // and so we can update the users row immediately after signup.
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name, phone: data.phone },
        },
      });

      if (error) throw error;

      // The handle_new_user trigger creates the public.users row immediately.
      // Update the phone field now that we have the user id.
      if (authData.user) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ phone: data.phone })
          .eq("id", authData.user.id);

        // Non-fatal: phone save failure shouldn't block registration
        if (updateError) {
          console.warn("Could not save phone number:", updateError.message);
        }
      }

      toast.success("Account created! Please check your email to verify.");
      router.push("/login");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses =
    "w-full bg-white/[0.06] border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 focus:bg-white/[0.12] focus:ring-4 focus:ring-gold/10 transition-all duration-300 backdrop-blur-md";
  const labelClasses = "text-white/80 text-sm font-medium ml-1 tracking-wide block mb-1.5";
  const iconClasses =
    "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-gold transition-colors duration-300";

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="show"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 w-full max-w-sm mx-auto"
    >
      {/* FULL NAME FIELD */}
      <motion.div variants={itemVariants}>
        <label className={labelClasses}>Full Name</label>
        <div className="relative group">
          <User className={iconClasses} />
          <input
            {...register("full_name")}
            type="text"
            placeholder="Priya Sharma"
            className={inputClasses}
          />
        </div>
        <AnimatePresence>
          {errors.full_name && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-xs ml-1 overflow-hidden"
            >
              <span className="block pt-1">{errors.full_name.message}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* EMAIL FIELD */}
      <motion.div variants={itemVariants}>
        <label className={labelClasses}>Email Address</label>
        <div className="relative group">
          <Mail className={iconClasses} />
          <input
            {...register("email")}
            type="email"
            placeholder="priya@email.com"
            className={inputClasses}
          />
        </div>
        <AnimatePresence>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-xs ml-1 overflow-hidden"
            >
              <span className="block pt-1">{errors.email.message}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* PHONE FIELD */}
      <motion.div variants={itemVariants}>
        <label className={labelClasses}>Phone Number</label>
        <div className="relative group">
          <Phone className={iconClasses} />
          <input
            {...register("phone")}
            type="tel"
            placeholder="9876543210"
            className={inputClasses}
          />
        </div>
        <AnimatePresence>
          {errors.phone && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-xs ml-1 overflow-hidden"
            >
              <span className="block pt-1">{errors.phone.message}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* PASSWORD FIELD */}
      <motion.div variants={itemVariants}>
        <label className={labelClasses}>Password</label>
        <div className="relative group">
          <Lock className={iconClasses} />
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Min 8 chars, 1 uppercase"
            className={`${inputClasses} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white/90 hover:bg-white/10 rounded-lg transition-all duration-200"
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
              className="text-red-400 text-xs ml-1 overflow-hidden"
            >
              <span className="block pt-1">{errors.password.message}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* CONFIRM PASSWORD FIELD */}
      <motion.div variants={itemVariants}>
        <label className={labelClasses}>Confirm Password</label>
        <div className="relative group">
          <ShieldCheck className={iconClasses} />
          <input
            {...register("confirm_password")}
            type="password"
            placeholder="Re-enter password"
            className={inputClasses}
          />
        </div>
        <AnimatePresence>
          {errors.confirm_password && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-xs ml-1 overflow-hidden"
            >
              <span className="block pt-1">{errors.confirm_password.message}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* TERMS & CONDITIONS */}
      <motion.p variants={itemVariants} className="text-white/40 text-xs leading-relaxed ml-1 pt-1">
        By registering, you agree to our{" "}
        <a href="/terms" className="text-gold/70 hover:text-gold transition-colors">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-gold/70 hover:text-gold transition-colors">
          Privacy Policy
        </a>
        .
      </motion.p>

      {/* SUBMIT BUTTON */}
      <motion.div variants={itemVariants} className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#C8A050] via-[#D4B26A] to-[#C8A050] bg-[length:200%_auto] hover:bg-right text-navy-dark font-semibold py-4 rounded-2xl transition-all duration-500 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(200,160,80,0.2)] hover:shadow-[0_0_30px_rgba(200,160,80,0.4)] overflow-hidden"
        >
          {/* Subtle inner light reflection */}
          <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out" />
          
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 relative z-10"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating account...</span>
              </motion.div>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative z-10"
              >
                Create Account
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    </motion.form>
  );
}