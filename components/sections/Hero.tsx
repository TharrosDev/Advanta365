"use client";

import { useEffect, useRef } from "react";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";
import { splitWords } from "@/lib/splitText";
import { contact, hero } from "@/lib/content";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import HeroSchematic from "@/components/fx/HeroSchematic";

/**
 * The cover sheet: the headline set against the framed hero schematic (a node
 * field settling into a governed lattice — the product argument in one
 * drawing). The entrance timeline plays on mount with a safety timer so a
 * failed tween can never leave the cover hidden; reduced-motion visitors get
 * everything visible from CSS.
 */
export default function Hero() {
  const stageRef = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (prefersReducedMotion()) return;

    const heroEls = Array.from(
      stage.querySelectorAll<HTMLElement>("[data-hero]"),
    );
    const lines = Array.from(
      stage.querySelectorAll<HTMLElement>("[data-hero-line]"),
    );

    const safety = window.setTimeout(() => {
      heroEls.forEach((el) => (el.style.opacity = "1"));
      stage
        .querySelectorAll<HTMLElement>(".split-word")
        .forEach((w) => (w.style.transform = "none"));
    }, 2200);

    const splits = lines.map((line) => splitWords(line));
    const words = splits.flatMap((s) => s.words);

    let tl: gsap.core.Timeline | null = null;
    try {
      tl = gsap.timeline({ defaults: { ease: EASE } });
      tl.to(stage.querySelectorAll("[data-hero='kicker']"), {
        opacity: 1,
        duration: 0.6,
      })
        .fromTo(
          words,
          { y: 0, yPercent: 110 },
          { yPercent: 0, duration: 1.05, stagger: 0.05 },
          0.1,
        )
        .to(
          stage.querySelectorAll(
            "[data-hero='lede'], [data-hero='ctas'], [data-hero='meta'], [data-hero='fig']",
          ),
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.09 },
          0.5,
        );
      lines.forEach((l) => (l.style.opacity = "1"));
    } catch {
      heroEls.forEach((el) => (el.style.opacity = "1"));
    }

    return () => {
      window.clearTimeout(safety);
      tl?.kill();
      splits.forEach((s) => s.revert());
    };
  }, []);

  const onFrameworkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    history.pushState(null, "", "#framework");
    scrollTo("#framework");
  };

  return (
    <section ref={stageRef} id="top" className="hero-stage">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-bloom" aria-hidden="true" />

      <div className="hero-inner u-container">
        <div className="hero-cols">
          <div className="hero-copy">
            <p data-hero="kicker" className="chip self-start">
              <span className="status-dot" aria-hidden="true" />
              {hero.kicker}
            </p>

            <h1 className="cover-title">
              {hero.titleLines.map((line) => (
                <span key={line} data-hero data-hero-line className="block">
                  {line}
                </span>
              ))}
            </h1>

            <p data-hero="lede" className="t-lead measure-wide">
              {hero.lede}
            </p>

            <div data-hero="ctas" className="hero-ctas">
              <a
                href={contact.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                {hero.cta1}
              </a>
              <a
                href="#framework"
                onClick={onFrameworkClick}
                className="btn btn-ghost"
              >
                {hero.cta2}
              </a>
            </div>
          </div>

          <div data-hero="fig" className="hero-fig-wrap">
            <HeroSchematic />
          </div>
        </div>

        <div data-hero="meta" className="hero-meta">
          {hero.meta.map((m) => (
            <div key={m.key} className="hero-meta-cell">
              <span className="hero-meta-key">{m.key}</span>
              <span className="hero-meta-val">{m.value}</span>
            </div>
          ))}
        </div>

        <div data-hero="meta" className="hero-scroll">
          <span className="scroll-cue" aria-hidden="true" />
          <span className="annot annot-ink">Scroll the drawing set</span>
        </div>
      </div>
    </section>
  );
}
