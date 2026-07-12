"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Heart, FileText, CreditCard, Bell, Heart as HeartIcon,
  CalendarHeart,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { AppUser } from "@/types";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

const NAV_ITEMS = [
  { href: "/user/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/user/profiles", icon: Users, label: "My Matches" },
  { href: "/user/favorites", icon: Heart, label: "Favourites" },
  { href: "/user/match-meetings", icon: CalendarHeart, label: "Match Meetings" },
  { href: "/user/biodata", icon: FileText, label: "My Biodata" },
  { href: "/user/subscription", icon: CreditCard, label: "Subscription" },
  { href: "/user/notifications", icon: Bell, label: "Notifications" },
];

interface SidebarProps {
  user: AppUser;
  profile: { profile_completion?: number; images?: { profile_photo?: string | null }; is_verified?: boolean } | null;
}

export function UserSidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center">
            <HeartIcon className="w-4 h-4 text-navy-dark fill-navy-dark" />
          </div>
          <span className="font-serif text-base font-bold text-navy-dark">Saptapadi</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-gold/10 text-gold border border-gold/20"
                  : "text-gray-500 hover:bg-gray-50 hover:text-navy-dark"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Profile completion */}
      {profile && (
        <div className="p-4 border-t border-gray-100">
          <div className="bg-gold/5 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Profile</span>
              <span className="text-xs font-bold text-gold">{profile.profile_completion || 0}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gold-gradient"
                style={{ width: `${profile.profile_completion || 0}%` }}
              />
            </div>
            {(profile.profile_completion || 0) < 100 && (
              <p className="text-xs text-gray-400 mt-2">Complete your profile</p>
            )}
          </div>
        </div>
      )}

      {/* User info */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
            {profile?.images?.profile_photo ? (
              <img src={profile.images.profile_photo} alt={user.full_name ? `${user.full_name}'s profile photo` : "Your profile photo"} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-gold text-xs font-bold">
                {getInitials(user.full_name || user.email)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-navy-dark text-sm font-medium truncate flex items-center gap-1">
              {user.full_name || "Member"}
              {profile?.is_verified && <VerifiedBadge size="sm" />}
            </p>
            <p className="text-gray-400 text-xs truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
