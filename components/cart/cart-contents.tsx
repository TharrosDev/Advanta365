"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Blank } from "@/components/ui/blank";
import { Button } from "@/components/ui/button";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { Tally } from "@/components/ui/tally";
import { TextLink } from "@/components/ui/text-link";
import { pruneLines, type CartLine } from "@/lib/cart/store";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./cart-contents.module.css";
import { useCart } from "./use-cart";

export type CartItem = CartLine & { title: string; priceCents: number; href: string };

const keyOf = (line: CartLine) => `${line.kind}:${line.slug}`;

/**
 * The cart page below its title. With lines in it: the lines as a ledger (a small sheet or folder,
 * kind, title, price, Remove) and, beside them from 68em, the order summary on a receipt, a paper
 * sheet with a torn top edge that stays in view. Empty: one blank sheet with a field, the message
 * and two ways on. Until the saved cart has been read it is a single sentence.
 */
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
    return <p className={cx("type-copy", styles.loading)}>Loading your cart…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className={styles.layout}>
        <PaperSheet size="md" className={styles.empty}>
          <Blank size="lg" caret="steady" className={styles.blank} />
          <h2 ref={emptyRef} tabIndex={-1} className={cx("type-section", styles.emptyTitle)}>
            Your cart is empty.
          </h2>
          <p className={cx("type-copy", styles.emptyBody)}>
            Browse the catalog or start with a bundle for the phase you are in.
          </p>
          <div className={styles.actions}>
            <Button variant="mark" href="/catalog">
              Browse the catalog
            </Button>
            <Button variant="outline" href="/bundles">
              See bundles
            </Button>
          </div>
          <Tally total={10} filled={0} size="sm" className={styles.emptyTally} />
        </PaperSheet>
      </div>
    );
  }

  const rows = lines.flatMap((line) => itemsByKey.get(keyOf(line)) ?? []);
  const subtotal = rows.reduce((sum, row) => sum + row.priceCents, 0);

  return (
    <div className={styles.layout}>
      <BandedList ref={listRef} className={styles.list}>
        {rows.map((row, index) => (
          <BandedRow key={keyOf(row)} className={styles.row}>
            {row.kind === "bundle" ? (
              <span aria-hidden="true" className={styles.folder} />
            ) : (
              <PaperSheet
                ratio="portrait"
                size="sm"
                depth={2}
                aria-hidden="true"
                className={styles.glyph}
              />
            )}
            <div className={styles.item}>
              <p className={cx("type-note", styles.kind)}>
                {row.kind === "bundle" ? "Bundle" : "Template"}
              </p>
              <TextLink href={row.href} className={cx("type-item", styles.title)}>
                <KeepCompounds text={row.title} />
              </TextLink>
            </div>
            <p className={cx("type-ui", "tabular", styles.price)}>{formatPrice(row.priceCents)}</p>
            <Button
              variant="text"
              size="md"
              aria-label={`Remove ${row.title}`}
              className={styles.remove}
              onClick={() => {
                setRemovedAt(index);
                cart.remove({ kind: row.kind, slug: row.slug });
              }}
            >
              Remove
            </Button>
          </BandedRow>
        ))}
      </BandedList>

      <PaperSheet
        as="aside"
        size="md"
        depth={3}
        aria-label="Order summary"
        className={styles.summary}
      >
        <p className={cx("type-note", styles.subtotalLabel)}>Subtotal</p>
        <p className={cx("type-amount", "tabular", styles.subtotal)}>{formatPrice(subtotal)}</p>
        <Button variant="mark" size="lg" fullWidth disabled className={styles.checkout}>
          Checkout — coming soon
        </Button>
        <p className={cx("type-note", styles.summaryNote)}>
          Purchasing is not available in this beta. Your cart is saved in this browser.
        </p>
      </PaperSheet>
    </div>
  );
}
