"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary. Styled inline with the Day Grid tokens from
 * globals.css (still loaded via the root layout when this renders).
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-svh place-items-center bg-dots">
      <div className="u-container py-24 text-center">
        <p className="t-coord">ERR-500 / Runtime fault</p>
        <h1 className="t-display mt-6">Something broke.</h1>
        <p className="t-lead mx-auto mt-6 max-w-md">
          An unexpected error interrupted the page. You can try again.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <a href="/" className="btn btn-ghost">
            Back to home
          </a>
        </div>
      </div>
    </main>
  );
}
