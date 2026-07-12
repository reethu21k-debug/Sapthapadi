import { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileCard } from "@/components/user/ProfileCard";
import { Heart } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Favourite Profiles" };

export default async function FavouritesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: favourites } = await supabase
    .from("profile_interactions")
    .select("*, profiles(*)")
    .eq("user_id", user.id)
    .eq("interaction_type", "favourite")
    .order("created_at", { ascending: false });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, subscription_plans(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const profiles = (favourites || [])
    .filter((f) => f.profiles)
    .map((f) => ({ ...(f.profiles as Record<string, unknown> & { id: string }), isFavourite: true }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Favourite Profiles</h1>
        <p className="text-gray-500 text-sm mt-1">
          {profiles.length} saved profile{profiles.length !== 1 ? "s" : ""}
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="luxury-card p-8 sm:p-12 grid grid-cols-1 sm:grid-cols-12 gap-8 items-center text-center sm:text-left">
          <div className="sm:col-span-5 flex justify-center gap-3">
            <div className="relative w-20 sm:w-full max-w-[120px] aspect-[1122/1402] rounded-xl overflow-hidden shadow-lg -rotate-3">
              <Image
                src="/login.png"
                alt="Find your life partner with Saptapadi"
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
            <div className="relative w-20 sm:w-full max-w-[120px] aspect-[1122/1402] rounded-xl overflow-hidden shadow-lg rotate-3 mt-6">
              <Image
                src="/login1.png"
                alt="Finding your right partner isn't just about love — Saptapadi"
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
          </div>
          <div className="sm:col-span-7">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto sm:mx-0 mb-4">
              <Heart className="w-8 h-8 text-gold/40" />
            </div>
            <h2 className="font-serif text-xl font-bold text-navy-dark mb-2">No favourites yet</h2>
            <p className="text-gray-500 text-sm max-w-xs mx-auto sm:mx-0 mb-5">
              Browse your matches and heart the profiles you like to save them here.
            </p>
            <Link href="/user/profiles" className="btn-gold">
              Browse Matches
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <ProfileCard
              key={String(profile.id)}
              profile={profile}
              isFavourite={true}
              currentUserId={user.id}
              subscription={subscription}
            />
          ))}
        </div>
      )}
    </div>
  );
}