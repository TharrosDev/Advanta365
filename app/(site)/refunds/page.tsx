import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { REFUNDS } from "@/lib/legal";

export const metadata: Metadata = {
  title: REFUNDS.title,
  description: REFUNDS.description,
};

/**
 * `/refunds`: the refund policy for a digital download.
 *
 * The words are in `lib/legal/refunds.ts`, the facts they are written around in
 * `lib/legal/facts.ts`, and the layout is the one the four legal pages share.
 */
export default function RefundsPage() {
  return <LegalPage document={REFUNDS} />;
}
