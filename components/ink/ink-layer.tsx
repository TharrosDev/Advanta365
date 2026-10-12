"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { createController, type Controller } from "./ink-controller";

const LAYER_ATTRIBUTE = "data-ink-layer";

/**
 * The ink layer: the owner of the one canvas a document may hold. It finds the backdrops of the
 * page (`InkBackdrop`), fetches the engine when one of them comes near the viewport, moves the
 * canvas into the backdrop that matters most on screen and runs its scene there until the water
 * comes to rest. All of that is `ink-controller.ts`; this component mounts it and tells it when the
 * page changes. It renders nothing: the ink is decoration, and the visitor has no control over it
 * besides the operating system's reduced-motion setting.
 *
 * It is a singleton. The site's layout mounts it, and so do the root not-found page and the lab; a
 * second instance finds `data-ink-layer` on the root element and does nothing. Its cleanup destroys
 * the engine and removes the canvas and every attribute it set, so mounting it twice in a row (as
 * React does in development) leaves one layer.
 */
export function InkLayer() {
  const pathname = usePathname();
  const controller = useRef<Controller | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (root.hasAttribute(LAYER_ATTRIBUTE)) return;
    root.setAttribute(LAYER_ATTRIBUTE, "");
    const created = createController();
    controller.current = created;
    return () => {
      controller.current = null;
      created.destroy();
      root.removeAttribute(LAYER_ATTRIBUTE);
    };
  }, []);

  useEffect(() => {
    controller.current?.route(pathname);
  }, [pathname]);

  return null;
}
