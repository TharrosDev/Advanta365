"use client";

import { useCart } from "@/components/cart/use-cart";
import { TransitionLink } from "@/components/motion/transition-link";
import { cx } from "@/lib/cx";
import styles from "./cart-button.module.css";

/**
 * The header's cart link: the word "Cart" and the number of lines in the cart.
 *
 * The count is part of the accessible name only once the stored cart is known. Server HTML and the
 * hydration render both say "Cart", so "Cart, 0 items" can only ever appear after the store has been
 * read (and, through CartSync, pruned). The visible count shows 0 until then, so nothing shifts.
 */
export function CartButton() {
  const { count, ready } = useCart();
  const shown = ready ? count : 0;

  return (
    <TransitionLink
      href="/cart"
      aria-label={ready ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
      className={styles.root}
    >
      <span className={styles.label}>Cart</span>
      <span
        aria-hidden="true"
        className={cx(styles.count, shown > 0 && styles.filled, "t-label-medium", "tabular")}
      >
        {shown}
      </span>
    </TransitionLink>
  );
}
