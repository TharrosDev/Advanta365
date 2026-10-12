"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { scrollCurrentIntoView } from "@/lib/scroll/into-view";

/**
 * The phones' row of phases on the catalog. The row scrolls sideways, so when the catalog is
 * filtered on a phase near the end of the list the lit card would start out of view: the row is
 * scrolled to it once it is drawn, and again when the phase changes. Without script the row is
 * complete and simply starts at the first phase.
 */
export function PhaseStrip({
  label,
  current,
  className,
  children,
}: {
  label: string;
  current?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const row = ref.current?.querySelector("ul");
    if (!row) return;
    scrollCurrentIntoView(row);
    // The cards widen when the web fonts arrive, which can push the lit one back out of view.
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) scrollCurrentIntoView(row);
    });
    return () => {
      live = false;
    };
  }, [current]);

  return (
    <nav ref={ref} aria-label={label} className={className}>
      {children}
    </nav>
  );
}
