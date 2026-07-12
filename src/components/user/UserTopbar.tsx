"use client";

import { Bell, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { AppUser } from "@/types";
import { getDaysRemaining, PLAN_LABELS } from "@/lib/utils";

interface Props {
  user: AppUser;
  subscription: Record<string, unknown> | null;
  unreadCount: number;
}

export function UserTopbar({ subscription, unreadCount }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  };

  const daysLeft = subscription?.expiry_date
    ? getDaysRemaining(String(subscription.expiry_date))
    : null;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-40">
      {/* Subscription status */}
      {subscription ? (
        <div className="flex items-center gap-2">
          <span className="badge badge-gold text-xs">
            {PLAN_LABELS[subscription.plan as string] || String(subscription.plan)} Plan
          </span>
          {daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
            <span className="badge badge-yellow text-xs">
              {daysLeft}d left
            </span>
          )}
        </div>
      ) : (
        <Link href="/user/subscription" className="badge badge-gray text-xs hover:bg-gold/10 hover:text-gold">
          No Active Plan — Upgrade
        </Link>
      )}

      <div className="flex items-center gap-3 ml-auto">
        <Link
          href="/user/notifications"
          className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gold text-navy-dark text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-2 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
