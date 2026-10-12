import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { TERMS } from "@/lib/legal";

export const metadata: Metadata = {
  title: TERMS.title,
  description: TERMS.description,
};

/**
 * `/terms`: the terms of use of the site and the licence for the toolkit.
 *
 * The words are in `lib/legal/terms.ts`, the facts they are written around in
 * `lib/legal/facts.ts`, and the layout is the one the four legal pages share.
 */
export default function TermsPage() {
  return <LegalPage document={TERMS} />;
}
