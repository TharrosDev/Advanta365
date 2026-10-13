import { SITE } from "@/lib/site";

/**
 * The facts and business decisions the four legal pages are written around. This is the one place
 * the owner fills them in: every page reads them from here and words itself for whatever is set,
 * so nothing is promised that has not been decided. A value left `undefined` is an open item; the
 * pages then say only what is true without it.
 */
export type LegalFacts = {
  /** The legal name of the seller, with its suffix once it is known ("… Inc."). */
  entity: string;
  /** The seller's postal address, as one line. Printed with the contact details when set. */
  address: string | undefined;
  /** The country the seller is established in. */
  country: string;
  /** The province whose law governs the terms ("Ontario"). */
  governingProvince: string | undefined;
  /** The day these four pages last changed, as an ISO date. */
  effectiveDate: string;
  /** Where privacy questions and requests go. */
  privacyEmail: string;
  /** The person accountable for privacy, by name or title, once one is named. */
  privacyContactName: string | undefined;
  /** The company that hosts the site. `undefined` prints "our hosting provider". */
  hostingProvider: string | undefined;
  /**
   * How many days after purchase a refund may be asked for when the files have not been
   * downloaded. `undefined` states no limit.
   */
  refundWindowDays: number | undefined;
  /**
   * Whether a consultant may use the toolkit in work for clients. `false` keeps the licence to the
   * buyer's own organization and asks consultants to write first.
   */
  clientWorkAllowed: boolean;
  /** The date of an independent accessibility audit, as an ISO date, once there has been one. */
  accessibilityAuditDate: string | undefined;
};

export const LEGAL: LegalFacts = {
  entity: SITE.parent,
  address: undefined,
  country: "Canada",
  governingProvince: undefined,
  effectiveDate: "2026-10-13",
  privacyEmail: SITE.contactEmail,
  privacyContactName: undefined,
  hostingProvider: "Vercel",
  refundWindowDays: undefined,
  clientWorkAllowed: false,
  accessibilityAuditDate: undefined,
};

const DATE = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "long",
  timeZone: "UTC",
});

/** An ISO date as running copy writes it: "October 12, 2026". */
export function formatLegalDate(iso: string): string {
  return DATE.format(new Date(`${iso}T00:00:00Z`));
}
