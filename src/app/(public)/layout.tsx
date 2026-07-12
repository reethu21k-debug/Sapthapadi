import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream text-navy-dark flex flex-col font-sans antialiased selection:bg-gold/20 selection:text-navy-dark relative overflow-x-hidden">
      {/* 
        Fixed Ambient Background Glow 
        Provides a subtle, continuous warm undertone across all public pages 
        without interfering with interactive elements.
      */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-gold/5 via-amber-500/[0.02] to-transparent blur-3xl pointer-events-none -z-10" 
        aria-hidden="true" 
      />

      {/* Navigation Header */}
      <PublicNavbar />

      {/* 
        Main Content Wrapper
        flex-1 ensures the footer stays pushed to the bottom on short pages.
        relative & z-10 protect interactive page layers.
      */}
      <main className="flex-1 flex flex-col relative z-10 animate-fade-in">
        {children}
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}