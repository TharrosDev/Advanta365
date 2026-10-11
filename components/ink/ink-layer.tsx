"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createController, type Control, type Controller } from "./ink-controller";
import styles from "./ink-layer.module.css";

const LAYER_ATTRIBUTE = "data-ink-layer";

/**
 * The ink layer: the owner of the one canvas a document may hold. It finds the backdrops of the
 * page (`InkBackdrop`), fetches the engine when one of them comes near the viewport, moves the
 * canvas into the backdrop that matters most on screen and runs its scene there until the water
 * comes to rest. All of that is `ink-controller.ts`; this component mounts it, tells it when the
 * page changes, and draws the one thing the layer renders: the pause button, in the holder of the
 * live stage.
 *
 * It is a singleton. The site's layout mounts it, and so do the root not-found page and the lab; a
 * second instance finds `data-ink-layer` on the root element and does nothing. Its cleanup destroys
 * the engine and removes the canvas and every attribute it set, so mounting it twice in a row (as
 * React does in development) leaves one layer.
 */
export function InkLayer() {
  const pathname = usePathname();
  const controller = useRef<Controller | null>(null);
  const [control, setControl] = useState<Control>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (root.hasAttribute(LAYER_ATTRIBUTE)) return;
    root.setAttribute(LAYER_ATTRIBUTE, "");
    const created = createController(setControl);
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

  if (!control) return null;

  return createPortal(
    <button
      type="button"
      data-ink-toggle=""
      aria-label={control.paused ? "Play ink" : "Pause ink"}
      className={styles.toggle}
      onClick={() => controller.current?.toggle()}
    >
      <span className={styles.round}>
        <svg className={styles.glyph} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
          {control.paused ? (
            <path d="M4 2.5v9l7.5-4.5z" />
          ) : (
            <path d="M3.5 2.5h2.5v9H3.5zM8 2.5h2.5v9H8z" />
          )}
        </svg>
      </span>
    </button>,
    control.holder,
  );
}
