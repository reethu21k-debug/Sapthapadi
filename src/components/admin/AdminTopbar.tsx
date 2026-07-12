"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, LogOut, User, ChevronDown, Home } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import { AppUser } from "@/types";

interface Props {
  user: AppUser;
}

export function AdminTopbar({ user }: Props) {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/80 flex items-center px-6 gap-4 sticky top-0 z-40 shadow-xs transition-colors">
      {/* Search Input */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gold transition-colors" />
          <input
            type="search"
            placeholder="Search profiles, users..."
            className="w-full pl-10 pr-12 py-2 text-sm text-gray-800 placeholder-gray-400 bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all duration-200 shadow-inner"
          />
          {/* Visual Keyboard Shortcut Badge */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-200/60 border border-gray-300/60 text-[10px] font-medium text-gray-500 pointer-events-none select-none">
            <span>⌘</span>K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Exit to Public Website */}
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          aria-label="View website"
          title="View Website"
          className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 transition-colors text-xs font-semibold"
        >
          <Home className="w-4 h-4" />
          <span className="hidden lg:inline">View Website</span>
        </Link>

        <div className="h-6 w-px bg-gray-200 hidden sm:block mx-0.5" />

        {/* Notifications Button */}
        <motion.button 
          whileTap={{ scale: 0.95 }}
          aria-label="Notifications"
          className="relative p-2.5 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold ring-2 ring-white shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
        </motion.button>

        <div className="h-6 w-px bg-gray-200 hidden sm:block mx-0.5" />

        {/* User Menu Trigger */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.98 }}
            aria-expanded={userMenuOpen}
            aria-label="User profile menu"
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl hover:bg-gray-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 transition-all border border-transparent hover:border-gray-200/60"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center shadow-xs flex-shrink-0">
              <span className="text-gold-dark text-xs font-bold tracking-wider">
                {getInitials(user.full_name || user.email)}
              </span>
            </div>
            
            <div className="hidden sm:block text-left mr-1">
              <p className="text-sm font-semibold text-gray-800 leading-none">
                {user.full_name || "Admin"}
              </p>
              <p className="text-[11px] font-medium text-gray-400 mt-1 leading-none">
                Administrator
              </p>
            </div>

            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 hidden sm:block ${
                userMenuOpen ? "rotate-180 text-gray-700" : ""
              }`} 
            />
          </motion.button>

          {/* Transparent click-away backdrop */}
          {userMenuOpen && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setUserMenuOpen(false)} 
            />
          )}

          {/* Dropdown Menu */}
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-gray-200/80 shadow-xl py-1.5 z-50 overflow-hidden"
              >
                <div className="px-4 py-2.5 sm:hidden border-b border-gray-100 mb-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {user.full_name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>

                <Link
                  href="/"
                  className="sm:hidden flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Home className="w-4 h-4 text-gray-400" />
                  View Website
                </Link>

                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Account Settings
                </Link>

                <div className="h-px bg-gray-100 my-1 mx-2" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50/80 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}