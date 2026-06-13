"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import SectionShell from "@/components/sections/SectionShell";
import SectionHeader from "@/components/sections/SectionHeader";
import { gsap } from "@/components/motion/registerGsap";
import { governancePrinciples } from "@/lib/content";

export default function Governance() {
  const root = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-rule]",
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
          },
        );
        if (bg.current) {
          gsap.to(bg.current, {
            yPercent: 14,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
          });
        }
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <SectionShell id="governance" tone="dark" className="scroll-mt-24 overflow-hidden">
      <div
        ref={bg}
        aria-hidden
        className="grid-paper pointer-events-none absolute inset-x-0 -top-1/4 -z-0 h-[150%] opacity-[0.06]"
      />
      <div ref={root} className="relative">
        <SectionHeader
          onDark
          index="04"
          label="Governance"
          title="Built in, not bolted on"
          lede="Most programs treat governance as a policy document. We embed it into provisioning, templates, and onboarding — so it scales where the work happens."
          maxLede="60ch"
        />
        <span data-rule aria-hidden className="mt-8 block h-[2px] w-full origin-left bg-primary" />
        <div className="mt-10 grid grid-cols-1 gap-px border-t border-[color-mix(in_oklab,white_15%,transparent)] md:grid-cols-3">
          {governancePrinciples.map((p, idx) => (
            <div key={idx} className="border-t-2 border-[var(--paper)] py-6 pr-6">
              <span className="figure-index text-sm">{String(idx + 1).padStart(2, "0")}</span>
              <h3 className="h-card mt-3 text-[var(--paper)]">{p.title}</h3>
              <p className="body-base mt-2 text-[color-mix(in_oklab,white_75%,transparent)]">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
