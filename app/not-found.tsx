import type { Metadata } from "next";
import { InkLayer } from "@/components/ink/ink-layer";
import { MissingPage } from "@/components/not-found/missing-page";

export const metadata: Metadata = { title: "Page not found" };

// Fallback for routes outside the (site) group (no header or footer); site routes use (site)/not-found.
// The site layout is what mounts the ink layer for the other pages, so this one mounts its own; a
// second layer finds the first and does nothing.
export default function NotFound() {
  return (
    <main id="main">
      <MissingPage />
      <InkLayer />
    </main>
  );
}
