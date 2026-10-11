"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { cx } from "@/lib/cx";
import { claimReady } from "@/lib/motion/page-ready";
import { prefersReducedMotion, usePrefersReducedMotion } from "@/lib/motion/reduced-motion";
import { METALLIC_SWIRL_DEFAULTS, type SwirlParams } from "./params";
import type { MetallicSwirlRenderer } from "./renderer";
import styles from "./metallic-swirl.module.css";

export type MetallicSwirlHandle = {
  /** Merges values over the current parameters (they win over the `params` prop). */
  setParams(p: Partial<SwirlParams>): void;
  /** Sets an extra shader-time offset; eased unless `immediate` (or under reduced motion). */
  setTimeOffset(t: number, opts?: { immediate?: boolean }): void;
};

/**
 * The swirl canvas. It renders exactly one element and fills its parent box, so the caller decides
 * where it sits (e.g. `className` with `position: absolute; inset: 0`). The canvas stays transparent
 * until the first frame is drawn, then fades in; if WebGL2 is unavailable, linking fails or the
 * context is lost it is simply hidden and the page shows its plain background.
 *
 * The WebGL code is loaded after hydration with a dynamic import. Calls made through the handle
 * before the renderer exists are remembered and applied when it is created.
 */
export function MetallicSwirl({
  params,
  className,
  ref,
}: {
  params?: Partial<SwirlParams>;
  className?: string;
  ref?: Ref<MetallicSwirlHandle>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MetallicSwirlRenderer | null>(null);
  const propsRef = useRef<Partial<SwirlParams> | undefined>(undefined);
  const overridesRef = useRef<Partial<SwirlParams>>({});
  const offsetRef = useRef<number | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const reduced = usePrefersReducedMotion();

  useImperativeHandle(
    ref,
    () => ({
      setParams(partial) {
        overridesRef.current = { ...overridesRef.current, ...partial };
        rendererRef.current?.setParams(partial);
      },
      setTimeOffset(target, opts) {
        offsetRef.current = target;
        rendererRef.current?.setTimeOffset(target, opts);
      },
    }),
    [],
  );

  // Prop changes. Declared before the mount effect so `propsRef` is filled when the renderer is made.
  useEffect(() => {
    propsRef.current = params;
    rendererRef.current?.setParams({
      ...METALLIC_SWIRL_DEFAULTS,
      ...params,
      ...overridesRef.current,
    });
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let renderer: MetallicSwirlRenderer | null = null;
    // Claimed on every mount (reduced motion included): the first frame is part of "page ready".
    const release = claimReady();

    const fail = () => {
      release();
      if (!cancelled) setState("failed");
    };

    import("./renderer")
      .then(({ createMetallicSwirlRenderer }) => {
        if (cancelled) return;
        renderer = createMetallicSwirlRenderer(canvas, {
          params: { ...METALLIC_SWIRL_DEFAULTS, ...propsRef.current, ...overridesRef.current },
          animated: !prefersReducedMotion(),
          onReady: () => {
            release();
            if (!cancelled) setState("ready");
          },
          onError: fail,
        });
        rendererRef.current = renderer;
        // Nothing has been drawn yet, so a queued offset is applied without easing.
        if (offsetRef.current !== null) {
          renderer.setTimeOffset(offsetRef.current, { immediate: true });
        }
      })
      .catch(fail);

    return () => {
      cancelled = true;
      release();
      rendererRef.current = null;
      renderer?.dispose();
    };
  }, []);

  // Follows a change of the reduced-motion preference while the page is open.
  useEffect(() => {
    rendererRef.current?.setAnimated(!reduced);
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      data-swirl-canvas=""
      className={cx(styles.canvas, className)}
      data-ready={state === "ready" ? "true" : "false"}
      hidden={state === "failed"}
      aria-hidden="true"
    />
  );
}
