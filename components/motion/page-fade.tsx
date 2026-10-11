"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { durations } from "@/lib/motion/durations";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";
import styles from "./page-fade.module.css";

type FadeState = "idle" | "cover" | "hold" | "reveal";

/** Fade to the background colour before the router is asked to navigate. */
const COVER_MS = durations.slow;
/** From the new pathname to `idle`: the 300ms fade-out plus 100ms of slack. */
const UNCOVER_MS = durations.slow + 100;
/** If the pathname never changes after a cover, uncover anyway. */
const HOLD_FAILSAFE_MS = 4000;

type Pending = { frame: number; idle: number };

function clearPending(pending: Pending): void {
  cancelAnimationFrame(pending.frame);
  window.clearTimeout(pending.idle);
  pending.frame = 0;
  pending.idle = 0;
}

/** Assigned by the mounted `PageFade`; null when none is mounted. No context, no events. */
let cover: (() => Promise<void>) | null = null;

/**
 * Fades the page out and resolves when it is covered (300ms). Resolves immediately when no
 * `PageFade` is mounted and under reduced motion (no fade at all), so navigation never depends on
 * the fade.
 */
export function coverPage(): Promise<void> {
  if (!cover || prefersReducedMotion()) return Promise.resolve();
  return cover();
}

/** The route fade layer. Rendered once, by the site layout, at the end of `<body>`. */
export function PageFade() {
  const pathname = usePathname();
  const [state, setState] = useState<FadeState>("idle");
  /** Pathname at the moment the cover started; null when no fade is in flight. */
  const fromPath = useRef<string | null>(null);
  const pending = useRef<Pending>({ frame: 0, idle: 0 });

  useEffect(() => {
    const timers = pending.current;
    cover = () => {
      // A new cover wins over an uncover that is still running.
      clearPending(timers);
      fromPath.current = window.location.pathname;
      setState("cover");
      return new Promise<void>((resolve) => {
        // Deliberately not cancelled on unmount: the caller's navigation waits on this promise.
        window.setTimeout(() => {
          setState((previous) => (previous === "cover" ? "hold" : previous));
          resolve();
        }, COVER_MS);
      });
    };
    return () => {
      cover = null;
      clearPending(timers);
    };
  }, []);

  // The new route has committed: jump to the top, then lift the cover on the next frame.
  useEffect(() => {
    const from = fromPath.current;
    if (from === null || pathname === from) return;
    fromPath.current = null;
    if (!window.location.hash) window.scrollTo(0, 0);

    // Kept in a ref instead of this effect's cleanup: a second pathname change inside the 400ms
    // (Back right after a link) must not cancel the uncover and leave the layer up.
    const timers = pending.current;
    clearPending(timers);
    timers.frame = requestAnimationFrame(() => setState("reveal"));
    timers.idle = window.setTimeout(() => setState("idle"), UNCOVER_MS);
  }, [pathname]);

  // Failsafe: the navigation never changed the pathname (redirect back, failed request).
  useEffect(() => {
    if (state !== "hold") return;
    const timers = pending.current;
    const failsafe = window.setTimeout(() => {
      fromPath.current = null;
      setState("reveal");
      window.clearTimeout(timers.idle);
      timers.idle = window.setTimeout(() => setState("idle"), UNCOVER_MS);
    }, HOLD_FAILSAFE_MS);
    return () => window.clearTimeout(failsafe);
  }, [state]);

  return (
    <div
      aria-hidden="true"
      data-page-fade=""
      data-state={state}
      className={cx(
        styles.root,
        (state === "cover" || state === "hold") && styles.covered,
        state === "idle" && styles.idle,
      )}
    />
  );
}
