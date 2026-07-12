"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Save, Loader2, Plus, Trash2, Star, HelpCircle, Heart, Sliders, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const inputClass = "w-full text-sm font-medium text-navy-dark placeholder:text-gray-400 bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 py-2.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all shadow-inner";
const labelClass = "block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5";

// ─── Settings Form ────────────────────────────────────────────

export function SettingsForm({ settings }: { settings: Record<string, unknown> | null }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    site_name: String(settings?.site_name || "Saptapadi"),
    site_tagline: String(settings?.site_tagline || "Where Souls Unite"),
    contact_email: String(settings?.contact_email || ""),
    contact_phone: String(settings?.contact_phone || ""),
    contact_address: String(settings?.contact_address || ""),
    banner_title: String(settings?.banner_title || ""),
    banner_subtitle: String(settings?.banner_subtitle || ""),
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      if (settings?.id) {
        const { error } = await supabase.from("site_settings").update(form).eq("id", String(settings.id));
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert([form]);
        if (error) throw error;
      }
      toast.success("Settings saved successfully!");
      router.refresh();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="luxury-card p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-100">
        <div className="p-2 rounded-xl bg-gold/15 text-gold-dark">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-navy-dark">General Site Settings</h2>
          <p className="text-xs text-gray-400">Configure core platform metadata and public contact details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Site Name</label>
          <input className={inputClass} value={form.site_name} onChange={(e) => update("site_name", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Brand Tagline</label>
          <input className={inputClass} value={form.site_tagline} onChange={(e) => update("site_tagline", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Public Contact Email</label>
          <input className={inputClass} type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} placeholder="support@sapthapadiatp.com" />
        </div>
        <div>
          <label className={labelClass}>Public Helpline Phone</label>
          <input className={inputClass} value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} placeholder="+91 98765 43210" />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Physical Headquarters Address</label>
          <textarea className={inputClass} rows={2} value={form.contact_address} onChange={(e) => update("contact_address", e.target.value)} placeholder="Office #, Street, City, State, Pincode" />
        </div>
        <div>
          <label className={labelClass}>Hero Banner Title</label>
          <input className={inputClass} value={form.banner_title} onChange={(e) => update("banner_title", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Hero Banner Subtitle</label>
          <input className={inputClass} value={form.banner_subtitle} onChange={(e) => update("banner_subtitle", e.target.value)} />
        </div>
      </div>

      <div className="mt-8 pt-5 border-t border-gray-100 flex justify-end">
        <motion.button 
          whileTap={{ scale: 0.97 }}
          onClick={handleSave} 
          disabled={isLoading} 
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold text-navy-dark font-bold text-sm hover:bg-gold-dark hover:text-white transition-all shadow-sm disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Configuration
        </motion.button>
      </div>
    </div>
  );
}

// ─── Success Stories Manager ──────────────────────────────────

export function SuccessStoriesManager({ stories }: { stories: Record<string, unknown>[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ couple_names: "", story: "", wedding_date: "", is_published: true });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!form.couple_names || !form.story) { toast.error("Please fill in all required fields"); return; }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("success_stories").insert([form]);
      if (error) throw error;
      toast.success("Success story published!");
      setShowForm(false);
      setForm({ couple_names: "", story: "", wedding_date: "", is_published: true });
      router.refresh();
    } catch { toast.error("Failed to add story"); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this success story?")) return;
    const supabase = createClient();
    await supabase.from("success_stories").delete().eq("id", id);
    toast.success("Story deleted"); router.refresh();
  };

  const togglePublish = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from("success_stories").update({ is_published: !current }).eq("id", id);
    router.refresh();
  };

  return (
    <div className="luxury-card p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-navy-dark">Success Stories</h2>
            <p className="text-xs text-gray-400">Showcase happily married couples discovered on Saptapadi</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-navy-dark font-semibold text-xs hover:bg-gold-dark hover:text-white transition-all shadow-2xs"
        >
          <Plus className="w-4 h-4" /> {showForm ? "Close Form" : "Add Story"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/80 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-dark">Create New Story</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Couple Names *</label>
                  <input className={inputClass} value={form.couple_names} onChange={(e) => setForm({ ...form, couple_names: e.target.value })} placeholder="Arjun & Priya" />
                </div>
                <div>
                  <label className={labelClass}>Wedding Date</label>
                  <input className={inputClass} type="date" value={form.wedding_date} onChange={(e) => setForm({ ...form, wedding_date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Their Journey *</label>
                <textarea className={inputClass} rows={3} value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} placeholder="Share their beautiful meeting and matrimonial journey..." />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-white">Cancel</button>
                <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 shadow-2xs disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Story
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="divide-y divide-gray-100">
        {stories.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-gray-50/40 rounded-xl border border-dashed border-gray-200">
            <Heart className="w-6 h-6 mx-auto mb-1 text-gray-300" />
            <p className="text-xs font-medium">No success stories recorded yet</p>
          </div>
        ) : (
          stories.map((s) => (
            <div key={String(s.id)} className="py-4 flex items-start justify-between gap-4 group">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-serif font-bold text-navy-dark text-base">{String(s.couple_names)}</p>
                  {!!s.wedding_date && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {String(s.wedding_date)}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-xs mt-1 leading-relaxed line-clamp-2">{String(s.story)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={() => togglePublish(String(s.id), Boolean(s.is_published))} 
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                    s.is_published ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}
                >
                  {s.is_published ? "Published" : "Draft"}
                </button>
                <button onClick={() => handleDelete(String(s.id))} className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Testimonials Manager ─────────────────────────────────────

export function TestimonialsManager({ testimonials }: { testimonials: Record<string, unknown>[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", rating: 5, content: "", is_published: true });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.content) { toast.error("Please fill required fields"); return; }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("testimonials").insert([form]);
      if (error) throw error;
      toast.success("Testimonial saved!");
      setShowForm(false);
      setForm({ name: "", location: "", rating: 5, content: "", is_published: true });
      router.refresh();
    } catch { toast.error("Failed to add testimonial"); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const supabase = createClient();
    await supabase.from("testimonials").delete().eq("id", id);
    toast.success("Deleted"); router.refresh();
  };

  const togglePublish = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from("testimonials").update({ is_published: !current }).eq("id", id);
    router.refresh();
  };

  return (
    <div className="luxury-card p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-navy-dark">User Testimonials</h2>
            <p className="text-xs text-gray-400">Manage member reviews and platform ratings</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-navy-dark font-semibold text-xs hover:bg-gold-dark hover:text-white transition-all shadow-2xs"
        >
          <Plus className="w-4 h-4" /> {showForm ? "Close Form" : "Add Testimonial"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/80 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-dark">Add New Review</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Reviewer Name *</label>
                  <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rajesh K." />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Hyderabad, TS" />
                </div>
                <div>
                  <label className={labelClass}>Rating (1-5)</label>
                  <input className={inputClass} type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Review Content *</label>
                <textarea className={inputClass} rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Their experience using Saptapadi..." />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-white">Cancel</button>
                <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 shadow-2xs disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Review
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="divide-y divide-gray-100">
        {testimonials.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-gray-50/40 rounded-xl border border-dashed border-gray-200">
            <Star className="w-6 h-6 mx-auto mb-1 text-gray-300" />
            <p className="text-xs font-medium">No testimonials logged yet</p>
          </div>
        ) : (
          testimonials.map((t) => (
            <div key={String(t.id)} className="py-4 flex items-start justify-between gap-4 group">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-navy-dark text-sm">{String(t.name)}</p>
                  {!!t.location && <span className="text-gray-400 text-xs">• {String(t.location)}</span>}
                  <div className="flex items-center text-amber-500 text-xs ml-1">
                    {Array.from({ length: Number(t.rating || 5) }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 text-xs mt-1 leading-relaxed line-clamp-2">&ldquo;{String(t.content)}&rdquo;</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={() => togglePublish(String(t.id), Boolean(t.is_published))} 
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                    t.is_published ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}
                >
                  {t.is_published ? "Published" : "Draft"}
                </button>
                <button onClick={() => handleDelete(String(t.id))} className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── FAQs Manager ─────────────────────────────────────────────

export function FAQsManager({ faqs }: { faqs: Record<string, unknown>[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ question: "", answer: "", sort_order: 0, is_published: true });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!form.question || !form.answer) { toast.error("Please fill required fields"); return; }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("faqs").insert([form]);
      if (error) throw error;
      toast.success("FAQ created!");
      setShowForm(false);
      setForm({ question: "", answer: "", sort_order: 0, is_published: true });
      router.refresh();
    } catch { toast.error("Failed to add FAQ"); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    const supabase = createClient();
    await supabase.from("faqs").delete().eq("id", id);
    toast.success("Deleted"); router.refresh();
  };

  return (
    <div className="luxury-card p-6 md:p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-navy-dark">Frequently Asked Questions</h2>
            <p className="text-xs text-gray-400">Configure self-service platform guidance for users</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-navy-dark font-semibold text-xs hover:bg-gold-dark hover:text-white transition-all shadow-2xs"
        >
          <Plus className="w-4 h-4" /> {showForm ? "Close Form" : "Add FAQ"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/80 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-dark">New Question & Answer</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <label className={labelClass}>Question *</label>
                  <input className={inputClass} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="How do I verify my profile?" />
                </div>
                <div>
                  <label className={labelClass}>Sort Order</label>
                  <input className={inputClass} type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Answer *</label>
                <textarea className={inputClass} rows={3} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Provide clear, concise instructions..." />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-white">Cancel</button>
                <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 shadow-2xs disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save FAQ
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="divide-y divide-gray-100">
        {faqs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-gray-50/40 rounded-xl border border-dashed border-gray-200">
            <HelpCircle className="w-6 h-6 mx-auto mb-1 text-gray-300" />
            <p className="text-xs font-medium">No FAQs listed yet</p>
          </div>
        ) : (
          faqs.map((f) => (
            <div key={String(f.id)} className="py-4 flex items-start justify-between gap-4 group">
              <div>
                <p className="font-bold text-navy-dark text-sm">{String(f.question)}</p>
                <p className="text-gray-600 text-xs mt-1 leading-relaxed line-clamp-2">{String(f.answer)}</p>
              </div>
              <button onClick={() => handleDelete(String(f.id))} className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}