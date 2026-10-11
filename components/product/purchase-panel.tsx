import type { ReactNode } from "react";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./purchase-panel.module.css";

/**
 * The buying panel of a template or bundle page: a paper sheet, lifted to depth 3, that holds the
 * price, what the purchase is, the one buy control (passed as children) and the beta note.
 * `className` lets the page place it in its grid and make it stick.
 */
export function PurchasePanel({
  priceCents,
  note,
  className,
  children,
}: {
  priceCents: number;
  note: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <PaperSheet
      as="aside"
      size="md"
      depth={3}
      aria-label="Purchase"
      className={cx(styles.panel, className)}
    >
      <p className="type-amount tabular">{formatPrice(priceCents)}</p>
      <p className={cx("type-note", styles.note)}>{note}</p>
      <div className={styles.action}>{children}</div>
      <p className={cx("type-note", styles.beta)}>
        Sample listing. Checkout is not available in this beta.
      </p>
    </PaperSheet>
  );
}
