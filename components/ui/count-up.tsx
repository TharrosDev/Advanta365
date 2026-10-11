"use client";

import { useEffect, useRef } from "react";
import { cssVars, cx } from "@/lib/cx";
import { hasArrived, whenSeen } from "@/lib/scroll/observe";
import styles from "./count-up.module.css";

const FALLBACK_MS = 1200;

/** `--time-count` as milliseconds. */
function countTime(element: Element): number {
  const value = getComputedStyle(element).getPropertyValue("--time-count").trim();
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount <= 0) return FALLBACK_MS;
  return value.endsWith("ms") ? amount : amount * 1000;
}

/**
 * A figure that counts. The server renders the final number, in a box as wide as its digits, so
 * nothing moves around it. If the figure is below the fold when the page mounts it counts up from
 * 0 once, when 40% of it is in view, and ends on the exact text; a figure that is in view at mount
 * is left alone, and so is every figure where movement is off.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const text = String(value);

  useEffect(() => {
    const element = ref.current;
    const node = element?.firstChild;
    if (!element || !node) return;
    if (document.documentElement.getAttribute("data-motion") !== "on") return;
    if (hasArrived(element)) return;

    let frame = 0;
    const stop = whenSeen(element, 0.4, () => {
      const duration = countTime(element);
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - progress) ** 3;
        node.nodeValue = progress < 1 ? String(Math.round(value * eased)) : text;
        frame = progress < 1 ? requestAnimationFrame(tick) : 0;
      };
      node.nodeValue = "0";
      frame = requestAnimationFrame(tick);
    });

    return () => {
      stop();
      if (frame !== 0) cancelAnimationFrame(frame);
      node.nodeValue = text;
    };
  }, [value, text]);

  return (
    <span
      ref={ref}
      className={cx(styles.root, className)}
      style={cssVars({ "--digits": text.length })}
    >
      {text}
    </span>
  );
}
