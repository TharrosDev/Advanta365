"use client";

import { useEffect } from "react";
import { pruneLines } from "@/lib/cart/store";
import { replaceCartLines, useCart } from "./use-cart";

/**
 * Drops saved cart lines whose template or bundle has left the catalog.
 * Mounted once in the site layout so the header count is right on every page.
 */
export function CartSync({ templates, bundles }: { templates: string[]; bundles: string[] }) {
  const { lines } = useCart();

  useEffect(() => {
    const pruned = pruneLines(lines, {
      templates: new Set(templates),
      bundles: new Set(bundles),
    });
    if (pruned.length !== lines.length) replaceCartLines(pruned);
  }, [lines, templates, bundles]);

  return null;
}
