import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Heart, Calendar, Sparkles, Quote, ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/shared/JsonLd";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { successStoriesSchema, webPageSchema } from "@/lib/seo/schema";

const TITLE = "Success Stories";
const DESCRIPTION =
  "Read heartwarming success stories from couples who found their life partners and united their families through Saptapadi.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/success-stories" },
  openGraph: {
    title: `${TITLE} | Saptapadi Matrimonial`,
    description: DESCRIPTION,
    url: "/success-stories",
    type: "website",
  },
  twitter: {
    title: `${TITLE} | Saptapadi Matrimonial`,
    description: DESCRIPTION,
  },
};

export default async function SuccessStoriesPage() {
  const supabase = await createClient();

  const { data: stories } = await supabase
    .from("success_stories")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const featuredStory = stories?.[0];
  const remainingStories = stories?.slice(1) || [];

  return (
    <>
      <JsonLd
        data={[
          successStoriesSchema(
            (stories ?? []).map((s) => ({
              coupleNames: s.couple_names,
              story: s.story,
              datePublished: s.created_at,
            }))
          ),
          webPageSchema({
            path: "/success-stories",
            name: `${TITLE} | Saptapadi Matrimonial`,
            description: DESCRIPTION,
            breadcrumb: [{ name: "Success Stories", path: "/success-stories" }],
          }),
        ]}
      />
      <main className="bg-cream text-navy-dark min-h-screen">
      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-36 pb-28 bg-navy-pattern bg-navy-dark text-white px-4 overflow-hidden">
        <div className="relative max-w-6xl mx-auto mb-4">
          <Breadcrumbs
            items={[{ name: "Success Stories", path: "/success-stories" }]}
            currentPath="/success-stories"
          />
        </div>
        {/* Ambient Warm Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-gold/15 via-sindoor/10 to-gold/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/10 backdrop-blur-md mb-6">
            <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
            <span className="text-gold text-xs font-semibold uppercase tracking-[3px] font-marcellus">
              Written in the Stars, United on Earth
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight mb-6 leading-tight">
            Chronicles of <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-amber-200 to-gold">
              Eternal Bonds
            </span>
          </h1>

          <p className="text-white/75 text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed mb-10">
            Every marriage begins with a single sacred step. Explore the heartwarming journeys of couples and families who entrusted their destinies to Saptapadi.
          </p>

          {/* Decorative Thread Divider */}
          <div className="flex items-center justify-center gap-3 text-gold/50" aria-hidden="true">
            <span className="h-[1px] w-16 bg-gradient-to-r from-transparent to-gold/60" />
            <Heart className="w-4 h-4 text-sindoor fill-sindoor" />
            <span className="h-[1px] w-16 bg-gradient-to-l from-transparent to-gold/60" />
          </div>
        </div>
      </section>

      {/* ================= STORIES CONTENT AREA ================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        {stories && stories.length > 0 ? (
          <div className="space-y-16">
            
            {/* FEATURED STORY (First Story Highlight) */}
            {featuredStory && (
              <div className="bg-white rounded-3xl shadow-xl border border-gold/30 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all duration-300 hover:shadow-2xl">
                {featuredStory.image_url ? (
                  <div className="lg:col-span-6 relative min-h-[320px] lg:min-h-full overflow-hidden bg-navy-dark">
                    <Image
                      src={featuredStory.image_url}
                      alt={featuredStory.couple_names}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                  </div>
                ) : (
                  <div className="lg:col-span-6 bg-gradient-to-br from-navy-dark to-slate-900 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                    <Quote className="w-32 h-32 text-gold/10 absolute -bottom-4 -right-4 pointer-events-none" />
                    <Heart className="w-16 h-16 text-gold mb-4 animate-bounce" />
                    <span className="text-white/60 font-serif italic text-lg">A Sacred Union Witnessed</span>
                  </div>
                )}

                <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <span className="px-3 py-1 rounded-md bg-gold/10 text-gold font-semibold text-xs tracking-widest uppercase border border-gold/20">
                        Featured Union
                      </span>
                      {featuredStory.wedding_date && (
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 text-gold" />
                          <span>
                            {new Date(featuredStory.wedding_date).toLocaleDateString("en-IN", {
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy-dark mb-6">
                      {featuredStory.couple_names}
                    </h2>

                    <div className="relative">
                      <Quote className="w-8 h-8 text-gold/20 absolute -top-4 -left-2 -z-10" />
                      <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-normal">
                        &ldquo;{featuredStory.story}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-marcellus">
                      Verified Saptapadi Match
                    </span>
                    <span className="text-gold text-sm font-serif italic">Blessed Union ✦</span>
                  </div>
                </div>
              </div>
            )}

            {/* REMAINING STORIES GRID */}
            {remainingStories.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                {remainingStories.map((story) => (
                  <article
                    key={story.id}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl hover:border-gold/40 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {story.image_url ? (
                        <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
                          <Image
                            src={story.image_url}
                            alt={story.couple_names}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 right-3 bg-navy-dark/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                            <Heart className="w-3 h-3 text-sindoor fill-sindoor" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-32 bg-gradient-to-r from-gold/10 via-amber-50 to-gold/10 flex items-center justify-center border-b border-gold/10">
                          <span className="text-2xl">💍</span>
                        </div>
                      )}

                      <div className="p-6">
                        <div className="flex items-baseline justify-between gap-2 mb-2">
                          <h3 className="font-serif text-2xl font-bold text-navy-dark group-hover:text-gold transition-colors duration-200">
                            {story.couple_names}
                          </h3>
                        </div>

                        {story.wedding_date && (
                          <p className="text-gold text-xs font-semibold mb-4 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            Wed{" "}
                            {new Date(story.wedding_date).toLocaleDateString("en-IN", {
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}

                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 font-light">
                          &ldquo;{story.story}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <span>Saptapadi Journey</span>
                      <span className="text-gold font-serif">✦ Forever</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ================= ELEVATED EMPTY STATE ================= */
          <div className="bg-white rounded-3xl border border-gold/30 p-12 sm:p-20 text-center max-w-2xl mx-auto shadow-sm relative overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-gold animate-pulse" />
            </div>
            
            <p className="text-gold text-xs font-semibold uppercase tracking-[3px] font-marcellus mb-2">
              A New Chapter Awaits
            </p>
            <h2 className="text-3xl font-serif font-bold text-navy-dark mb-4">
              Be Our Very First Feature
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed max-w-md mx-auto font-light">
              We are currently compiling the sacred stories of unions blessed through our platform. Register today and let your love story be the one that inspires thousands next.
            </p>
            
            <Link 
              href="/register" 
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-navy-dark text-white hover:bg-gold hover:text-navy-dark font-medium transition-all duration-300 shadow-md"
            >
              <span>Begin Your Journey</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ================= EVERY STORY BEGINS LIKE THIS ================= */}
      <section className="py-20 sm:py-24 bg-cream border-t border-gold/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-gold text-xs font-semibold uppercase tracking-[4px] mb-3 font-marcellus">
              ✦ Before the Wedding Album ✦
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy-dark">
              Every Story Begins With a Single Introduction
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 max-w-3xl mx-auto">
            <figure className="relative rounded-3xl overflow-hidden shadow-xl border border-gold/20">
              <div className="relative w-full aspect-[1085/1449]">
                <Image
                  src="/Love/love-5.png"
                  alt="Some bonds are written forever, found through Saptapadi"
                  fill
                  sizes="(max-width: 640px) 90vw, 40vw"
                  className="object-cover"
                />
              </div>
            </figure>
            <figure className="relative rounded-3xl overflow-hidden shadow-xl border border-gold/20 sm:mt-10">
              <div className="relative w-full aspect-[1085/1449]">
                <Image
                  src="/Love/love-12.png"
                  alt="A couple whose journeys were meant to be together, united through Saptapadi"
                  fill
                  sizes="(max-width: 640px) 90vw, 40vw"
                  className="object-cover"
                />
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* ================= ROYAL CTA SECTION ================= */}
      <section className="relative py-24 bg-navy-dark text-white text-center px-4 overflow-hidden border-t border-gold/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(198,161,91,0.1)_0,transparent_65%)] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6" aria-hidden="true">
            <span className="h-px w-12 bg-gold/40" />
            <span className="w-2 h-2 rotate-45 bg-gold ring-4 ring-gold/20" />
            <span className="h-px w-12 bg-gold/40" />
          </div>

          <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4">
            Write Your Own Sacred Story
          </h2>
          <p className="text-white/70 text-base sm:text-lg mb-8 max-w-lg mx-auto font-light leading-relaxed">
            Join thousands of individuals and families who found harmony, respect, and enduring companionship on Saptapadi.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-gold via-yellow-600 to-gold text-navy-dark font-semibold text-sm tracking-wider uppercase shadow-lg hover:shadow-gold/20 hover:scale-[1.02] transition-all duration-200"
            >
              Create Free Profile
            </Link>
            <Link 
              href="/about" 
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/20 hover:border-gold/60 text-white font-medium text-sm transition-colors duration-200"
            >
              Learn Our Process
            </Link>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}