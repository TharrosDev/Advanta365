"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import type { CartLine } from "@/lib/cart/store";
import { useCart } from "./use-cart";

export function AddToCart({ line, label = "Add to cart" }: { line: CartLine; label?: string }) {
  const cart = useCart();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [justAdded, setJustAdded] = useState(false);
  const inCart = cart.ready && cart.has(line);

  // The button is replaced by a link once the item is in the cart; keep
  // keyboard focus on the control that took its place.
  useEffect(() => {
    if (justAdded && inCart) linkRef.current?.focus();
  }, [justAdded, inCart]);

  return (
    <>
      {inCart ? (
        <Link ref={linkRef} href="/cart" className={buttonClass("secondary", "lg", "w-full")}>
          In cart — view cart
        </Link>
      ) : (
        <button
          type="button"
          className={buttonClass("primary", "lg", "w-full")}
          onClick={() => {
            setJustAdded(true);
            cart.add(line);
          }}
        >
          {label}
        </button>
      )}
      <span role="status" className="sr-only">
        {justAdded && inCart ? "Added to cart." : ""}
      </span>
    </>
  );
}
