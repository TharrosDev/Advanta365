import type { ComponentType } from "react";
import { orderSchema, type Order } from "./schema";

/**
 * The seam a payment provider plugs into. The checkout is complete up to here: it has a checked
 * `Order` and a buyer who has agreed to the Terms. What happens next is the provider's.
 *
 * A provider is a small object that runs in the browser. Its `start` hands the order to the site's
 * own server (a server action or a route handler, which holds the secret key, reads the price from
 * `OFFER` and never trusts the amount the browser sent), and answers in one of two ways:
 *
 * - `redirect`: the address of a payment page the provider hosts (Stripe Checkout, a hosted payment
 *   page). The checkout sends the browser there.
 * - `embedded`: the client secret of a payment the provider has prepared, for a payment element
 *   drawn inside the checkout. The provider's own `Embedded` component draws it.
 *
 * `docs/architecture.md` (section 3.7) lists every step of wiring one in.
 */
export type PaymentStart =
  { kind: "redirect"; redirectUrl: string } | { kind: "embedded"; clientSecret: string };

export interface PaymentProvider {
  /** A short name for logs and tests: "stripe". */
  id: string;
  /** The words on the pay button: "Pay with card". */
  label: string;
  /** Prepares the payment of an order on the server and says how the buyer goes on to pay. */
  start(order: Order): Promise<PaymentStart>;
  /** Draws the provider's payment element for an `embedded` start. */
  Embedded?: ComponentType<{ clientSecret: string; order: Order }>;
}

/**
 * The provider the site takes payment with. None is connected yet, so this answers `null`, and the
 * Payment step offers the order by email instead. Wiring a provider in means returning it here.
 */
export function getPaymentProvider(): PaymentProvider | null {
  return null;
}

/** What starting a payment came to, as the Payment step shows it. */
export type PaymentOutcome =
  | { status: "redirect"; url: string }
  | { status: "embedded"; clientSecret: string }
  | { status: "failed"; message: string };

/** The one thing the buyer is told when a payment cannot start. It never repeats a provider's words. */
export const PAYMENT_FAILED =
  "Payment could not be started, and nothing was charged. Try again, or send the order by email.";

const failed: PaymentOutcome = { status: "failed", message: PAYMENT_FAILED };

/**
 * Starts the payment of an order with a provider, and never throws. The order is checked once more
 * before it leaves; a provider that rejects, or answers with something the checkout cannot act on
 * (an address that is neither `https:` nor on this site's own `origin`, an empty secret, a secret
 * with no element to draw it), is a failure the buyer can retry.
 */
export async function startPayment(
  provider: PaymentProvider,
  order: Order,
  origin: string,
): Promise<PaymentOutcome> {
  const checked = orderSchema.safeParse(order);
  if (!checked.success) return failed;

  let start: PaymentStart;
  try {
    start = await provider.start(checked.data);
  } catch {
    return failed;
  }

  if (start.kind === "redirect") {
    try {
      const url = new URL(start.redirectUrl, origin);
      if (url.protocol === "https:" || url.origin === origin) {
        return { status: "redirect", url: url.href };
      }
    } catch {
      // Not an address at all.
    }
    return failed;
  }

  if (start.kind === "embedded" && start.clientSecret && provider.Embedded) {
    return { status: "embedded", clientSecret: start.clientSecret };
  }
  return failed;
}
