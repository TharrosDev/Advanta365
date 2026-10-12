import type { ReactElement } from "react";
import { BuiltForRow } from "@/components/home/built-for-row";
import { ClosingSection } from "@/components/home/closing-section";
import { FeaturedSection } from "@/components/home/featured-section";
import { Hero } from "@/components/home/hero";
import type { SpecimenContent } from "@/components/home/hero-sheet";
import { InsideSection } from "@/components/home/inside-section";
import { ProblemSection, SolutionSection } from "@/components/home/pitch-spread";
import { PracticeSection } from "@/components/home/practice-section";
import { ValuesSection } from "@/components/home/values-section";
import { IntroCover } from "@/components/intro/intro-cover";
import { DELIVERABLE_TYPE_LABELS, FORMAT_LABELS } from "@/content/taxonomy";
import { getFreeTemplates, getPhases, getTemplates } from "@/lib/catalog/repository";
import type { Phase, Template } from "@/lib/catalog/schema";

/**
 * The specimen in the margin of `#inside` shows one real template: its title and summary, and the
 * same labelled facts the template page lists (Phase, Step, Type, Format, Length). Without a phase
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
              value: `${template.pageCount} ${template.pageCount === 1 ? "page" : "pages"}`,
            },
          ]
        : []),
    ],
    phaseOrder: phase.order,
    phaseName: phase.name,
  };
}

/**
 * Home, top to bottom: the hero (the headline beside the ink); the free sample templates as a spread
 * of sheets; what is inside the toolkit, with one real template as a specimen; the problem; the answer (the one black band); why it is different (the one wash band); why
 * Advanta365; the Microsoft 365 products; the closing statement. Reordering the page is reordering
 * the array below. The cover of a first visit is rendered before all of it.
 */
export default async function Home() {
  const [phases, templates, freeTemplates] = await Promise.all([
    getPhases(),
    getTemplates(),
    getFreeTemplates(),
  ]);
  const specimenTemplate = freeTemplates[0] ?? templates[0];

  const sections: ReactElement[] = [
    <Hero key="hero" />,
    <FeaturedSection key="featured" templates={freeTemplates} phases={phases} />,
    <InsideSection
      key="inside"
      phases={phases}
      specimen={specimenTemplate ? buildSpecimen(specimenTemplate, phases) : undefined}
    />,
    <ProblemSection key="problem" />,
    <SolutionSection key="solution" />,
    <PracticeSection key="practice" />,
    <ValuesSection key="values" />,
    <BuiltForRow key="built-for" />,
    <ClosingSection key="closing" />,
  ];

  return (
    <>
      <IntroCover />
      {sections}
    </>
  );
}
