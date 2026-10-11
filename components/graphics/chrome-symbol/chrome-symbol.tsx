"use client";

import { useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { LogoMark } from "@/components/ui/logo-mark";
import { cssVars, cx } from "@/lib/cx";
import { prefersReducedMotion, usePrefersReducedMotion } from "@/lib/motion/reduced-motion";
import {
  CHROME_SYMBOL_DEFAULTS,
  CHROME_SYMBOL_PAD_X,
  CHROME_SYMBOL_PAD_Y,
  type ChromeSymbolParams,
} from "./constants";
import type { ChromeSymbolSession } from "./session";
import styles from "./chrome-symbol.module.css";

export type ChromeSymbolHandle = {
  /**
   * Asks the symbol to stop spinning and settle facing front; `onLanded` follows. Only the first
   * call counts. When the flat glyph is showing (reduced motion, no WebGL) `onLanded` fires
   * immediately.
   */
  land(): void;
  /** Defaults + `params` prop + `setParams` overrides. `fit` is 1 while the flat glyph is showing. */
  getParams(): ChromeSymbolParams;
  /** Remembered, and applied to the running session. */
  setParams(partial: Partial<ChromeSymbolParams>): void;
};

/** Device-pixel-ratio cap of the drawing buffer. */
const MAX_PIXEL_RATIO = 2;

const PAD_STYLE = cssVars({
  "--chrome-symbol-pad-x": CHROME_SYMBOL_PAD_X,
  "--chrome-symbol-pad-y": CHROME_SYMBOL_PAD_Y,
});

/**
 * The Advanta365 mark as a bevelled chrome solid, ray-marched in WebGL2.
 *
 * The flat `LogoMark` is always rendered: it is the layout box (sized by `height`) and the
 * fallback. The canvas lies over it and takes over once its first frame is drawn (`data-live`).
 * Without WebGL2, after a link error or a lost context the root gets `data-failed` and the flat
 * glyph shows; under reduced motion no session is created at all.
 *
 * The renderer is loaded with a dynamic import and created one frame later, so a mount that is
 * torn down straight away never touches the canvas.
 */
export function ChromeSymbol({
  height = "1em",
  intro = false,
  spin = false,
  params,
  onLive,
  onLanded,
  className,
  ref,
}: {
  /** CSS height of the glyph box; the width follows the mark's 4:3 box. */
  height?: string;
  /** Play the intro (edge-on bar that swells, then turns to face front). */
  intro?: boolean;
  /** After the intro keep turning until `land()` is called. */
  spin?: boolean;
  params?: Partial<ChromeSymbolParams>;
  /** true after the first drawn frame; false on failure or context loss. */
  onLive?: (live: boolean) => void;
  /** At most once. */
  onLanded?: () => void;
  className?: string;
  ref?: React.Ref<ChromeSymbolHandle>;
}) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<ChromeSymbolSession | null>(null);
  const latest = useRef({ params, onLive, onLanded });
  const overrides = useRef<Partial<ChromeSymbolParams>>({});
  const flat = useRef(false);
  const landRequested = useRef(false);
  const landed = useRef(false);

  useEffect(() => {
    latest.current = { params, onLive, onLanded };
  });

  const deliverLanded = useCallback(() => {
    if (landed.current) return;
    landed.current = true;
    latest.current.onLanded?.();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      land() {
        if (landRequested.current) return;
        landRequested.current = true;
        if (flat.current) deliverLanded();
        else sessionRef.current?.land();
      },
      getParams() {
        const merged = {
          ...CHROME_SYMBOL_DEFAULTS,
          ...latest.current.params,
          ...overrides.current,
        };
        return flat.current ? { ...merged, fit: 1 } : merged;
      },
      setParams(partial) {
        overrides.current = { ...overrides.current, ...partial };
        sessionRef.current?.setParams(partial);
      },
    }),
    [deliverLanded],
  );

  useEffect(() => {
    sessionRef.current?.setParams({ ...CHROME_SYMBOL_DEFAULTS, ...params, ...overrides.current });
  }, [params]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    // The hook reports false while hydrating, so the preference is also read directly: a visitor
    // who asked for reduced motion never downloads the renderer.
    const still = reduced || prefersReducedMotion();
    flat.current = still;
    if (still) {
      // The flat glyph is the symbol. A landing that was asked for earlier is answered now.
      if (landRequested.current) deliverLanded();
      return;
    }

    let cancelled = false;
    let creationFrame = 0;
    let session: ChromeSymbolSession | null = null;
    let inView = true;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    const fail = () => {
      flat.current = true;
      root.removeAttribute("data-live");
      root.setAttribute("data-failed", "");
      latest.current.onLive?.(false);
      if (landRequested.current) deliverLanded();
    };

    // Layout size, not the bounding rect: an ancestor's transform (the entry overlay scales its
    // dock) must not shrink the drawing buffer.
    const measure = () => {
      if (!session) return;
      const style = window.getComputedStyle(canvas);
      let width = Number.parseFloat(style.width);
      let height = Number.parseFloat(style.height);
      if (!(width > 0) || !(height > 0)) {
        const rect = canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
      }
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      session.resize(
        Math.max(1, Math.round(width * ratio)),
        Math.max(1, Math.round(height * ratio)),
      );
    };

    const syncVisibility = () => {
      session?.setVisible(inView && document.visibilityState === "visible");
    };

    const start = (createSession: typeof import("./session").createSession) => {
      creationFrame = 0;
      if (cancelled) return;

      session = createSession(canvas, {
        params: { ...CHROME_SYMBOL_DEFAULTS, ...latest.current.params, ...overrides.current },
        intro,
        spin,
        onLive: (live) => {
          if (cancelled) return;
          if (!live) {
            fail();
            return;
          }
          root.setAttribute("data-live", "");
          latest.current.onLive?.(true);
        },
        onLanded: () => {
          if (!cancelled) deliverLanded();
        },
      });
      if (!session) {
        fail();
        return;
      }
      sessionRef.current = session;

      measure();
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(root);
      }
      if (typeof IntersectionObserver !== "undefined") {
        intersectionObserver = new IntersectionObserver((entries) => {
          const last = entries[entries.length - 1];
          if (!last) return;
          inView = last.isIntersecting;
          syncVisibility();
        });
        intersectionObserver.observe(canvas);
      }
      window.addEventListener("resize", measure);
      document.addEventListener("visibilitychange", syncVisibility);
      syncVisibility();

      if (landRequested.current) session.land();
    };

    import("./session").then(
      (module) => {
        if (cancelled) return;
        creationFrame = requestAnimationFrame(() => start(module.createSession));
      },
      () => {
        if (!cancelled) fail();
      },
    );

    return () => {
      cancelled = true;
      if (creationFrame !== 0) cancelAnimationFrame(creationFrame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", syncVisibility);
      session?.dispose();
      sessionRef.current = null;
      flat.current = false;
      root.removeAttribute("data-live");
      root.removeAttribute("data-failed");
    };
  }, [intro, spin, reduced, deliverLanded]);

  return (
    <span
      ref={rootRef}
      data-chrome-symbol=""
      className={cx(styles.root, className)}
      style={PAD_STYLE}
    >
      <LogoMark height={height} className={styles.glyph} />
      {/* A canvas whose context was released cannot be reused: a new session gets a new element. */}
      <canvas
        key={`${intro}|${spin}|${reduced}`}
        ref={canvasRef}
        className={styles.canvas}
        aria-hidden="true"
      />
    </span>
  );
}
