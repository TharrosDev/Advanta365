"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

type ScrollToTarget = string | number | HTMLElement;
type LenisContextValue = {
  scrollTo: (target: ScrollToTarget, options?: { offset?: number }) => void;
};

const LenisContext = createContext<LenisContextValue>({
  scrollTo: () => {},
});

export const useSmoothScroll = () => useContext(LenisContext);

/**
 * Lenis smooth scroll on the GSAP ticker (one rAF loop). Reveals run on
 * IntersectionObserver and don't depend on this — Lenis is purely the
 * smoothing layer. Reduced-motion visitors get native scroll (no Lenis).
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Native momentum on touch reads better than synthetic on mobile.
      syncTouch: false,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    // Keep ScrollTrigger's scrub effects in step with the smoothed scroll, and
    // re-measure once fonts have settled so pin distances are correct.
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh).catch(() => {});
    }

    // Honour an incoming deep link (e.g. /#contact).
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      requestAnimationFrame(() => lenis.scrollTo(hash, { offset: -72 }));
    }

    // Same-page hash navigation after load.
    const onHashChange = () => {
      const h = window.location.hash;
      if (h && h.length > 1) lenis.scrollTo(h, { offset: -72 });
    };
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo: LenisContextValue["scrollTo"] = (target, options) => {
    const offset = options?.offset ?? -72;
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.25 });
      return;
    }
    // Reduced-motion / pre-ready fallback.
    const el =
      typeof target === "string" ? document.querySelector(target) : null;
    if (el instanceof HTMLElement) {
      const top = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: "smooth" });
    } else if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: "smooth" });
    }
  };

  return (
    <LenisContext.Provider value={{ scrollTo }}>
      {children}
    </LenisContext.Provider>
  );
}
