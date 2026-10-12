import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { ACCESSIBILITY } from "@/lib/legal";

export const metadata: Metadata = {
  title: ACCESSIBILITY.title,
  description: ACCESSIBILITY.description,
};

/**
 * `/accessibility`: the accessibility statement.
 *
 * The words are in `lib/legal/accessibility.ts`, the facts they are written around in
 * `lib/legal/facts.ts`, and the layout is the one the four legal pages share.
 */
export default function AccessibilityPage() {
  return <LegalPage document={ACCESSIBILITY} />;
}
