"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";

/**
 * Reveal-on-scroll driven by IntersectionObserver — deliberately independent
 * of the smooth-scroll / ScrollTrigger refresh lifecycle, which is fragile to
 * compute (stale trigger positions leave content stuck hidden).
 * IntersectionObserver answers "is it in view?" natively and reliably; GSAP
 * only runs the tween for easing + stagger.
 *
 * Attach the returned ref to a wrapper. Reveals:
 *  - `[data-reveal-group]` → its `[data-reveal]` children, staggered as one;
 *  - standalone `[data-reveal]`;
 *  - `.split-word` fragments inside `[data-split]` headings.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(): RefObject<T | null> {
  const scope = useRef<T>(null);

  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    if (prefersReducedMotion()) return; // CSS already shows the final state

    const tweens: gsap.core.Tween[] = [];
    // Everything observed but not yet revealed — the fast-scroll catch-up
    // sweep below force-completes any of these that end up fully above the
    // viewport (a violent scroll can fly an element through the viewport
    // between IntersectionObserver ticks, which would otherwise leave it
    // hidden until it re-enters).
    const pending = new Set<HTMLElement>();

    const revealGroup = (group: HTMLElement) => {
      const items = group.querySelectorAll<HTMLElement>("[data-reveal]");
      if (!items.length) return;
      tweens.push(
        gsap.to(items, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: EASE,
          stagger: 0.06,
        }),
      );
    };

    const revealSolo = (node: HTMLElement) => {
      tweens.push(
        gsap.to(node, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: EASE,
        }),
      );
    };

    const revealSplit = (node: HTMLElement) => {
      const words = node.querySelectorAll<HTMLElement>(".split-word");
      if (!words.length) return;
      // fromTo pins the start so GSAP never has to read a % transform from
      // the computed matrix, and `y: 0` clears the pixel offset it parses out
      // of the stylesheet's translateY(110%).
      tweens.push(
        gsap.fromTo(
          words,
          { y: 0, yPercent: 110 },
          { yPercent: 0, duration: 0.9, ease: EASE, stagger: 0.035 },
        ),
      );
    };

    const reveal = (node: HTMLElement) => {
      io.unobserve(node);
      pending.delete(node);
      if (node.hasAttribute("data-reveal-group")) revealGroup(node);
      else if (node.hasAttribute("data-split")) revealSplit(node);
      else revealSolo(node);
    };

    /** Instantly land the final state — for elements already scrolled past. */
    const complete = (node: HTMLElement) => {
      io.unobserve(node);
      pending.delete(node);
      if (node.hasAttribute("data-reveal-group")) {
        gsap.set(node.querySelectorAll<HTMLElement>("[data-reveal]"), {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
        });
      } else if (node.hasAttribute("data-split")) {
        gsap.set(node.querySelectorAll<HTMLElement>(".split-word"), {
          y: 0,
          yPercent: 0,
        });
      } else {
        gsap.set(node, { opacity: 1, x: 0, y: 0, scale: 1 });
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target as HTMLElement);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    const observe = (n: HTMLElement) => {
      pending.add(n);
      io.observe(n);
    };
    el.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach(observe);
    el.querySelectorAll<HTMLElement>("[data-split]").forEach(observe);
    Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"))
      .filter((n) => !n.closest("[data-reveal-group]"))
      .forEach(observe);

    // Fast-scroll catch-up sweep (rAF-throttled, passive).
    let raf = 0;
    const sweep = () => {
      raf = 0;
      for (const node of Array.from(pending)) {
        if (node.getBoundingClientRect().bottom < 0) complete(node);
      }
    };
    const onScroll = () => {
      if (!raf && pending.size) raf = requestAnimationFrame(sweep);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      tweens.forEach((t) => t.kill());
    };
  }, []);

  return scope;
}
