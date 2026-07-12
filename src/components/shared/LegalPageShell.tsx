import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

type Section = { heading: string; body: React.ReactNode };

/**
 * Shared visual shell for the legal pages (/privacy, /terms, /refunds) so
 * they read as one consistent, real section of the site rather than three
 * bare, disconnected documents.
 */
export function LegalPageShell({
  eyebrow,
  title,
  intro,
  lastUpdated,
  crumbName,
  crumbPath,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated: string;
  crumbName: string;
  crumbPath: string;
  sections: Section[];
}) {
  return (
    <main className="bg-cream text-navy-dark min-h-screen">
      <section className="relative pt-32 pb-20 bg-navy-pattern bg-navy-dark text-white px-4 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-gold/10 via-transparent to-sindoor/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <Breadcrumbs items={[{ name: crumbName, path: crumbPath }]} currentPath={crumbPath} />
          <p className="mt-6 text-gold text-xs font-semibold uppercase tracking-[3px]">{eyebrow}</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-3 mb-4">{title}</h1>
          <p className="text-white/60 max-w-2xl">{intro}</p>
          <p className="text-white/40 text-xs mt-6 uppercase tracking-wide">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="space-y-12">
          {sections.map((s) => (
            <div key={s.heading}>
              <h2 className="font-serif text-2xl font-bold text-navy-dark mb-3">{s.heading}</h2>
              <div className="text-charcoal leading-relaxed space-y-3">{s.body}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
