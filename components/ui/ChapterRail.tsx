"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  index: string;
  word: string;
  kicker: string;
};

/**
 * The sticky left rail of a dossier chapter: stroked index, chapter word,
 * kicker, and a vertical progress line that fills as the chapter scrolls
 * through the viewport. Stickiness is pure CSS; the progress is an additive
 * ScrollTrigger scrub — without JS the rail simply shows an empty line.
 */
export default function ChapterRail({ index, word, kicker }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const fill = fillRef.current;
    if (!root || !fill) return;
    if (prefersReducedMotion()) return;
    const chapter = root.closest(".ch");
    if (!(chapter instanceof HTMLElement)) return;

    const st = ScrollTrigger.create({
      trigger: chapter,
      start: "top 70%",
      end: "bottom 40%",
      onUpdate: (self) => {
        fill.style.transform = `scaleY(${self.progress})`;
        if (pctRef.current) {
          pctRef.current.textContent = `${String(
            Math.round(self.progress * 100),
          ).padStart(3, "0")}`;
        }
      },
    });
    return () => st.kill();
  }, []);

  return (
    <div ref={rootRef} className="ch-rail-inner">
      <span className="ch-index" aria-hidden="true">
        {index}
      </span>
      <h2 className="ch-word">{word}</h2>
      <span className="t-coord">{kicker}</span>
      <div className="ch-progress" aria-hidden="true">
        <span className="ch-progress-rail">
          <span ref={fillRef} className="ch-progress-fill" />
        </span>
        <span ref={pctRef} className="ch-progress-pct">
          000
        </span>
      </div>
    </div>
  );
}
