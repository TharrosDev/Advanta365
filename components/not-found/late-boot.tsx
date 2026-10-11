"use client";

import { useEffect } from "react";
import { BOOT_SCRIPT } from "@/lib/boot/boot-script";

/**
 * Runs the boot script on a page that arrived without it. A 404 answered at request time reaches the
 * browser as a document that React builds there, and the inline script of the root layout is inert
 * in such a document: the root element never gets `data-ink` or `data-motion`, so the ink would
 * stay a still and nothing would know motion is wanted. This puts the same script in the head as a
 * script element of our own, which the browser does run, and takes it out again. A page that
 * already has the script (it has `data-ink`) is left alone, and so is every later visit to this
 * component in the same document. It renders nothing.
 */
export function LateBoot() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.hasAttribute("data-ink")) return;
    const script = document.createElement("script");
    script.textContent = BOOT_SCRIPT;
    document.head.append(script);
    script.remove();
  }, []);

  return null;
}
