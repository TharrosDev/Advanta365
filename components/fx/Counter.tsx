"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Count-up numeral. Server-renders the final value (no-JS and crawler safe);
 * on first intersection it replays from zero. Reduced motion keeps the
 * static value.
 */
export default function Counter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    let tween: gsap.core.Tween | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const state = { n: 0 };
        tween = gsap.to(state, {
          n: value,
          duration: 1.4,
          ease: "power3.out",
          onUpdate: () => {
            el.textContent = String(Math.round(state.n));
          },
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      tween?.kill();
      el.textContent = String(value);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
