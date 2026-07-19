"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { marqueeWords } from "@/lib/content";

/**
 * Giant stroked marquee with scroll-velocity skew. The travel itself is a CSS
 * animation (runs without JS); GSAP only adds the skew, and an
 * IntersectionObserver pauses the loop off-screen. Decorative: aria-hidden.
 */
export default function Marquee() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        wrap.classList.toggle("is-off", !entry.isIntersecting);
      },
      { threshold: 0 },
    );
    io.observe(wrap);

    if (prefersReducedMotion()) return () => io.disconnect();

    // Skew follows scroll velocity, decaying back to level.
    const quickSkew = gsap.quickTo(wrap, "skewX", {
      duration: 0.5,
      ease: "power2.out",
    });
    let lastY = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const v = gsap.utils.clamp(-6, 6, (y - lastY) * 0.12);
        lastY = y;
        quickSkew(v);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      gsap.set(wrap, { skewX: 0 });
    };
  }, []);

  const run = marqueeWords.map((w, i) => (
    <span key={i}>
      {w}
      <span className="mg-sep">▪</span>
    </span>
  ));

  return (
    <div
      ref={wrapRef}
      className="marquee rule-top rule-bottom py-6 md:py-8"
      aria-hidden="true"
    >
      <div className="marquee-track marquee-giant">
        <span className="flex shrink-0 items-center">
          {run}
          <span className="mg-solid">ADVANTA365</span>
          <span className="mg-sep">▪</span>
        </span>
        <span className="flex shrink-0 items-center">
          {run}
          <span className="mg-solid">ADVANTA365</span>
          <span className="mg-sep">▪</span>
        </span>
      </div>
    </div>
  );
}
