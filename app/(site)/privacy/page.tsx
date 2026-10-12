import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { PRIVACY } from "@/lib/legal";

export const metadata: Metadata = {
  title: PRIVACY.title,
  description: PRIVACY.description,
};

/**
 * `/privacy`: the privacy policy, with the cookies and browser storage in a section of its own.
 *
 * The words are in `lib/legal/privacy.ts`, the facts they are written around in
 * `lib/legal/facts.ts`, and the layout is the one the four legal pages share.
 */
export default function PrivacyPage() {
  return <LegalPage document={PRIVACY} />;
}
