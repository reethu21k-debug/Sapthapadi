import { Metadata } from "next";
import { ProfileForm } from "@/components/shared/ProfileForm";

export const metadata: Metadata = { title: "Create Profile" };

export default function CreateProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Create New Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Fill in all sections to create a comprehensive matrimonial profile. Profiles created
          here are automatically approved and verified.
        </p>
      </div>
      <ProfileForm mode="create" actor="admin" />
    </div>
  );
}
