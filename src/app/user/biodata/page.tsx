import { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BiodataClient } from "@/components/user/BiodataClient";
import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata: Metadata = { title: "My Biodata" };

export default async function UserBiodataPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-dark">My Biodata</h1>
        </div>
        <div className="luxury-card p-8 sm:p-12 grid grid-cols-1 sm:grid-cols-12 gap-8 items-center">
          <div className="sm:col-span-4 flex justify-center">
            <div className="relative w-32 sm:w-full max-w-[160px] aspect-[1085/1449] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/Love/love-15.png"
                alt="Where hearts find home, lives begin forever — Saptapadi"
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
          </div>
          <div className="sm:col-span-8 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto sm:mx-0 mb-4">
              <FileText className="w-8 h-8 text-gold/40" />
            </div>
            <h2 className="font-serif text-xl font-bold text-navy-dark mb-2">No Profile Found</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto sm:mx-0">
              You haven&apos;t created your matrimonial profile yet. Create it now — our team will
              review and verify it shortly after.
            </p>
            <Link href="/user/profile/create" className="btn-gold mt-5">
              Create My Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-dark">My Biodata</h1>
          <p className="text-gray-500 text-sm mt-1">View and download your matrimonial biodata</p>
        </div>
      </div>
      <BiodataClient profile={profile} />
    </div>
  );
}
