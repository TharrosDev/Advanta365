import type { Metadata } from "next";
import type { ReactElement } from "react";
import { FeaturedSection } from "@/components/home/featured-section";
import { Hero } from "@/components/home/hero";
import type { SpecimenContent } from "@/components/home/hero-sheet";
import { InsideSection } from "@/components/home/inside-section";
import { PortfolioSection } from "@/components/home/portfolio-section";
import { SolutionSection } from "@/components/home/pitch-spread";
import { IntroCover } from "@/components/intro/intro-cover";
import { JsonLd } from "@/components/seo/json-ld";
import { DELIVERABLE_TYPE_LABELS, FORMAT_LABELS } from "@/content/taxonomy";
import { phaseCoverage } from "@/lib/catalog/coverage";
import { getFreeTemplates, getPhases, getTemplates } from "@/lib/catalog/repository";
import type { Phase, Template } from "@/lib/catalog/schema";
import { formatLength } from "@/lib/format";
import { DEFAULT_TITLE, pageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/origin";
import { graph, IDS, phaseList, product, templateList, webPage } from "@/lib/seo/structured-data";
import { SITE } from "@/lib/site";

// The home page keeps the default title, the name and what the site is (the tagline is left out
// of search results on purpose), and names itself as its canonical address.
export const metadata: Metadata = pageMetadata({ path: "/", description: SITE.description });

/**
 * The specimen in the margin of `#inside` shows one real template: its title and summary, and the
 * same labelled facts the pop-up of a free sample lists (Phase, Type, Format, Length). Without a phase
 * for the template there is nothing to print in its corner, so there is no specimen.
 */
function buildSpecimen(template: Template, phases: Phase[]): SpecimenContent | undefined {
  const phase = phases.find((candidate) => candidate.slug === template.phase);
  if (!phase) return undefined;
  return {
    title: template.title,
    summary: template.summary,
    formatTag: template.format,
    facts: [
      { label: "Phase", value: phase.name },
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
    phaseNumber: phase.number,
    phaseName: phase.name,
  };
}

/**
 * Home, top to bottom: the hero (the headline, whose blank turns from a prompt to a sheet, a plan
 * and more, and the six free samples landing as a hand of documents); the same six as a row of tiles, with what each one is; what is
 * inside the toolkit, with one real template as a specimen; the toolkit as the one folder it is
 * sold as, with its price; the answer (the one black band). Reordering the page is reordering the
 * array below. The cover of a first visit is rendered before all of it.
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
  ];

  // What the page shows, for search engines and AI tools: the toolkit and its offer, the six free
  // samples and the phases.
  const structured = graph(
    ...webPage({
      path: "/",
      name: DEFAULT_TITLE,
      description: SITE.description,
      extra: {
        about: { "@id": IDS.product },
        mainEntity: { "@id": IDS.product },
        primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl("/opengraph-image") },
      },
    }),
    product(phases),
    templateList("Free samples", freeTemplates, phases),
    phaseList(phases),
  );

  return (
    <>
      <IntroCover />
      {sections}
      <JsonLd data={structured} />
    </>
  );
}
