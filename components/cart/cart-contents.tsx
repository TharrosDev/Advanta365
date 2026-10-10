"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { pruneLines, type CartLine } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format";
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
    return <p className="text-muted mt-10">Loading your cart…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="border-ink/25 mt-10 rounded-lg border border-dashed px-6 py-16 text-center">
        <h2 ref={emptyRef} tabIndex={-1} className="text-xl font-semibold">
          Your cart is empty.
        </h2>
        <p className="text-muted mx-auto mt-2 max-w-sm text-sm">
          Browse the catalog or start with a bundle for the phase you are in.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/catalog">Browse the catalog</Button>
          <Button href="/bundles" variant="secondary">
            See bundles
          </Button>
        </div>
      </div>
    );
  }

  const rows = lines.flatMap((line) => itemsByKey.get(keyOf(line)) ?? []);
  const subtotal = rows.reduce((sum, row) => sum + row.priceCents, 0);

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
      <ul ref={listRef} className="divide-rule border-rule divide-y border-y">
        {rows.map((row, index) => (
          <li
            key={keyOf(row)}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4"
          >
            <div className="min-w-0">
              <p className="text-accent text-xs font-medium uppercase">
                {row.kind === "bundle" ? "Bundle" : "Template"}
              </p>
              <Link
                href={row.href}
                className="font-display text-lg font-semibold break-words underline-offset-4 hover:underline"
              >
                {row.title}
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold tabular-nums">{formatPrice(row.priceCents)}</span>
              <button
                type="button"
                className={buttonClass("ghost", "md")}
                aria-label={`Remove ${row.title}`}
                onClick={() => {
                  setRemovedAt(index);
                  cart.remove({ kind: row.kind, slug: row.slug });
                }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <aside aria-label="Order summary" className="lg:self-start">
        <div className="border-rule bg-surface rounded-lg border p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="font-display text-3xl font-semibold tabular-nums">
              {formatPrice(subtotal)}
            </span>
          </div>
          <button type="button" disabled className={buttonClass("primary", "lg", "mt-5 w-full")}>
            Checkout — coming soon
          </button>
          <p className="text-muted mt-3 text-sm">
            Purchasing is not available in this beta. Your cart is saved in this browser.
          </p>
        </div>
      </aside>
    </div>
  );
}
