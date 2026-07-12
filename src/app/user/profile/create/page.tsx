import { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/shared/ProfileForm";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Create My Profile" };

export default async function SelfCreateProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // One profile per account — if they already have one, send them to it.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) redirect("/user/biodata");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-dark">Create My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            Fill in your details to create your matrimonial profile.
          </p>
        </div>
        <div className="hidden sm:block relative w-16 aspect-[1085/1449] rounded-xl overflow-hidden ring-2 ring-gold/20 shadow-md flex-shrink-0">
          <Image
            src="/Love/love-7.png"
            alt="Where hearts find home, a lifetime together — Saptapadi"
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
      </div>

      <div className="luxury-card p-4 flex items-start gap-3 bg-blue-50/50 border-blue-100">
        <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600">
          After you submit, our team will review your profile and add the{" "}
          <span className="font-semibold text-navy-dark">Verified</span> badge once your details
          are confirmed. You can keep editing your profile any time from{" "}
          <span className="font-medium text-navy-dark">My Biodata</span>.
        </p>
      </div>

      <ProfileForm mode="create" actor="self" redirectTo="/user/biodata" />
    </div>
  );
}