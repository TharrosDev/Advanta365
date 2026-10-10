"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import type { CartLine } from "@/lib/cart/store";
import { useCart } from "./use-cart";

export function AddToCart({ line, label = "Add to cart" }: { line: CartLine; label?: string }) {
  const cart = useCart();

  if (cart.ready && cart.has(line)) {
    return (
      <Link href="/cart" className={buttonClass("secondary", "lg", "w-full")}>
        In cart — view cart
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={buttonClass("primary", "lg", "w-full")}
      onClick={() => cart.add(line)}
    >
      {label}
    </button>
  );
}
