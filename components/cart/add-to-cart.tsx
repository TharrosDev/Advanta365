"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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

  // The two controls carry different keys so the swap is a clean remount: the slab's hover
  // sweep does not carry over to the link that replaces it.
  return (
    <>
      {inCart ? (
        <Button key="in-cart" href="/cart" linkRef={linkRef} variant="outline" size="lg" fullWidth>
          In cart — view cart
        </Button>
      ) : (
        <Button
          key="add"
          variant="slab"
          size="lg"
          fullWidth
          onClick={() => {
            setJustAdded(true);
            cart.add(line);
          }}
        >
          {label}
        </Button>
      )}
      <span role="status" className="visually-hidden">
        {justAdded && inCart ? "Added to cart." : ""}
      </span>
    </>
  );
}
