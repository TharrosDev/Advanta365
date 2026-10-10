"use client";

import Link from "next/link";
import { useCart } from "./use-cart";

export function CartButton() {
  const { count, ready } = useCart();
  const shown = ready ? count : 0;

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${shown} ${shown === 1 ? "item" : "items"}`}
      className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-accent-soft"
    >
      Cart
      <span
        aria-hidden="true"
        className={`inline-flex min-w-6 justify-center rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
          shown > 0 ? "bg-accent text-accent-ink" : "bg-rule text-muted"
        }`}
      >
        {shown}
      </span>
    </Link>
  );
}
