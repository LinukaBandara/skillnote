"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Skill Note application error", error);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.025em]">Something went wrong</h1>
        <p className="mt-3 text-sm text-ink-soft">Please try again. If the problem continues, try refreshing the page.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-md bg-cobalt px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
