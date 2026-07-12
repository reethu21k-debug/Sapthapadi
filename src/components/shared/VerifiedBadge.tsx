import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** Compact = icon only (for tight spaces like table rows/cards). */
  size?: "sm" | "md";
  /** Show the "Verified" text label next to the icon. */
  withLabel?: boolean;
  className?: string;
}

/**
 * The trust badge shown next to a profile's name wherever it appears —
 * admin tables, admin detail view, user match cards, user profile detail,
 * biodata preview, etc. Backed by `profiles.is_verified`.
 */
export function VerifiedBadge({ size = "md", withLabel = false, className }: Props) {
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  if (!withLabel) {
    return (
      <span
        className={cn("inline-flex items-center text-[#C8631C] transition-transform hover:scale-110", className)}
        title="Verified by Saptapadi Concierge"
      >
        <BadgeCheck className={cn(iconSize, "fill-[#F3E5AB] text-[#C8631C]")} strokeWidth={2.2} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#C9982D]/30 bg-[#E8871E]/10 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-[#C8631C] shadow-2xs backdrop-blur-xs",
        className
      )}
      title="Verified by Saptapadi Concierge"
    >
      <BadgeCheck className={cn(iconSize, "fill-[#F3E5AB] text-[#C8631C] shrink-0")} strokeWidth={2.2} />
      <span>Verified</span>
    </span>
  );
}