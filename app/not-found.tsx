import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/not-found-content";

export const metadata: Metadata = { title: "Page not found" };

// Fallback for routes outside the (site) group; site routes use (site)/not-found.
export default function NotFound() {
  return (
    <main id="main">
      <NotFoundContent />
    </main>
  );
}
