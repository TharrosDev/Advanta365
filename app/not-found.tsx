import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/not-found-content";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = { title: "Page not found" };

// Fallback for routes outside the (site) group (no header or footer); site routes use (site)/not-found.
export default function NotFound() {
  return (
    <main id="main">
      <PageShell>
        <NotFoundContent />
      </PageShell>
    </main>
  );
}
