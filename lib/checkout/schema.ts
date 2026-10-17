import * as z from "zod/mini";
import { OFFER } from "@/lib/site";
import { isCountry, regionProblem } from "./places";

/**
 * The shapes of the checkout, written with `zod/mini` because they run in the browser: the buyer's
 * details as the form holds them, and the order a payment provider is handed. Every message is the
 * line the form prints under its field, so it says what to do and never blames.
 */

/** The fields of "Your details", in the order the form asks for them. */
export const DETAIL_FIELDS = [
  "fullName",
  "email",
  "organization",
  "country",
  "region",
  "poNumber",
  "note",
] as const;

export type DetailField = (typeof DETAIL_FIELDS)[number];

/** The longest value each typed field takes. The form stops typing there, and the schema agrees. */
export const DETAIL_LIMITS = {
  fullName: 120,
  email: 254,
  organization: 160,
  region: 80,
  poNumber: 60,
  note: 600,
} as const;

/** An address with one "@", something on both sides of it and a dot in the domain. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** An order's own code, as `orderCode` writes it: `A365-261012-K7QX2M`. */
export const ORDER_CODE = /^A365-\d{6}-[2-9A-HJ-NP-Z]{6}$/;

const tooLong = (limit: number) => `Keep this to ${limit} characters or fewer`;

const line = (missing: string, limit: number) =>
  z.string().check(z.trim(), z.minLength(1, missing), z.maxLength(limit, tooLong(limit)));

const optionalLine = (limit: number) =>
  z.string().check(z.trim(), z.maxLength(limit, tooLong(limit)));

/**
 * The buyer's details. Name, work email, organization and country are needed; a region is needed
 * where the form lists them (Canada and the United States) and is free text, or empty, anywhere
 * else; the purchase order number and the note are the buyer's to leave out. Values are trimmed.
 */
export const detailsSchema = z
  .object({
    fullName: line("Enter your full name", DETAIL_LIMITS.fullName),
    email: z
      .string()
      .check(
        z.trim(),
        z.minLength(1, "Enter your work email"),
        z.maxLength(DETAIL_LIMITS.email, tooLong(DETAIL_LIMITS.email)),
        z.regex(EMAIL, "Enter an email address like name@organization.ca"),
      ),
    organization: line("Enter the name of your organization", DETAIL_LIMITS.organization),
    country: z.string().check(z.refine(isCountry, "Choose a country")),
    region: optionalLine(DETAIL_LIMITS.region),
    poNumber: optionalLine(DETAIL_LIMITS.poNumber),
    note: optionalLine(DETAIL_LIMITS.note),
  })
  .check(
    z.superRefine((details, context) => {
      const problem = regionProblem(details.country, details.region);
      if (problem) context.addIssue({ code: "custom", path: ["region"], message: problem });
    }),
  );

export type OrderDetails = z.infer<typeof detailsSchema>;

/** The details while they are being typed: every field a string, as the inputs hold them. */
export type DetailsDraft = Record<DetailField, string>;

export const EMPTY_DETAILS: DetailsDraft = {
  fullName: "",
  email: "",
  organization: "",
  country: "",
  region: "",
  poNumber: "",
  note: "",
};

type DetailErrors = Partial<Record<DetailField, string>>;

type DetailsResult =
  { ok: true; details: OrderDetails; errors: DetailErrors } | { ok: false; errors: DetailErrors };

/**
 * Checks the details as typed. It answers with the trimmed details, or with one message per field
 * that needs attention (the first that applies to it). The region is judged for its country even
 * while other fields are still wrong, so every problem shows at once.
 */
export function parseDetails(draft: DetailsDraft): DetailsResult {
  const result = detailsSchema.safeParse(draft);
  if (result.success) return { ok: true, details: result.data, errors: {} };

  const errors: DetailErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !(DETAIL_FIELDS as readonly string[]).includes(field)) {
      continue;
    }
    errors[field as DetailField] ??= issue.message;
  }
  if (isCountry(draft.country)) {
    const problem = regionProblem(draft.country, draft.region.trim());
    if (problem) errors.region ??= problem;
  }
  return { ok: false, errors };
}

/**
 * One order: the single thing the site sells, at the price in `OFFER`, for one buyer who has agreed
 * to the Terms and the Refund policy. It carries no payment details of any kind; a provider collects
 * those on its own page or in its own element.
 */
export const orderSchema = z.object({
  reference: z.string().check(z.regex(ORDER_CODE)),
  /** When the buyer confirmed the review, as an ISO 8601 instant. */
  createdAt: z.iso.datetime(),
  item: z.object({
    name: z.literal(OFFER.name),
    priceCents: z.literal(OFFER.priceCents),
    currency: z.literal(OFFER.currency),
  }),
  details: detailsSchema,
  agreedToTerms: z.literal(true),
});

export type Order = z.infer<typeof orderSchema>;
