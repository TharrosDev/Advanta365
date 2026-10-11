"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";
import type { RevealTag } from "./reveal";
import styles from "./reveal.module.css";

/** In view, or already scrolled past (page reloaded mid-scroll, anchor jump beyond the group). */
function resolveInView(entry: IntersectionObserverEntry): boolean {
  return entry.isIntersecting || entry.boundingClientRect.top < 0;
}

/**
 * Pause scope for the reveals inside it: they hold their first frame until the group's top edge is
 * 7% above the bottom of the viewport, then play once and never replay. The wrapper has no layout
 * styles; put the grid or flex class on it through `className`.
 */
export function RevealGroup({
  as = "div",
  className,
  children,
  ...rest
}: { as?: RevealTag } & HTMLAttributes<HTMLElement>) {
  // Every RevealTag renders an HTMLElement; the cast only gives the ref one concrete element type.
  const Tag = as as "div";
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Something else (ThemeScroll, an earlier run of this effect) already released the group.
    if (element.dataset.inView !== undefined) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      element.dataset.inView = "";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some(resolveInView)) return;
        element.dataset.inView = "";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={cx(styles.group, className)} data-reveal-group="" {...rest}>
      {children}
    </Tag>
  );
}
