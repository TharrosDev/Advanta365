"use client";

import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { TransitionLink } from "@/components/ui/transition-link";

/**
 * The brand link of the bar: a plain link to the home page from every other page, and, on the home
 * page itself, a return-to-top button. A click there scrolls the page back to its top (at once
 * under `prefers-reduced-motion`, smoothly otherwise) and goes nowhere: no navigation, no history
 * entry, and an address with a query or a hash keeps it. A click with a modifier key, a middle or
 * right click, or one on a link that opens elsewhere is left to the browser, so "open in a new tab"
 * keeps working. A client component only because it reads the pathname.
 */
export function BrandLink({ onClick, ...rest }: ComponentProps<typeof TransitionLink>) {
  const pathname = usePathname();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || pathname !== "/") return;
    const plain =
      event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
    if (!plain || (event.currentTarget.target && event.currentTarget.target !== "_self")) return;
    event.preventDefault();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, left: 0, behavior: still ? "instant" : "smooth" });
  }

  return <TransitionLink {...rest} onClick={handleClick} />;
}
