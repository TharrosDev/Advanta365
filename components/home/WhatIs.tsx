import SectionShell from "@/components/sections/SectionShell";
import MotionReveal from "@/components/MotionReveal";
import { whatIsSection } from "@/lib/content";

export default function WhatIs() {
  return (
    <SectionShell id="framework" tone="muted" className="scroll-mt-24">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
        <MotionReveal from="left" className="lg:col-span-5">
          <div className="mb-5 flex items-center gap-4 border-t border-rule-strong pt-3">
            <span className="figure-index text-sm">01</span>
            <span className="mono-label">The framework</span>
          </div>
          <h2 className="h-section text-ink">{whatIsSection.title}</h2>
          <p className="mt-4 font-display text-xl text-primary md:text-2xl">{whatIsSection.subtitle}</p>
          <p className="body-lg mt-5">{whatIsSection.description}</p>
        </MotionReveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-7">
          {whatIsSection.principles.map((principle, idx) => (
            <MotionReveal
              key={idx}
              from="up"
              delay={idx * 80}
              className="draft-panel-hover flex flex-col bg-background p-6"
            >
              <span className="figure-index mb-3 text-lg">{String(idx + 1).padStart(2, "0")}</span>
              <h3 className="h-card text-ink">{principle.title}</h3>
              <p className="body-base mt-2 text-ink-2">{principle.description}</p>
            </MotionReveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
