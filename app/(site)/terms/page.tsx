import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { JsonLd } from "@/components/seo/json-ld";
import { TERMS } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo/metadata";
import { legalPageGraph } from "@/lib/seo/structured-data";

export const metadata: Metadata = pageMetadata({
  path: TERMS.href,
  title: TERMS.title,
  description: TERMS.description,
});

/**
 * `/terms`: the terms of use of the site and the licence for the toolkit.
 *
 * The words are in `lib/legal/terms.ts`, the facts they are written around in
 * `lib/legal/facts.ts`, and the layout is the one the four legal pages share.
 */
export default function TermsPage() {
  return (
    <>
      <LegalPage document={TERMS} />
      <JsonLd data={legalPageGraph(TERMS)} />
    </>
  );
}
