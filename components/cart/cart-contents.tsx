"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TransitionLink } from "@/components/motion/transition-link";
import { Button } from "@/components/ui/button";
import { WipeButton } from "@/components/ui/wipe-button";
import { pruneLines, type CartLine } from "@/lib/cart/store";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./cart-contents.module.css";
import { useCart } from "./use-cart";

export type CartItem = CartLine & { title: string; priceCents: number; href: string };

const keyOf = (line: CartLine) => `${line.kind}:${line.slug}`;

export function CartContents({ items }: { items: CartItem[] }) {
  const cart = useCart();
  const itemsByKey = useMemo(() => new Map(items.map((item) => [keyOf(item), item])), [items]);
  const known = useMemo(
    () => ({
      templates: new Set(items.filter((i) => i.kind === "template").map((i) => i.slug)),
      bundles: new Set(items.filter((i) => i.kind === "bundle").map((i) => i.slug)),
    }),
    [items],
  );

  const lines = pruneLines(cart.lines, known);
  const lineCount = lines.length;

  const listRef = useRef<HTMLUListElement>(null);
  const emptyRef = useRef<HTMLHeadingElement>(null);
  const [removedAt, setRemovedAt] = useState<number | null>(null);

  // Removing a line unmounts the button that had focus; move focus to the
  // line that took its place, or to the empty-cart heading.
  useEffect(() => {
    if (removedAt === null) return;
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("button");
    const next = buttons?.[Math.min(removedAt, buttons.length - 1)];
    (next ?? emptyRef.current)?.focus();
  }, [removedAt, lineCount]);

  if (!cart.ready) {
    return <p className={cx("t-body-large", "c-fg-60", styles.loading)}>Loading your cart…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className={cx("ruled", styles.empty)}>
        <h2 ref={emptyRef} tabIndex={-1} className="t-headline-large">
          Your cart is empty.
        </h2>
        <p className={cx("t-body-large", "c-fg-60", styles.emptyBody)}>
          Browse the catalog or start with a bundle for the phase you are in.
        </p>
        <div className={styles.actions}>
          <WipeButton href="/catalog">Browse the catalog</WipeButton>
          <WipeButton href="/bundles">See bundles</WipeButton>
        </div>
      </div>
    );
  }

  const rows = lines.flatMap((line) => itemsByKey.get(keyOf(line)) ?? []);
  const subtotal = rows.reduce((sum, row) => sum + row.priceCents, 0);

  return (
    <div className={styles.layout}>
      <ul ref={listRef} className={styles.list}>
        {rows.map((row, index) => (
          <li key={keyOf(row)} className={cx("ruled", styles.row)}>
            <div className={styles.item}>
              <p className="t-label-medium c-fg-50">
                {row.kind === "bundle" ? "Bundle" : "Template"}
              </p>
              <TransitionLink href={row.href} className={cx("t-headline-small", styles.title)}>
                {row.title}
              </TransitionLink>
            </div>
            <p className={cx("t-body-large", "tabular", styles.price)}>
              {formatPrice(row.priceCents)}
            </p>
            <Button
              variant="text"
              size="md"
              aria-label={`Remove ${row.title}`}
              onClick={() => {
                setRemovedAt(index);
                cart.remove({ kind: row.kind, slug: row.slug });
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>

      <aside aria-label="Order summary" className={styles.summary}>
        <div className={styles.subtotal}>
          <p className={cx("t-body-large", "c-fg-60")}>Subtotal</p>
          <p className="t-display-small tabular">{formatPrice(subtotal)}</p>
        </div>
        <Button variant="slab" size="lg" fullWidth disabled>
          Checkout — coming soon
        </Button>
        <p className={cx("t-body-medium", "c-fg-60")}>
          Purchasing is not available in this beta. Your cart is saved in this browser.
        </p>
      </aside>
    </div>
  );
}
