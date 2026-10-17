import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { JsonLd } from "@/components/seo/json-ld";
import { ACCESSIBILITY } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo/metadata";
import { legalPageGraph } from "@/lib/seo/structured-data";

export const metadata: Metadata = pageMetadata({
  path: ACCESSIBILITY.href,
  title: ACCESSIBILITY.title,
  description: ACCESSIBILITY.description,
});

/**
 * `/accessibility`: the accessibility statement.
 *
 * The words are in `lib/legal/accessibility.ts`, the facts they are written around in
 * `lib/legal/facts.ts`, and the layout is the one the four legal pages share.
 */
export default function AccessibilityPage() {
  return (
    <>
      <LegalPage document={ACCESSIBILITY} />
      <JsonLd data={legalPageGraph(ACCESSIBILITY)} />
    </>
  );
}
