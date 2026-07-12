"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-navy-pattern flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-gold text-sm font-semibold uppercase tracking-[4px] mb-3">Error</p>
        <h1 className="font-serif text-4xl font-bold text-white mb-4">Something went wrong</h1>
        <p className="text-white/60 text-lg max-w-md mx-auto mb-10">
          An unexpected error occurred. Please try again or contact support if the issue persists.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={reset} className="btn-gold py-3.5 px-8">
            Try Again
          </button>
          <Link href="/" className="py-3.5 px-8 border border-white/20 text-white rounded-full hover:bg-white/10 transition-all font-semibold text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
