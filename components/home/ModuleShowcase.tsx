"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import SectionHeader from "@/components/sections/SectionHeader";
import { gsap } from "@/components/motion/registerGsap";
import { modules } from "@/lib/content";

export default function ModuleShowcase() {
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // The accessible default (mobile, reduced-motion, no-JS) is a vertical
      // stack — every card reachable. Only on a capable desktop with motion do
      // we switch to a horizontal track and pin it. gsap.set values here are
      // reverted automatically when the query stops matching.
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const t = track.current;
        const p = pin.current;
        if (!t || !p) return;

        gsap.set(p, { overflow: "hidden" });
        gsap.set(t, { flexDirection: "row", flexWrap: "nowrap", paddingRight: "22vw" });
        gsap.set("[data-mod]", { width: "clamp(20rem,32vw,30rem)", flexShrink: 0 });

        const distance = () => Math.max(0, t.scrollWidth - window.innerWidth);
        gsap.to(t, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: p,
            start: "top 84px",
            end: () => "+=" + distance(),
            pin: true,
            anticipatePin: 1,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section ref={section} id="modules" className="section-y scroll-mt-24 bg-background">
      <div className="container">
        <SectionHeader
          index="03"
          label="The modules"
          title="Five working modules"
          lede="From governed provisioning to enterprise classification — methodology turned into daily operations."
          className="mb-10 md:mb-14"
        />
      </div>

      <div ref={pin}>
        <div
          ref={track}
          className="flex flex-col gap-6 px-[clamp(1.25rem,0.75rem+1.6vw,3.5rem)]"
        >
          {modules.map((m, idx) => (
            <article
              key={idx}
              data-mod
              className="draft-panel flex min-h-[15rem] w-full flex-col justify-between bg-paper-panel p-7 md:min-h-[23rem] md:p-9"
            >
              <div>
                <div className="flex items-center justify-between border-b border-rule pb-3">
                  <span className="mono-label">{m.tag}</span>
                  <span className="figure-index text-sm">M0{idx + 1}</span>
                </div>
                <h3 className="h-section mt-7 text-ink">{m.title}</h3>
                <p className="body-base mt-3 max-w-[36ch] text-ink-2">{m.description}</p>
              </div>
              <span aria-hidden className="figure-index mt-10 block text-4xl opacity-20">
                0{idx + 1}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
