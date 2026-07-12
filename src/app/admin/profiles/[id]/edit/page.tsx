import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/shared/ProfileForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Edit Profile" };

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !profile) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/profiles/${id}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-navy-dark text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Edit Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Profile ID: <span className="font-mono text-gold font-semibold">{profile.profile_id}</span>
        </p>
      </div>
      <ProfileForm mode="edit" profile={profile} />
    </div>
  );
}