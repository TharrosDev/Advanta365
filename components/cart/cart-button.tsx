"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/use-cart";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import styles from "./cart-button.module.css";

/**
 * The bar's cart link: an outline control with the word "Cart" and a badge holding the number of
 * lines in the cart. The badge is highlighted once the cart holds something.
 *
 * The badge pops (a short grow and return) whenever the count changes after the stored cart has
 * been read; reading it for the first time is not a change. Under reduced motion it never moves.
 *
 * The count is part of the accessible name only once the stored cart is known. Server HTML and the
 * hydration render both say "Cart", so "Cart, 0 items" can only ever appear after the store has been
 * read (and, through CartSync, pruned). The visible count shows 0 until then, so nothing shifts.
 */
export function CartButton() {
  const { count, ready } = useCart();
  const shown = ready ? count : 0;

  // The number of changes seen since the stored cart has been read; each one remounts the badge,
  // which starts its pop again. Adjusted while rendering, so no effect is needed.
  const [seen, setSeen] = useState<{ count: number; pops: number } | null>(null);
  if (ready && seen === null) setSeen({ count, pops: 0 });
  else if (ready && seen !== null && seen.count !== count) {
    setSeen({ count, pops: seen.pops + 1 });
  }
  const pops = seen?.pops ?? 0;

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
        key={pops}
        aria-hidden="true"
        className={cx(
          "type-note",
          "tabular",
          styles.count,
          shown > 0 && styles.filled,
          pops > 0 && styles.pop,
        )}
      >
        {shown}
      </span>
    </Button>
  );
}
