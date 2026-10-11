import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/not-found-content";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = { title: "Page not found" };

// Rendered inside the site layout, so the header, footer and phase navigation stay.
export default function NotFound() {
  return (
    <PageShell>
      <NotFoundContent />
    </PageShell>
  );
}
