import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { JsonLd } from "./JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";

type Crumb = { name: string; path: string };

/**
 * Visible breadcrumb trail + matching BreadcrumbList JSON-LD.
 * Always include "Home" as the first crumb's implicit root; pass the
 * remaining trail for the current page.
 */
export function Breadcrumbs({ items, currentPath }: { items: Crumb[]; currentPath: string }) {
  const full: Crumb[] = [{ name: "Home", path: "/" }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="relative z-10">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/50">
        {full.map((crumb, i) => {
          const isLast = i === full.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {i === 0 ? (
                <Link href={crumb.path} className="flex items-center gap-1 hover:text-gold transition-colors">
                  <Home className="w-3 h-3" aria-hidden="true" />
                  <span className="sr-only">Home</span>
                </Link>
              ) : isLast ? (
                <span aria-current="page" className="text-gold/90 font-medium">
                  {crumb.name}
                </span>
              ) : (
                <Link href={crumb.path} className="hover:text-gold transition-colors">
                  {crumb.name}
                </Link>
              )}
              {!isLast && <ChevronRight className="w-3 h-3 opacity-40" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
      <JsonLd data={breadcrumbSchema(full, currentPath)} />
    </nav>
  );
}
