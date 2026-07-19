"use client";

import { useEffect, useRef } from "react";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";
import { splitWords } from "@/lib/splitText";
import { contact, hero } from "@/lib/content";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import GridField from "@/components/fx/GridField";

/**
 * The dossier cover: the same split architecture as every chapter — ID rail
 * on the left (index 00, status, document meta), headline in the scrolling
 * column — with the grid field settling behind the whole stage. The entrance
 * timeline plays on mount with a safety timer so a failed tween can never
 * leave the cover hidden; reduced-motion visitors get everything visible
 * from CSS.
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

    // Safety net: whatever happens below, nothing stays hidden.
    const safety = window.setTimeout(() => {
      heroEls.forEach((el) => {
        el.style.opacity = "1";
      });
      stage
        .querySelectorAll<HTMLElement>(".split-word")
        .forEach((w) => (w.style.transform = "none"));
    }, 2200);

    const splits = lines.map((line) => splitWords(line));
    const words = splits.flatMap((s) => s.words);

    let tl: gsap.core.Timeline | null = null;
    try {
      tl = gsap.timeline({ defaults: { ease: EASE } });
      tl.to(stage.querySelectorAll("[data-hero='rail']"), {
        opacity: 1,
        duration: 0.7,
        stagger: 0.08,
      })
        .fromTo(
          words,
          { y: 0, yPercent: 110 },
          { yPercent: 0, duration: 1.05, stagger: 0.05 },
          0.15,
        )
        .to(
          stage.querySelectorAll(
            "[data-hero='lede'], [data-hero='ctas'], [data-hero='meta']",
          ),
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 },
          0.6,
        );
      lines.forEach((l) => {
        l.style.opacity = "1";
      });
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
      <div className="gridfield">
        <div className="no-js-dots" aria-hidden="true" />
        <GridField />
      </div>
      <div className="hero-fade" aria-hidden="true" />

      {/* HUD frame */}
      <div className="hud-frame" aria-hidden="true">
        <span className="hud-corner" data-pos="tl" />
        <span className="hud-corner" data-pos="tr" />
        <span className="hud-corner" data-pos="bl" />
        <span className="hud-corner" data-pos="br" />
      </div>

      <div className="ch relative z-[2]" style={{ borderTop: "none" }}>
        <div className="ch-rail">
          <div className="cover-rail-inner">
            <p data-hero="rail" className="chip">
              <span className="status-dot" aria-hidden="true" />
              {hero.kicker}
            </p>
            <span data-hero="rail" className="ch-index" aria-hidden="true">
              00
            </span>
            <span data-hero="rail" className="ch-word" aria-hidden="true">
              Dossier
            </span>
            <div data-hero="rail" className="cover-meta">
              {hero.meta.map((m) => (
                <span key={m.key}>
                  {m.key} / {m.value}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="cover-body ch-body">
          <h1 className="cover-title">
            {hero.titleLines.map((line) => (
              <span key={line} data-hero data-hero-line className="block">
                {line}
              </span>
            ))}
          </h1>

          <p data-hero="lede" className="t-lead measure-wide mt-8">
            {hero.lede}
          </p>
          <div data-hero="ctas" className="mt-8 flex flex-wrap gap-3">
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

          <div data-hero="meta" className="hero-meta mt-12">
            {hero.meta.slice(0, 4).map((m, i) => (
              <div key={m.key} className="hero-meta-cell">
                <span className="hero-meta-num">
                  {String(i + 1).padStart(2, "0")} / {m.key}
                </span>
                <span className="hero-meta-val">{m.value}</span>
              </div>
            ))}
          </div>

          <div
            data-hero="meta"
            className="mt-8 hidden items-center gap-3 md:flex"
          >
            <span className="scroll-cue" aria-hidden="true" />
            <span className="t-coord">Scroll the dossier</span>
          </div>
        </div>
      </div>
    </section>
  );
}
