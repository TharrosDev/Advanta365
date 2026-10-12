import type { ReactElement } from "react";
import { ClosingSection } from "@/components/home/closing-section";
import { FeaturedSection } from "@/components/home/featured-section";
import { Hero } from "@/components/home/hero";
import type { SpecimenContent } from "@/components/home/hero-sheet";
import { InsideSection } from "@/components/home/inside-section";
import { PortfolioSection } from "@/components/home/portfolio-section";
import { SolutionSection } from "@/components/home/pitch-spread";
import { PracticeSection } from "@/components/home/practice-section";
import { IntroCover } from "@/components/intro/intro-cover";
import { DELIVERABLE_TYPE_LABELS, FORMAT_LABELS } from "@/content/taxonomy";
import { phaseCoverage } from "@/lib/catalog/coverage";
import { getFreeTemplates, getPhases, getTemplates } from "@/lib/catalog/repository";
import type { Phase, Template } from "@/lib/catalog/schema";
import { formatLength } from "@/lib/format";

/**
 * The specimen in the margin of `#inside` shows one real template: its title and summary, and the
 * same labelled facts the pop-up of a free sample lists (Phase, Step, Type, Format, Length). Without a phase
 * for the template there is nothing to print in its corner, so there is no specimen.
 */
function buildSpecimen(template: Template, phases: Phase[]): SpecimenContent | undefined {
  const phase = phases.find((candidate) => candidate.slug === template.phase);
  if (!phase) return undefined;
  const step = phase.steps.find((candidate) => candidate.slug === template.step);

  return {
    title: template.title,
    summary: template.summary,
    formatTag: template.format,
    facts: [
      { label: "Phase", value: phase.name },
      ...(step ? [{ label: "Step", value: step.name }] : []),
      { label: "Type", value: DELIVERABLE_TYPE_LABELS[template.deliverableType] },
      { label: "Format", value: FORMAT_LABELS[template.format] },
      ...(template.pageCount
        ? [
            {
              label: "Length",
              value: formatLength(template.pageCount, template.format),
            },
          ]
        : []),
    ],
    phaseOrder: phase.order,
    phaseName: phase.name,
  };
}

/**
 * Home, top to bottom: the hero (the headline, and a blank prompt that turns into the six free
 * samples as a hand of documents); the same six as a row of tiles, with what each one is; what is
 * inside the toolkit, with one real template as a specimen; the toolkit as the one folder it is
 * sold as, with its price; the answer (the one black band); why it is different (the one wash
 * band); the closing statement. Reordering the page is reordering the array below. The cover of a
 * first visit is rendered before all of it.
 */
export default async function Home() {
  const [phases, templates, freeTemplates] = await Promise.all([
    getPhases(),
    getTemplates(),
    getFreeTemplates(),
  ]);
  const specimenTemplate = freeTemplates[0] ?? templates[0];

  const sections: ReactElement[] = [
    <Hero key="hero" samples={freeTemplates} phases={phases} />,
    <FeaturedSection key="featured" templates={freeTemplates} phases={phases} />,
    <InsideSection
      key="inside"
      phases={phases}
      specimen={specimenTemplate ? buildSpecimen(specimenTemplate, phases) : undefined}
    />,
    <PortfolioSection
      key="toolkit"
      covers={freeTemplates}
      phases={phaseCoverage(phases, templates)}
    />,
    <SolutionSection key="solution" />,
    <PracticeSection key="practice" />,
    <ClosingSection key="closing" />,
  ];

  return (
    <>
      <IntroCover />
      {sections}
    </>
  );
}
