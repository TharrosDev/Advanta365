import type { Metadata } from "next";
import { MissingPage } from "@/components/not-found/missing-page";

export const metadata: Metadata = { title: "Page not found" };

// Fallback for routes outside the (site) group (no header or footer); site routes use (site)/not-found.
export default function NotFound() {
  return (
    <main id="main">
      <MissingPage />
    </main>
  );
}
