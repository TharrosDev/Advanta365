"use client";

import { useEffect, useRef, type ElementType } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
};

/**
 * Scroll-scrubbed statement: words sit faint and flood to full bone as the
 * paragraph crosses the viewport, tied to scroll position. One-way: once the
 * flood completes the trigger is killed, so scrolling back up never returns
 * the text to its faint state. The faint start is applied by GSAP only *after*
 * the ScrollTrigger exists, so a failure anywhere leaves the text fully
 * visible. AT reads a visually-hidden copy; the word spans are aria-hidden.
 */
export default function TextScrub({ text, as: Tag = "p", className }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    const original = el.innerHTML;
    el.innerHTML = "";
    const sr = document.createElement("span");
    sr.className = "u-sr";
    sr.textContent = text;
    el.appendChild(sr);
    const words: HTMLElement[] = [];
    for (const token of text.split(/(\s+)/)) {
      if (token.trim() === "") {
        el.appendChild(document.createTextNode(token));
        continue;
      }
      const span = document.createElement("span");
      span.className = "scrub-word";
      span.setAttribute("aria-hidden", "true");
      span.textContent = token;
      el.appendChild(span);
      words.push(span);
    }

    const tween = gsap.fromTo(
      words,
      { opacity: 0.14 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.06,
        scrollTrigger: {
          trigger: el,
          start: "top 82%",
          end: "top 32%",
          scrub: 0.4,
          onUpdate(self) {
            // Fully inked once: keep it that way.
            if (self.progress >= 1) {
              self.kill();
              gsap.set(words, { opacity: 1 });
            }
          },
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      el.innerHTML = original;
    };
  }, [text]);

  return (
    <Tag ref={ref} className={className}>
      {text}
    </Tag>
  );
}
