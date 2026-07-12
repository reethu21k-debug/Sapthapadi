import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm, SuccessStoriesManager, TestimonialsManager, FAQsManager } from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Site Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: stories }, { data: testimonials }, { data: faqs }] =
    await Promise.all([
      supabase.from("site_settings").select("*").single(),
      supabase.from("success_stories").select("*").order("created_at", { ascending: false }),
      supabase.from("testimonials").select("*").order("created_at", { ascending: false }),
      supabase.from("faqs").select("*").order("sort_order"),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Site Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure the platform settings and content</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <SettingsForm settings={settings} />
        <SuccessStoriesManager stories={stories || []} />
        <TestimonialsManager testimonials={testimonials || []} />
        <FAQsManager faqs={faqs || []} />
      </div>
    </div>
  );
}