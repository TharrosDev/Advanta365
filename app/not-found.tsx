import type { Metadata } from "next";
import { MissingPage } from "@/components/not-found/missing-page";

// A missing page is never indexed: this replaces the layout's "index, follow".
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

// Fallback for routes outside the (site) group (no header or footer); site routes use (site)/not-found.
export default function NotFound() {
  return (
    <main id="main">
      <MissingPage />
    </main>
  );
}
