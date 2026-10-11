import type { ReactNode } from "react";
import { Sheet } from "@/components/ui/sheet";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./purchase-panel.module.css";

/**
 * The buying panel of a template or bundle page: a sheet with an ink edge that holds the price, what
 * the purchase is, the one buy control (passed as children) and the beta note. `className` lets the
 * page place it in its grid and make it stick.
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
    <Sheet as="aside" edge="ink" aria-label="Purchase" className={cx(styles.panel, className)}>
      <p className="type-amount tabular">{formatPrice(priceCents)}</p>
      <p className={cx("type-note", styles.note)}>{note}</p>
      <div className={styles.action}>{children}</div>
      <p className={cx("type-note", styles.beta)}>
        Sample listing. Checkout is not available in this beta.
      </p>
    </Sheet>
  );
}
