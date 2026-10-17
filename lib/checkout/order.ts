import { formatPrice } from "@/lib/format";
import { OFFER, SITE, TOOLKIT } from "@/lib/site";
import type { Draft } from "./draft";
import { countryName, regionLabel, regionName } from "./places";
import {
  DETAIL_FIELDS,
  parseDetails,
  type DetailField,
  type Order,
  type OrderDetails,
} from "./schema";

/** The thirty-two characters of an order's code: no 0, 1, I or O, which read as each other. */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

const two = (value: number) => String(value).padStart(2, "0");

/**
 * An order's code: `A365`, the day in UTC as six digits, and six characters drawn from `entropy`
 * (six bytes, each read modulo the alphabet). It names the order in an email and on an invoice; it
 * is not a secret and is not proof of anything.
 */
export function orderCode(now: Date, entropy: ArrayLike<number>): string {
  const day = `${two(now.getUTCFullYear() % 100)}${two(now.getUTCMonth() + 1)}${two(now.getUTCDate())}`;
  let tail = "";
  for (let index = 0; index < 6; index += 1) {
    tail += ALPHABET[(entropy[index] ?? 0) % ALPHABET.length];
  }
  return `A365-${day}-${tail}`;
}

/**
 * The order a draft amounts to, or nothing while the draft is not ready for payment: the details
 * are incomplete, the buyer has not agreed, or the review has not been confirmed.
 */
export function buildOrder(draft: Draft): Order | null {
  const parsed = parseDetails(draft.details);
  if (!parsed.ok || !draft.agreed || draft.reference === null || draft.createdAt === null) {
    return null;
  }
  return {
    reference: draft.reference,
    createdAt: draft.createdAt,
    item: { name: OFFER.name, priceCents: OFFER.priceCents, currency: OFFER.currency },
    details: parsed.details,
    agreedToTerms: true,
  };
}

/** What the toolkit holds, as the lines of an order summary, with the counts from `TOOLKIT`. */
export function includedLines(): string[] {
  return [
    `${TOOLKIT.playbooks} playbooks`,
    `${TOOLKIT.templates} templates`,
    `${TOOLKIT.fieldGuides} field guides`,
    `${TOOLKIT.jobAids} job aids`,
    `Training for ${TOOLKIT.trainingAudiences} audiences`,
  ];
}

/** What the summary says about tax: the site does not work it out, the payment step does. */
export const TAX_LINE = "Calculated at payment";

/** The amounts of the one order there is: the price, and the same again as the total before tax. */
export function orderAmounts(): { price: string; totalBeforeTax: string } {
  const price = formatPrice(OFFER.priceCents, OFFER.currency);
  return { price, totalBeforeTax: price };
}

/** What each field of the details is called, on the form, on the review and in an email. */
export const DETAIL_LABELS: Record<Exclude<DetailField, "region">, string> = {
  fullName: "Full name",
  email: "Work email",
  organization: "Organization",
  country: "Country",
  poNumber: "PO or reference number",
  note: "Note",
};

type DetailRow = { field: DetailField; label: string; value: string };

/**
 * The buyer's details as rows, in the order the form asks: a country and a listed region by name,
 * the region under what it is called there, and an empty value for what was left out.
 */
export function detailRows(details: OrderDetails): DetailRow[] {
  return DETAIL_FIELDS.map((field) => {
    if (field === "country") {
      return { field, label: DETAIL_LABELS.country, value: countryName(details.country) };
    }
    if (field === "region") {
      return {
        field,
        label: regionLabel(details.country),
        value: regionName(details.country, details.region),
      };
    }
    return { field, label: DETAIL_LABELS[field], value: details[field] };
  });
}

/**
 * An order as plain text, one fact to a line: what "Copy order details" copies and what the email
 * carries. Everything the owner needs to write an invoice is in it, and nothing else.
 */
export function orderText(order: Order): string {
  const amounts = orderAmounts();
  return [
    `${SITE.name} order ${order.reference}`,
    `Date: ${order.createdAt.slice(0, 10)}`,
    "",
    `${order.item.name}: ${amounts.price}`,
    `Includes: ${includedLines().join(", ").toLowerCase()}`,
    `Tax: ${TAX_LINE.toLowerCase()}`,
    `Total before tax: ${amounts.totalBeforeTax}`,
    "",
    ...detailRows(order.details)
      .filter((row) => row.value !== "")
      .map((row) => `${row.label}: ${row.value}`),
    "",
    "Terms and Refund policy: agreed",
  ].join("\n");
}

/**
 * A `mailto:` link to the site's address with the order written out, for a buyer to send from their
 * own mail program, so the owner can answer with an invoice. Nothing is sent by the site.
 */
export function orderMailto(order: Order): string {
  const subject = `Order ${order.reference}: ${order.item.name}`;
  const body = `${orderText(order)}\n\nPlease send an invoice for this order.\n`;
  // Mail programs expect the line ends of a message, a carriage return and a line feed.
  const encoded = encodeURIComponent(body.replaceAll("\n", "\r\n"));
  return `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encoded}`;
}
