import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Note } from "@/components/ui/note";
import { Textarea } from "@/components/ui/textarea";
import { detailRows, orderAmounts, orderMailto, orderText, TAX_LINE } from "@/lib/checkout/order";
import { startPayment, type PaymentOutcome, type PaymentProvider } from "@/lib/checkout/provider";
import type { Order } from "@/lib/checkout/schema";
import { cx } from "@/lib/cx";
import { STEP_HEADING } from "./details-step";
import styles from "./step.module.css";

/**
 * Step three: the seam where a payment provider plugs in (`lib/checkout/provider.ts`).
 *
 * With no provider, which is how the site stands today, the step says so plainly: online payment is
 * not connected, nothing has been charged and nothing has been sent. It shows the order's reference
 * and the order itself, and gives two ways to place it by hand: "Send this order by email", a
 * `mailto:` link to the site's address with the order written out, so the owner can answer with an
 * invoice, and "Copy order details", which puts the same text on the clipboard (or, where a browser
 * refuses, shows it in a box to select).
 *
 * With a provider, the main action is its pay button. Pressing it starts the payment
 * (`startPayment`): a hosted payment page takes the browser away, an embedded one is drawn here by
 * the provider's own element, and a start that fails says so and can be tried again. The order by
 * email stays on offer in the step, for a buyer who needs an invoice.
 *
 * No card field of any kind is drawn by the site.
 */
export function PaymentStep({
  order,
  provider,
  onBack,
  onStartOver,
}: {
  order: Order;
  provider: PaymentProvider | null;
  onBack: () => void;
  onStartOver: () => void;
}) {
  const [copied, setCopied] = useState<"no" | "yes" | "blocked">("no");
  const [payment, setPayment] = useState<PaymentOutcome | { status: "idle" | "starting" }>({
    status: "idle",
  });

  const text = orderText(order);
  const amounts = orderAmounts();
  const facts = [
    { label: "Order", value: order.item.name },
    { label: "Price", value: amounts.price },
    { label: "Tax", value: TAX_LINE },
    ...detailRows(order.details).filter((row) => row.value !== ""),
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("yes");
    } catch {
      setCopied("blocked");
    }
  };

  const pay = async () => {
    if (!provider || payment.status === "starting") return;
    setPayment({ status: "starting" });
    const outcome = await startPayment(provider, order, window.location.origin);
    setPayment(outcome);
    if (outcome.status === "redirect") window.location.assign(outcome.url);
  };

  const Embedded = provider?.Embedded;
  const busy = payment.status === "starting" || payment.status === "redirect";
  const email = (
    <Button href={orderMailto(order)} variant={provider ? "outline" : "mark"} size="lg">
      Send this order by email
    </Button>
  );

  return (
    <div className={styles.form}>
      <div className={styles.content}>
        <h3 id={STEP_HEADING} tabIndex={-1} className={cx("type-page", styles.heading)}>
          Payment
        </h3>

        {provider ? (
          <p className={cx("type-copy", styles.lead)}>
            Your order is ready. Payment is taken by our payment provider; this site never sees a
            card number.
          </p>
        ) : (
          <>
            <Note className={styles.notice}>
              Online payment is not connected yet. Nothing has been charged, and nothing has been
              sent.
            </Note>
            <p className={cx("type-copy", styles.lead)}>
              To place this order, send it to us by email and we will reply with an invoice. Buying
              by purchase order works the same way.
            </p>
          </>
        )}

        <div className={styles.ticket}>
          <p className={cx("type-eyebrow", styles.ticketLabel)}>Order reference</p>
          <p data-order-code="" className={styles.code}>
            {order.reference}
          </p>
        </div>

        <dl className={styles.rows}>
          {facts.map((fact) => (
            <div key={fact.label} className={cx(styles.row, styles.plain)}>
              <dt className={cx("type-eyebrow", styles.term)}>{fact.label}</dt>
              <dd className={cx("type-copy", styles.value)}>{fact.value}</dd>
            </div>
          ))}
        </dl>

        {payment.status === "embedded" && Embedded ? (
          <div className={styles.embedded}>
            <Embedded clientSecret={payment.clientSecret} order={order} />
          </div>
        ) : null}

        {payment.status === "failed" ? (
          <p role="alert" className={cx("type-ui", styles.failed)}>
            {payment.message}
          </p>
        ) : null}

        {copied === "blocked" ? (
          <div className={styles.copyBox}>
            <label htmlFor="checkout-order-text" className={cx("type-ui", styles.copyLabel)}>
              Copying is blocked in this browser. Select the order below and copy it.
            </label>
            <Textarea id="checkout-order-text" readOnly rows={10} value={text} />
          </div>
        ) : null}

        <p role="status" className={cx("type-note", styles.status)}>
          {copied === "yes" ? "Order details copied." : ""}
        </p>

        {provider ? (
          <div className={styles.invoice}>
            <p className="type-copy">Need an invoice or a purchase order instead?</p>
            {email}
          </div>
        ) : null}

        <div className={styles.quiet}>
          <Button variant="text" onClick={onBack}>
            Back to review
          </Button>
          <Button variant="text" onClick={onStartOver}>
            Start over
          </Button>
        </div>
      </div>

      {/* The main action stands last: at the right of the row, and at the foot of a phone's bar. */}
      <div className={styles.actions}>
        <Button variant="outline" size="lg" onClick={copy}>
          Copy order details
        </Button>
        {provider ? (
          payment.status === "embedded" ? null : (
            <Button
              size="lg"
              data-pay={provider.id}
              aria-disabled={busy || undefined}
              onClick={pay}
            >
              {busy ? "Opening payment…" : provider.label}
            </Button>
          )
        ) : (
          email
        )}
      </div>
    </div>
  );
}
