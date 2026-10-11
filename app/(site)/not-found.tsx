import type { Metadata } from "next";
import { MissingPage } from "@/components/not-found/missing-page";

export const metadata: Metadata = { title: "Page not found" };

// Rendered inside the site layout, so the header, footer and phase navigation stay.
export default function NotFound() {
  return <MissingPage />;
}
