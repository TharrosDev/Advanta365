"use client";

import { useCart } from "@/components/cart/use-cart";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import styles from "./cart-button.module.css";

/**
 * The bar's cart link: an outline control with the word "Cart" and a badge holding the number of
 * lines in the cart. The badge is highlighted once the cart holds something.
 *
 * The count is part of the accessible name only once the stored cart is known. Server HTML and the
 * hydration render both say "Cart", so "Cart, 0 items" can only ever appear after the store has been
 * read (and, through CartSync, pruned). The visible count shows 0 until then, so nothing shifts.
 */
export function CartButton() {
  const { count, ready } = useCart();
  const shown = ready ? count : 0;

  return (
    <Button
      variant="outline"
      size="sm"
      href="/cart"
      aria-label={ready ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
      className={styles.root}
    >
      Cart
      <span
        aria-hidden="true"
        className={cx("type-note", "tabular", styles.count, shown > 0 && styles.filled)}
      >
        {shown}
      </span>
    </Button>
  );
}
