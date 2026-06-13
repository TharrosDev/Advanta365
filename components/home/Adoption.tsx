import SectionShell from "@/components/sections/SectionShell";
import SectionHeader from "@/components/sections/SectionHeader";
import CardGrid, { type GridItem } from "@/components/sections/CardGrid";
import MotionReveal from "@/components/MotionReveal";
import { adoptionSuccessFactors, wowRoles } from "@/lib/content";

const roleItems: GridItem[] = wowRoles.map((r) => ({
  number: r.number,
  title: r.title,
  description: r.description,
}));

export default function Adoption() {
  return (
    <SectionShell id="adoption" tone="muted" className="scroll-mt-24">
      <SectionHeader
        index="05"
        label="Adoption & enablement"
        title="Adoption that actually sticks"
        lede="Role-based onboarding and reinforcement that drive real behaviour change — long after launch day."
        className="mb-10 md:mb-12"
      />

      <CardGrid items={roleItems} variant="panel" cols={{ base: 1, sm: 2, lg: 4 }} />

      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
        <MotionReveal from="left" className="lg:col-span-4">
          <span className="mono-label">When it works</span>
          <h3 className="h-card mt-3 text-ink">The conditions that make it stick</h3>
        </MotionReveal>

        <div className="border-t border-rule-strong lg:col-span-8">
          {adoptionSuccessFactors.map((factor, idx) => (
            <MotionReveal
              key={idx}
              from="up"
              delay={idx * 60}
              className="flex items-baseline gap-5 border-b border-rule py-4"
            >
              <span className="figure-index tabular-nums">{String(idx + 1).padStart(2, "0")}</span>
              <p className="body-base text-ink">{factor}</p>
            </MotionReveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
