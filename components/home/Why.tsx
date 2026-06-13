import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionShell from "@/components/sections/SectionShell";
import SectionHeader from "@/components/sections/SectionHeader";
import MotionReveal from "@/components/MotionReveal";
import { keyDifferentiators, keyProblems } from "@/lib/content";

const [featured, ...restDiffs] = keyDifferentiators;

export default function Why() {
  return (
    <SectionShell id="why" className="scroll-mt-24" decoration="grid">
      <SectionHeader
        index="07"
        label="Why ADVANTA365"
        title="Built for enterprise complexity"
        lede="Most solutions tackle one piece. We bring governance, adoption, and sustainment into one operating model."
        className="mb-10 md:mb-12"
      />

      {/* The problems we solve — distilled to three */}
      <div className="mb-14 grid grid-cols-1 gap-px sm:grid-cols-3">
        {keyProblems.map((problem, idx) => (
          <MotionReveal
            key={idx}
            from="up"
            delay={idx * 70}
            className="border-t-2 border-ink bg-background p-6"
          >
            <span className="figure-index text-sm">{String(idx + 1).padStart(2, "0")}</span>
            <h3 className="h-card mt-3 text-ink">{problem.title}</h3>
            <p className="body-base mt-2 text-ink-2">{problem.description}</p>
          </MotionReveal>
        ))}
      </div>

      {/* What makes us different — featured + supporting */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <MotionReveal
          from="up"
          className="ink-plate flex flex-col justify-between gap-8 p-8 md:p-10 lg:col-span-5"
        >
          <div>
            <div className="mb-5 flex items-center gap-3 border-t border-[color-mix(in_oklab,white_24%,transparent)] pt-3">
              <span aria-hidden className="h-2 w-2 bg-primary" />
              <span className="mono-label text-[color-mix(in_oklab,white_70%,transparent)]">
                Signature differentiator
              </span>
            </div>
            <h3 className="h-section text-[var(--paper)]">{featured.title}</h3>
            <p className="body-lg mt-4 text-[color-mix(in_oklab,white_82%,transparent)]">
              {featured.description}
            </p>
          </div>
          <Link href="/contact">
            <Button
              variant="outline"
              className="gap-2 border-[color-mix(in_oklab,white_45%,transparent)] text-[var(--paper)] hover:bg-[var(--paper)] hover:text-ink"
            >
              Talk to us
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </MotionReveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-7">
          {restDiffs.map((d, idx) => (
            <MotionReveal
              key={idx}
              from="up"
              delay={idx * 60}
              className="draft-panel-hover bg-background p-6"
            >
              <h4 className="h-card text-ink">{d.title}</h4>
              <p className="body-base mt-2 text-ink-2">{d.description}</p>
            </MotionReveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
