import type { Metadata } from "next";
import { MissingPage } from "@/components/not-found/missing-page";

// A missing page is never indexed: this replaces the layout's "index, follow".
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

// Rendered inside the site layout, so the header, footer and phase navigation stay.
export default function NotFound() {
  return <MissingPage />;
}
