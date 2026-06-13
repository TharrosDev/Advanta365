"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import SectionShell from "@/components/sections/SectionShell";
import SectionHeader from "@/components/sections/SectionHeader";
import { gsap } from "@/components/motion/registerGsap";
import { deliveryNote, deliveryStages } from "@/lib/content";

export default function DeliveryScroll() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // The scrubbed sequence (rail fill + stages lighting in turn) only runs on
      // wide screens with motion enabled; below that the grid is static.
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top 72%", end: "bottom 65%", scrub: 0.6 },
        });
        tl.fromTo("[data-rail-fill]", { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0);
        const cells = gsap.utils.toArray<HTMLElement>("[data-stage]");
        cells.forEach((el, i) => {
          tl.fromTo(
            el,
            { opacity: 0.3, y: 14 },
            { opacity: 1, y: 0, ease: "none" },
            i / cells.length,
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <SectionShell id="delivery" className="scroll-mt-24">
      <SectionHeader
        index="02"
        label="Delivery model"
        title="A six-stage delivery model"
        lede={deliveryNote}
        maxLede="52ch"
        className="mb-10 md:mb-14"
      />
      <div ref={root} className="relative">
        {/* master progress rule (lg only) */}
        <span
          aria-hidden
          data-rail-fill
          className="absolute inset-x-0 top-0 z-10 hidden h-[3px] origin-left scale-x-0 bg-primary lg:block"
        />
        <div className="grid grid-cols-2 gap-px border-t border-rule-strong sm:grid-cols-3 lg:grid-cols-6">
          {deliveryStages.map((stage, idx) => (
            <div
              key={idx}
              data-stage
              className="flex flex-col gap-3 border-t-2 border-ink bg-background py-5 pr-4 lg:pt-6"
            >
              <span className="figure-index text-2xl">{stage.number}</span>
              <span className="h-card text-ink">{stage.label}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
