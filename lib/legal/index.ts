import { accessibility } from "./accessibility";
import { LEGAL } from "./facts";
import { privacy } from "./privacy";
import { refunds } from "./refunds";
import { terms } from "./terms";
import type { LegalDocument } from "./types";

export { LEGAL, formatLegalDate, type LegalFacts } from "./facts";
export { plain, type LegalBlock, type LegalDocument, type LegalSection, type Rich } from "./types";
export { accessibility, privacy, refunds, terms };

/** The four pages as the site prints them, each worded for the facts in `LEGAL`. */
export const PRIVACY: LegalDocument = privacy(LEGAL);
export const TERMS: LegalDocument = terms(LEGAL);
export const REFUNDS: LegalDocument = refunds(LEGAL);
export const ACCESSIBILITY: LegalDocument = accessibility(LEGAL);

/** In the order of `LEGAL_LINKS` in `lib/site.ts`. */
export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [PRIVACY, TERMS, REFUNDS, ACCESSIBILITY];
