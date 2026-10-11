"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cssVars, cx } from "@/lib/cx";
import { prefersReducedMotion } from "@/lib/motion/reduced-motion";
import { splitWords } from "@/lib/motion/words";
import styles from "./gather-reveal.module.css";

function resolveInView(entry: IntersectionObserverEntry): boolean {
  return entry.isIntersecting || entry.boundingClientRect.top < 0;
}

/**
 * Writes, on every direct child, how far its centre sits from the container's centre. `offsetLeft`
 * is relative to the root (it is `position: relative`) and ignores transforms, so measuring stays
 * correct while the children are collapsed.
 */
function measure(root: HTMLElement): void {
  const half = root.clientWidth / 2;
  for (const child of Array.from(root.children)) {
    if (!(child instanceof HTMLElement)) continue;
    const shift = child.offsetLeft + child.offsetWidth / 2 - half;
    child.style.setProperty("--reveal-shift", `${shift}px`);
  }
}

/**
 * Gather reveal (the "Built for Microsoft 365" band). Its direct children (a label and a list)
 * start stacked on the centre line and slide apart once the band enters the upper 85% of the
 * viewport.
 * The state lives on the element as `data-reveal="pending" | "in"`, written imperatively. Under
 * reduced motion (and without JS) no attribute is set and the content is simply visible.
 */
export function GatherReveal({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (root.dataset.reveal === "in") return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

    measure(root);
    root.dataset.reveal = "pending";

    // Re-measure while collapsed: fonts, wrapping and the viewport can still change.
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => measure(root));
    resizeObserver?.observe(root);

    let frame = 0;
    const viewObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some(resolveInView)) return;
        viewObserver.disconnect();
        resizeObserver?.disconnect();
        frame = requestAnimationFrame(() => {
          root.dataset.reveal = "in";
        });
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0 },
    );
    viewObserver.observe(root);

    return () => {
      viewObserver.disconnect();
      resizeObserver?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={cx(styles.root, className)}>
      {children}
    </div>
  );
}

/**
 * The label of a gather reveal, one span per word. From the second word on the separating space
 * sits INSIDE the span, so the words fade one by one while the sentence keeps its natural spacing.
 */
export function GatherWords({ text }: { text: string }) {
  const words = splitWords(text).filter((token) => token.kind === "word");
  return (
    <>
      {words.map((word, index) => (
        <span key={index} data-gather="word" style={cssVars({ "--i": index })}>
          {index === 0 ? word.text : ` ${word.text}`}
        </span>
      ))}
    </>
  );
}

/** One fading item of a gather reveal (a chip in the list). `index` drives its stagger. */
export function GatherItem({
  as: Tag = "span",
  index,
  className,
  children,
}: {
  as?: "li" | "span" | "div";
  index: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag data-gather="item" className={className} style={cssVars({ "--i": index })}>
      {children}
    </Tag>
  );
}
