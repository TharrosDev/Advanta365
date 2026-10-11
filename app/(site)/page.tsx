import type { ReactElement } from "react";
import { BuiltForRow } from "@/components/home/built-for-row";
import { BundlesSection, type FeaturedBundle } from "@/components/home/bundles-section";
import { ClosingSection } from "@/components/home/closing-section";
import { FeaturedSection } from "@/components/home/featured-section";
import { Hero } from "@/components/home/hero";
import type { HeroSpecimen } from "@/components/home/hero-sheet";
import { InsideSection } from "@/components/home/inside-section";
import { PitchSpread } from "@/components/home/pitch-spread";
import { PracticeSection } from "@/components/home/practice-section";
import { ValuesSection } from "@/components/home/values-section";
import { IntroCover } from "@/components/intro/intro-cover";
import { DELIVERABLE_TYPE_LABELS, FORMAT_LABELS } from "@/content/taxonomy";
import { phaseCoverage } from "@/lib/catalog/coverage";
import { bundleSavingsCents } from "@/lib/catalog/pricing";
import { getBundleTemplates, getBundles, getPhases, getTemplates } from "@/lib/catalog/repository";
import type { Phase, Template } from "@/lib/catalog/schema";

/**
 * The hero sheet shows one real template: its title and summary, and the same labelled facts the
 * template page lists (Phase, Step, Type, Format, Length). Without a phase for the template there
 * is nothing to mark on the tabs, so there is no specimen.
 */
function buildSpecimen(template: Template, phases: Phase[]): HeroSpecimen | undefined {
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
    phaseCount: phases.length,
  };
}

/**
 * Home, top to bottom, product first: the hero (the headline and a sheet drawn from a real
 * template); the featured templates; what is inside the toolkit; the bundles; the problem and the
 * answer as two facing sheets; why it is different (the one wash band); why Advanta365; the
 * Microsoft 365 products; the closing sheet. Reordering the page is reordering the array below.
 */
export default async function Home() {
  const [phases, templates, bundles] = await Promise.all([
    getPhases(),
    getTemplates(),
    getBundles(),
  ]);
  const phaseNames = new Map(phases.map((phase) => [phase.slug, phase.name]));
  const featuredTemplates = templates.filter((template) => template.featured).slice(0, 6);
  const specimenTemplate = featuredTemplates[0] ?? templates[0];
  const featuredBundles: FeaturedBundle[] = await Promise.all(
    bundles
      .filter((bundle) => bundle.featured)
      .slice(0, 3)
      .map(async (bundle) => {
        const contents = await getBundleTemplates(bundle);
        return {
          bundle,
          count: contents.length,
          savings: bundleSavingsCents(bundle, contents),
          coverage: phaseCoverage(phases, contents),
        };
      }),
  );

  const sections: ReactElement[] = [
    <Hero
      key="hero"
      specimen={specimenTemplate ? buildSpecimen(specimenTemplate, phases) : undefined}
    />,
    <FeaturedSection key="featured" templates={featuredTemplates} phaseNames={phaseNames} />,
    <InsideSection key="inside" phases={phases} />,
    <BundlesSection key="bundles" items={featuredBundles} />,
    <PitchSpread key="pitch" />,
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
