"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { CartLine } from "@/lib/cart/store";
import { useCart } from "./use-cart";

/**
 * The buy control of a purchase panel. It is the solid ink button until the item is in the cart;
 * after that it is an outline link to the cart, with a tick before its label. A status region next
 * to it announces the change.
 */
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

  // The two controls carry different keys so the swap is a clean remount: the button's hover
  // state does not carry over to the link that replaces it.
  return (
    <>
      {inCart ? (
        <Button key="in-cart" href="/cart" linkRef={linkRef} variant="outline" size="lg" fullWidth>
          {/*
            One run of text, so in a narrow panel the tick wraps and centres with the label. The
            inner span keeps the tick and the dash with "In cart" when the label takes two lines.
          */}
          <span>
            <span>
              <Icon name="tick" />
              In cart —
            </span>{" "}
            view cart
          </span>
        </Button>
      ) : (
        <Button
          key="add"
          variant="mark"
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
