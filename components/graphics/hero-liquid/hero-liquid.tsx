"use client";

import { useEffect, useRef, useState } from "react";

import { cx } from "@/lib/cx";
import { claimReady } from "@/lib/motion/page-ready";
import { prefersReducedMotion, usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

import { BRANCHES, STROKE_WIDTH, VIEWBOX_HEIGHT, VIEWBOX_WIDTH, branchPathD } from "./geometry";
import styles from "./hero-liquid.module.css";
import { chooseMaskWidth, loadLiquidMask } from "./mask-loader";
import type { LiquidRenderer } from "./renderer";

type LiquidState = "loading" | "active" | "fallback";

/**
 * Flat fallback tones, one per branch in paint order: the branch greys 32 / 132 / 56 / 0 expressed
 * as opacities of the foreground token, so the bands follow the theme.
 */
const LINE_OPACITY = [0.87, 0.47, 0.78, 1] as const;

const LINES = BRANCHES.map((_, index) => ({
  d: branchPathD(index),
  opacity: LINE_OPACITY[index] ?? 1,
}));

/**
 * Canvases whose renderer was disposed. Disposing gives the WebGL context back for good, so when the
 * effect runs again on such a canvas (a prop change, reduced motion switched off again, a hot reload)
 * the component swaps in a fresh one instead of drawing into a dead context.
 */
const spentCanvases = new WeakSet<HTMLCanvasElement>();

/**
 * Chrome ribbons behind the home hero: a flat SVG of the four bands plus the WebGL canvas that
 * replaces it once its first frame is drawn. Both are absolutely positioned and inert; the parent
 * must be `position: relative; overflow-x: clip` and the content after it `position: relative`.
 *
 * The SVG is the fallback for reduced motion, missing WebGL2, a failed mask or shader and a lost
 * context. With `intro` (the default) it stays hidden while the canvas loads, so the flat bands
 * never flash before the draw-in.
 */
export function HeroLiquid({
  intro = true,
  shadeFloor = 0.35,
}: {
  intro?: boolean;
  shadeFloor?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<LiquidState>("loading");
  /** Bumped to replace a spent canvas; it is the canvas key and re-runs the effect. */
  const [generation, setGeneration] = useState(0);

  // Reduced motion is derived, never stored: no state update, no WebGL, no mask.
  const fallback = reduced || state === "fallback";
  const active = !fallback && state === "active";
  const linesHidden = !fallback && (state === "active" || intro);

  useEffect(() => {
    if (reduced) return;
    // The hydration render still reports "no preference"; ask the media query before starting work.
    if (prefersReducedMotion()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let renderer: LiquidRenderer | null = null;
    // The entry overlay waits for the first frame. Released on every path: frame, error, unmount.
    const release = claimReady();

    const fail = () => {
      release();
      if (!cancelled) setState("fallback");
    };

    const start = async () => {
      const [mask, { createLiquidRenderer }] = await Promise.all([
        loadLiquidMask({ width: chooseMaskWidth(), shadeFloor }),
        import("./renderer"),
      ]);
      if (cancelled) return;
      if (spentCanvases.has(canvas)) {
        // Ask for a fresh canvas. The re-run of this effect releases the claim and starts over.
        setGeneration((current) => current + 1);
        return;
      }
      renderer = createLiquidRenderer(canvas, mask, {
        intro,
        onActive: () => {
          release();
          if (!cancelled) setState("active");
        },
        onError: fail,
      });
    };
    start().catch(fail);

    return () => {
      cancelled = true;
      release();
      if (renderer) {
        renderer.dispose();
        renderer = null;
        spentCanvases.add(canvas);
      }
    };
  }, [reduced, intro, shadeFloor, generation]);

  return (
    <>
      <svg
        data-hero-lines=""
        className={cx(styles.lines, linesHidden && styles.linesHidden)}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {LINES.map((line) => (
          <path
            key={line.d}
            d={line.d}
            stroke="var(--color-foreground-100)"
            strokeOpacity={line.opacity}
            strokeWidth={STROKE_WIDTH}
          />
        ))}
      </svg>
      <canvas
        key={generation}
        ref={canvasRef}
        data-hero-liquid=""
        className={styles.liquid}
        data-active={active ? "true" : "false"}
        hidden={fallback}
        aria-hidden="true"
      />
    </>
  );
}
