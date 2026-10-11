import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./purchase-panel.module.css";

/**
 * The buying column of a template or bundle page: the price, what the purchase is, the one buy
 * control (passed as children) and the beta note. From 1024px it sticks to the top while the details
 * scroll past; `className` lets the page place it in its grid.
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
    <aside aria-label="Purchase" className={cx(styles.panel, className)}>
      <p className="t-display-medium tabular">{formatPrice(priceCents)}</p>
      <p className="t-label-medium c-fg-60">{note}</p>
      {children}
      <p className="t-body-medium c-fg-60">
        Sample listing. Checkout is not available in this beta.
      </p>
    </aside>
  );
}
