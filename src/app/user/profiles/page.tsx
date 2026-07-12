import { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileCard } from "@/components/user/ProfileCard";

export const metadata: Metadata = { title: "My Matches" };

export default async function UserProfilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accesses } = await supabase
    .from("profile_access")
    .select("*, profiles(*)")
    .eq("granted_to_user_id", user.id)
    .eq("is_active", true)
    .order("granted_at", { ascending: false });

  // Get user's favourites
  const { data: favourites } = await supabase
    .from("profile_interactions")
    .select("profile_id")
    .eq("user_id", user.id)
    .eq("interaction_type", "favourite");

  const favouriteIds = new Set((favourites || []).map((f) => f.profile_id));

  // Get user's subscription to check visibility rules
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, subscription_plans(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const profiles = (accesses || [])
    .filter((a) => a.profiles)
    .map((a) => ({
      ...(a.profiles as Record<string, unknown> & { id: string }),
      isFavourite: favouriteIds.has(String((a.profiles as Record<string, unknown>)?.id)),
      accessId: a.id,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">My Matches</h1>
        <p className="text-gray-500 text-sm mt-1">
          {profiles.length} profile{profiles.length !== 1 ? "s" : ""} shared with you
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="luxury-card p-8 sm:p-12 grid grid-cols-1 sm:grid-cols-12 gap-8 items-center text-center sm:text-left">
          <div className="sm:col-span-4 flex justify-center">
            <div className="relative w-32 sm:w-full max-w-[160px] aspect-[1085/1449] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/Love/love-8.png"
                alt="Finding the right partner isn't just about love — Saptapadi"
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
          </div>
          <div className="sm:col-span-8">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto sm:mx-0 mb-4">
              <span className="text-3xl">💝</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-navy-dark mb-2">No profiles shared yet</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto sm:mx-0">
              Our team will review your profile and share suitable matches soon. Please be patient.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <ProfileCard
              key={String(profile.id)}
              profile={profile}
              isFavourite={profile.isFavourite as boolean}
              currentUserId={user.id}
              subscription={subscription}
            />
          ))}
        </div>
      )}
    </div>
  );
}