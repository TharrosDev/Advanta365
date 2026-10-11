"use client";

import { useEffect } from "react";
import { setThemeRequest } from "@/lib/motion/theme";

/**
 * Flips the whole page to the dark theme while the top of `#targetId` is at or above the viewport
 * mid-line (also once it has scrolled past entirely), and back to light when it drops below again.
 * On the first dark it also marks the target `data-in-view` (never removed) so reveals paused
 * inside it start. Renders nothing; render it once on the page that owns the target.
 */
export function ThemeScroll({ targetId }: { targetId: string }): null {
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const apply = (dark: boolean) => {
      setThemeRequest("scroll", dark);
      if (dark && target.dataset.inView === undefined) target.dataset.inView = "";
    };

    // An observer stays silent when a jump scroll carries the target from entirely below the line
    // to entirely above it (or back), so the same test also runs on scroll and resize.
    const evaluate = () => apply(target.getBoundingClientRect().top <= window.innerHeight / 2);
    let frame = 0;
    const schedule = () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        evaluate();
      });
    };

    // The observer reports the crossing of the mid-line (root bottom moved up by 50%). Its first
    // callback also gives the state at mount, after the route's own scroll reset has happened.
    let observer: IntersectionObserver | null = null;
    const observe = () => {
      observer?.disconnect();
      observer = null;
      if (typeof IntersectionObserver === "undefined") {
        schedule();
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          if (!entry) return;
          const bounds = entry.rootBounds;
          apply(
            bounds
              ? entry.boundingClientRect.top <= bounds.bottom
              : entry.isIntersecting || entry.boundingClientRect.top < 0,
          );
        },
        { rootMargin: "0px 0px -50% 0px" },
      );
      observer.observe(target);
    };

    const release = () => setThemeRequest("scroll", false);

    observe();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pagehide", release);
    // Back from the bfcache the request was released on pagehide: observe again.
    window.addEventListener("pageshow", observe);

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pagehide", release);
      window.removeEventListener("pageshow", observe);
      release();
    };
  }, [targetId]);

  return null;
}
