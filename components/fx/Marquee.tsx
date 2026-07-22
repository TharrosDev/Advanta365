"use client";

import { useEffect, useRef } from "react";
import { marqueeWords } from "@/lib/content";

/**
 * A thin ink ribbon of the framework's four movements, travelling on a CSS
 * animation (runs without JS). An IntersectionObserver pauses it off-screen;
 * hover pauses it too. Decorative: aria-hidden.
 */
export default function Marquee() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const io = new IntersectionObserver(
      ([entry]) => wrap.classList.toggle("is-off", !entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  const run = (
    <span className="ribbon-item">
      {marqueeWords.map((w) => (
        <span key={w} className="flex items-center gap-6">
          {w}
          <span className="ribbon-sep" aria-hidden="true" />
        </span>
      ))}
      <span className="ribbon-mark">ADVANTA365</span>
      <span className="ribbon-sep" aria-hidden="true" />
    </span>
  );

  return (
    <div ref={wrapRef} className="ribbon" aria-hidden="true">
      <div className="ribbon-track">
        <span className="flex shrink-0">{run}</span>
        <span className="flex shrink-0">{run}</span>
      </div>
    </div>
  );
}
