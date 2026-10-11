"use client";

import { useEffect, useRef } from "react";

import { cx } from "@/lib/cx";
import { claimReady } from "@/lib/motion/page-ready";
import { prefersReducedMotion, usePrefersReducedMotion } from "@/lib/motion/reduced-motion";
import { splitWords } from "@/lib/motion/words";

import styles from "./sheen-text.module.css";

/**
 * One word whose glyphs carry the drifting light band. The text exists exactly once in the DOM:
 * until WebGL is live (and for good under reduced motion or without WebGL2) the text span shows a
 * static gradient clipped to the glyphs; once live it turns transparent and the canvas takes over.
 */
export function SheenWord({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    // `reduced` is false during hydration, so the real preference is read here as well.
    if (!el || reduced || prefersReducedMotion()) return;

    let cancelled = false;
    let detach: (() => void) | null = null;
    let release: (() => void) | null = null;
    const settle = () => {
      const pending = release;
      release = null;
      pending?.();
    };

    // Only a word above the fold holds the page-ready gate (it matters on the home intro only).
    const box = el.getBoundingClientRect();
    if ((box.width > 0 || box.height > 0) && box.top < window.innerHeight) release = claimReady();

    void (async () => {
      try {
        const engine = await import("./sheen-engine");
        if (cancelled) return;
        detach = engine.attach(el, {
          onLive: (live) => {
            el.toggleAttribute("data-live", live);
            settle();
          },
        });
      } catch {
        settle();
      }
    })();

    return () => {
      cancelled = true;
      detach?.();
      settle();
      el.removeAttribute("data-live");
    };
  }, [children, reduced]);

  return (
    <span ref={ref} data-sheen-word="" className={styles.word}>
      <span className={styles.text}>{children}</span>
      <span className={styles.probe} />
      <canvas className={styles.canvas} aria-hidden="true" />
    </span>
  );
}

/** Splits a string into sheen words; the whitespace between them stays plain text. */
export function SheenText({ children, className }: { children: string; className?: string }) {
  return (
    <span className={cx(styles.root, className)}>
      {splitWords(children).map((token, position) =>
        token.kind === "space" ? token.text : <SheenWord key={position}>{token.text}</SheenWord>,
      )}
    </span>
  );
}
