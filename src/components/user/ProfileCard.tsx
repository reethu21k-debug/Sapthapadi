"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Heart, FileDown, Eye, MapPin, GraduationCap, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateAge, formatHeight, cn } from "@/lib/utils";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";

interface Props {
  profile: Record<string, unknown>;
  isFavourite: boolean;
  currentUserId: string;
  subscription: Record<string, unknown> | null;
}

export function ProfileCard({ profile, isFavourite: initialFav, currentUserId }: Props) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(initialFav);
  const [isDownloading, setIsDownloading] = useState(false);

  const personal = profile.personal as Record<string, unknown> | null;
  const addr = profile.address as Record<string, string> | null;
  const edu = profile.education as Record<string, string> | null;
  const prof = profile.profession as Record<string, unknown> | null;
  const images = profile.images as Record<string, string | null> | null;
  const visibility = profile.visibility as Record<string, boolean> | null;

  const fullName = [personal?.first_name, personal?.last_name].filter(Boolean).join(" ") as string;
  const age = personal?.date_of_birth ? calculateAge(String(personal.date_of_birth)) : null;

  const handleFavourite = async () => {
    try {
      const supabase = createClient();
      if (isFav) {
        await supabase
          .from("profile_interactions")
          .delete()
          .eq("user_id", currentUserId)
          .eq("profile_id", String(profile.id))
          .eq("interaction_type", "favourite");
        setIsFav(false);
        toast.success("Removed from favourites");
      } else {
        await supabase.from("profile_interactions").upsert({
          user_id: currentUserId,
          profile_id: String(profile.id),
          interaction_type: "favourite",
        });
        setIsFav(true);
        toast.success("Added to favourites!");
      }
      router.refresh();
    } catch {
      toast.error("Failed to update favourite");
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/biodata/${String(profile.id)}`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${String(profile.profile_id)}-biodata.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Biodata downloaded!");
    } catch {
      toast.error("Failed to download biodata");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="luxury-card overflow-hidden group hover:shadow-card-hover transition-all duration-300">
      {/* Photo */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
        {images?.profile_photo ? (
          <img
            src={images.profile_photo}
            alt={fullName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gold/5">
            <span className="text-5xl text-gold/30 font-serif font-bold">
              {(personal?.first_name as string)?.[0] || "?"}
            </span>
          </div>
        )}

        {/* Favourite button */}
        <button
          onClick={handleFavourite}
          className={cn(
            "absolute top-3 right-3 w-9 h-9 rounded-full border border-white/50 flex items-center justify-center backdrop-blur-sm transition-all",
            isFav
              ? "bg-red-500 border-red-400 hover:bg-red-600"
              : "bg-white/30 hover:bg-white/50"
          )}
        >
          <Heart className={cn("w-4 h-4", isFav ? "text-white fill-white" : "text-white")} />
        </button>

        {/* Profile ID badge */}
        <div className="absolute bottom-3 left-3 bg-navy-dark/80 backdrop-blur-sm rounded-lg px-2.5 py-1">
          <span className="text-gold font-mono text-xs font-semibold">{String(profile.profile_id)}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-serif text-lg font-bold text-navy-dark mb-1 flex items-center gap-1.5">
          {fullName || "—"}
          {Boolean(profile.is_verified) && <VerifiedBadge size="sm" />}
        </h3>

        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
          {age && <span>{age} yrs</span>}
          {age && !!personal?.height_cm && <span>•</span>}
          {!!personal?.height_cm && <span>{formatHeight(Number(personal.height_cm))}</span>}
          {!!personal?.gender && (
            <>
              <span>•</span>
              <span className="capitalize">{String(personal.gender)}</span>
            </>
          )}
        </div>

        <div className="space-y-2 mb-5">
          {addr?.district && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              {[addr.district, addr.state].filter(Boolean).join(", ")}
            </div>
          )}
          {edu?.highest_qualification && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <GraduationCap className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              {edu.highest_qualification}
            </div>
          )}
          {!!prof?.profession && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Briefcase className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              {String(prof.profession)}
              {!!visibility?.show_income && !!prof.annual_income && (
                <span className="text-gray-400">
                  • ₹{(Number(prof.annual_income) / 100000).toFixed(1)}L
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {!!personal?.religion && (
            <span className="bg-gold/10 text-gold-dark border border-gold/20 text-xs px-2 py-0.5 rounded-full">
              {String(personal.religion)}
            </span>
          )}
          {!!personal?.caste && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {String(personal.caste)}
            </span>
          )}
          {!!personal?.marital_status && (
            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full capitalize">
              {String(personal.marital_status).replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={`/user/profiles/${String(profile.id)}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-navy-dark text-white text-sm font-medium hover:bg-navy transition-colors"
          >
            <Eye className="w-4 h-4" /> View Profile
          </a>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gold text-gold text-sm hover:bg-gold/10 transition-colors"
            title="Download Biodata"
          >
            <FileDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}