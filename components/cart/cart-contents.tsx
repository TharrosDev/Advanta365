"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TemplateCover } from "@/components/catalog/template-cover";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Blank } from "@/components/ui/blank";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { Tally } from "@/components/ui/tally";
import { TextLink } from "@/components/ui/text-link";
import {
  cartSubtotalCents,
  coveredLines,
  pruneLines,
  type BundleContents,
  type CartLine,
} from "@/lib/cart/store";
import type { CoverSpec } from "@/lib/catalog/covers";
import { cssVars, cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./cart-contents.module.css";
import { useCart } from "./use-cart";

/**
 * A catalog entry as the cart needs it; a bundle also names the templates it holds. `covers` is
 * what the line draws at its head: a template's own cover, or the first three a bundle holds.
 */
export type CartItem = CartLine & {
  title: string;
  priceCents: number;
  href: string;
  templateSlugs?: readonly string[];
  covers?: readonly CoverSpec[];
};

const keyOf = (line: CartLine) => `${line.kind}:${line.slug}`;

/**
 * The cart page below its title. With lines in it: the lines as a ledger (the template's small
 * cover, or a small folder with the bundle's first covers standing in it; kind, title, price, Remove) and, beside them from 68em, the order summary on a receipt, a paper
 * sheet with a torn top edge that stays in view. Empty: one blank sheet with a field, the message
 * and two ways on. Until the saved cart has been read it is a single sentence.
 *
 * A template that a bundle in the same cart already holds stays in the ledger, with Remove, but
 * says "Included in" that bundle, shows its price struck through and is left out of the subtotal.
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
  const contents = useMemo<BundleContents>(
    () =>
      Object.fromEntries(
        items.flatMap((i) => (i.kind === "bundle" ? [[i.slug, i.templateSlugs ?? []]] : [])),
      ),
    [items],
  );

  const lines = pruneLines(cart.lines, known);
  const lineCount = lines.length;

  const listRef = useRef<HTMLUListElement>(null);
  const emptyRef = useRef<HTMLHeadingElement>(null);
  const [removedAt, setRemovedAt] = useState<number | null>(null);

  // Removing a line unmounts the button that holds focus; move focus to the
  // line that takes its place, or to the empty-cart heading.
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
  const covered = coveredLines(lines, contents);
  const subtotal = cartSubtotalCents(
    lines,
    (line) => itemsByKey.get(keyOf(line))?.priceCents,
    contents,
  );

  return (
    <div className={styles.layout}>
      <BandedList ref={listRef} className={styles.list}>
        {rows.map((row, index) => {
          // The bundle in the cart that already holds this template, if any.
          const holderSlug = row.kind === "template" ? covered.get(row.slug) : undefined;
          const holder = holderSlug
            ? itemsByKey.get(keyOf({ kind: "bundle", slug: holderSlug }))
            : undefined;
          return (
            <BandedRow key={keyOf(row)} className={styles.row}>
              {row.kind === "bundle" ? (
                <MiniFolder covers={row.covers ?? []} />
              ) : row.covers?.[0] ? (
                <span className={styles.glyph}>
                  <TemplateCover
                    type={row.covers[0].type}
                    format={row.covers[0].format}
                    phaseOrder={row.covers[0].phaseOrder}
                    size="sm"
                  />
                </span>
              ) : (
                <PaperSheet
                  ratio="portrait"
                  size="sm"
                  depth={2}
                  aria-hidden="true"
                  className={cx(styles.glyph, styles.sheet)}
                />
              )}
              <div className={styles.item}>
                <p className={cx("type-note", styles.kind)}>
                  {row.kind === "bundle" ? "Bundle" : "Template"}
                </p>
                <TextLink href={row.href} className={cx("type-item", styles.title)}>
                  <KeepCompounds text={row.title} />
                </TextLink>
                {holder && (
                  <p className={cx("type-note", styles.included)}>
                    <Icon name="tick" size={17} className={styles.includedTick} />
                    <span>
                      Included in <TextLink href={holder.href}>{holder.title}</TextLink>
                    </span>
                  </p>
                )}
              </div>
              {holder ? (
                <p className={cx("type-ui", "tabular", styles.price, styles.waived)}>
                  <span className="visually-hidden">{`${formatPrice(row.priceCents)}, not charged`}</span>
                  <s aria-hidden="true">{formatPrice(row.priceCents)}</s>
                </p>
              ) : (
                <p className={cx("type-ui", "tabular", styles.price)}>
                  {formatPrice(row.priceCents)}
                </p>
              )}
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
          );
        })}
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
        {covered.size > 0 && (
          <p className={cx("type-note", styles.summaryNote, styles.coveredNote)}>
            {covered.size === 1
              ? "Leaves out 1 template already in a bundle."
              : `Leaves out ${covered.size} templates already in a bundle.`}
          </p>
        )}
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

/**
 * A bundle's line head: a folder the size of a thumbnail, its back panel and tab in the wash, the
 * covers standing in it as in a large folder (without their tags, which would not fit), and
 * the front panel over their feet.
 */
function MiniFolder({ covers }: { covers: readonly CoverSpec[] }) {
  return (
    <span aria-hidden="true" className={styles.folder}>
      {covers.map((cover, index) => (
        <span
          key={cover.slug}
          className={styles.standing}
          style={cssVars({ "--n": index, "--x": covers.length - 1 - index })}
        >
          <TemplateCover
            type={cover.type}
            format={cover.format}
            size="sm"
            fill="height"
            tagClassName={styles.miniTag}
          />
        </span>
      ))}
      <span className={styles.folderFront} />
    </span>
  );
}
