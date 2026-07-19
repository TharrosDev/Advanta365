"use client";

import { useEffect, useRef } from "react";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";
import { splitWords } from "@/lib/splitText";
import { contact, hero } from "@/lib/content";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import GridField from "@/components/fx/GridField";

/**
 * Full-viewport command deck: the grid field settling behind an expanded
 * uppercase headline, HUD corner ticks, and a mono meta bar. The entrance
 * timeline plays on mount with a safety timer so a failed tween can never
 * leave the hero hidden; reduced-motion visitors get everything visible
 * from CSS.
 */
export default function Hero() {
  const stageRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
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
      tl.to(stage.querySelectorAll("[data-hero='chip']"), {
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
            "[data-hero='lede'], [data-hero='ctas'], [data-hero='meta']",
          ),
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 },
          0.55,
        );
      // The headline masks are ready — the line wrappers can show.
      lines.forEach((l) => {
        l.style.opacity = "1";
      });
    } catch {
      heroEls.forEach((el) => (el.style.opacity = "1"));
    }

    // Additive scroll-exit drift: the composition rises and softens as the
    // hero leaves. Scrub-only; failure leaves everything readable.
    let drift: gsap.core.Tween | null = null;
    const inner = innerRef.current;
    if (inner) {
      drift = gsap.to(inner, {
        yPercent: -6,
        opacity: 0.35,
        ease: "none",
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }

    return () => {
      window.clearTimeout(safety);
      tl?.kill();
      drift?.scrollTrigger?.kill();
      drift?.kill();
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

      <div ref={innerRef} className="relative z-[2] u-container pb-6 md:pb-8">
        <p data-hero="chip" className="chip mb-7">
          <span className="status-dot" aria-hidden="true" />
          {hero.kicker}
        </p>

        <h1 className="t-display">
          {hero.titleLines.map((line) => (
            <span key={line} data-hero data-hero-line className="block">
              {line}
            </span>
          ))}
        </h1>

        <div className="mt-8 grid gap-8 md:grid-cols-12 md:items-end">
          <p data-hero="lede" className="t-lead measure-wide md:col-span-7">
            {hero.lede}
          </p>
          <div
            data-hero="ctas"
            className="flex flex-wrap gap-3 md:col-span-5 md:justify-end"
          >
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

        <div data-hero="meta" className="hero-meta mt-10">
          {hero.meta.map((m, i) => (
            <div key={m.key} className="hero-meta-cell">
              <span className="hero-meta-num">
                {String(i + 1).padStart(2, "0")} / {m.key}
              </span>
              <span className="hero-meta-val">{m.value}</span>
            </div>
          ))}
          <div className="hero-meta-cell hidden items-end md:flex">
            <span className="scroll-cue" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
