"use client";

import { usePathname } from "next/navigation";
import { linkCurrent } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import { OFFER, PURCHASE_LINK } from "@/lib/site";
import styles from "./purchase-button.module.css";

/**
 * The bar's one call to action, at its right: "Get the toolkit · $499.99" from 68em, "Get the
 * toolkit" below it, where the bar has no room for the price. It is one link with one accessible
 * name at every width: below 68em the price is `display: none`, which takes it out of the name as
 * well as out of sight.
 *
 * On the purchase page it is the page being shown: it carries `aria-current="page"` and drops to
 * the quiet look of a current control (the wash and an ink edge), so the bar keeps its shape from
 * page to page and the page is not asked to sell itself twice. A client component only because it
 * reads the pathname.
 */
export function PurchaseButton({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <Button
      href={PURCHASE_LINK.href}
      size="sm"
      className={cx(styles.button, className)}
      aria-current={linkCurrent(pathname, PURCHASE_LINK.href)}
    >
      <span>
        Get the toolkit
        <span className={cx("tabular", styles.price)}> · {formatPrice(OFFER.priceCents)}</span>
      </span>
    </Button>
  );
}
