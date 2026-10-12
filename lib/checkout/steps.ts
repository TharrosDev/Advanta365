import { PURCHASE_LINK } from "@/lib/site";
import type { Draft } from "./draft";
import { parseDetails } from "./schema";

/**
 * The steps of the checkout, and which of them an order may stand on. The step is the one thing the
 * address says about a checkout (`/purchase?checkout=review`): the order itself never goes there.
 */
export const CHECKOUT_PARAM = "checkout";

export const CHECKOUT_STEPS = ["details", "review", "payment"] as const;

export type CheckoutStep = (typeof CHECKOUT_STEPS)[number];

export const STEP_LABELS: Record<CheckoutStep, string> = {
  details: "Your details",
  review: "Review",
  payment: "Payment",
};

/**
 * The step an address asks for: the first `checkout` value, in any case, if it names a step. Any
 * other value opens nothing, as an unknown `view` opens nothing in the catalog.
 */
export function parseCheckoutStep(
  value: string | readonly string[] | null | undefined,
): CheckoutStep | undefined {
  const first = (typeof value === "string" ? value : value?.[0])?.toLowerCase();
  return CHECKOUT_STEPS.find((step) => step === first);
}

/** The address of the Purchase page with the checkout open on a step, or closed without one. */
export function checkoutHref(step?: CheckoutStep): string {
  return step ? `${PURCHASE_LINK.href}?${CHECKOUT_PARAM}=${step}` : PURCHASE_LINK.href;
}

/**
 * How far an order has come. It stands on the details until they are complete, on the review until
 * the buyer has agreed and the order has its code, and on the payment after that.
 */
export function furthestStep(draft: Draft): CheckoutStep {
  if (!parseDetails(draft.details).ok) return "details";
  if (!draft.agreed || draft.reference === null || draft.createdAt === null) return "review";
  return "payment";
}

/**
 * The step to show for the one an address asks for: that step, or the furthest the order has come
 * when the address asks for more. Going back is always allowed.
 */
export function resolveStep(requested: CheckoutStep, draft: Draft): CheckoutStep {
  const furthest = furthestStep(draft);
  return CHECKOUT_STEPS.indexOf(requested) <= CHECKOUT_STEPS.indexOf(furthest)
    ? requested
    : furthest;
}

/** A step's place in the row, counted from one. */
export function stepNumber(step: CheckoutStep): number {
  return CHECKOUT_STEPS.indexOf(step) + 1;
}

/** Where a step stands for a visitor who is on `current`: behind them, under them or ahead. */
export function stepState(step: CheckoutStep, current: CheckoutStep): "done" | "current" | "ahead" {
  const difference = CHECKOUT_STEPS.indexOf(step) - CHECKOUT_STEPS.indexOf(current);
  return difference < 0 ? "done" : difference === 0 ? "current" : "ahead";
}

/** What is said, politely, when the step changes: "Step 2 of 3: Review". */
export function stepAnnouncement(step: CheckoutStep): string {
  return `Step ${stepNumber(step)} of ${CHECKOUT_STEPS.length}: ${STEP_LABELS[step]}`;
}
