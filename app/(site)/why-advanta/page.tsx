import type { Metadata } from "next";
import { BuyersSection } from "@/components/about/buyers-section";
import { CompareSection } from "@/components/about/compare-section";
import { MakingSection } from "@/components/about/making-section";
import { PromiseBand } from "@/components/about/promise-band";
import { SiteState } from "@/components/about/site-state";
import { NextSteps } from "@/components/company/next-steps";
import { TitleBlock } from "@/components/layout/title-block";
import { JsonLd } from "@/components/seo/json-ld";
import { getPhases } from "@/lib/catalog/repository";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, IDS, webPage } from "@/lib/seo/structured-data";
import { SITE, TOOLKIT } from "@/lib/site";

const TITLE = "Change content that has met real users.";

const LEAD = `${SITE.name}, a product of ${SITE.parent}, is change management and user adoption content for Microsoft 365 and SharePoint Online. It exists to help every organization moving to Microsoft 365 get real adoption, not just a launch.`;

const DESCRIPTION = `${SITE.name}, a product of ${SITE.parent}, is change management and user adoption content for Microsoft 365 and SharePoint Online, refined across client rollouts over ${TOOLKIT.experience}: who it is for, how it was made and how it compares with building it with AI or hiring a consultant.`;

export const metadata: Metadata = pageMetadata({
  path: "/why-advanta",
  title: "Why Advanta",
  description: DESCRIPTION,
  ownCard: true,
});

const NEXT = [
  { href: "/catalog", label: "Browse the catalog" },
  { href: "/purchase", label: "See the complete toolkit" },
];

/**
 * `/why-advanta` ("Why Advanta" in the navigation; `/about` redirects here): what the toolkit is,
 * how it was made, who it is for, how it compares and where the site stands. Writing to us has its
 * own page, `/contact`.
 *
 * Layout, top to bottom: the title block; the black promise (`#promise`, the 90 to 10 promise on a
 * ten-block tally, static); how it was made on paper (`#made`, four passes and the eleven phases); who it is for
 * on the desk (`#who`, five buyers as a ruled register on a sheet with two beneath it); the three
 * alternatives as three sheets on paper (`#compare`, linked from the home page, with the owner's
 * cost estimates marked as estimates); the one wash band, a plain note on the state of the site
 * (`#state`); and the closing row of two places to go. Grounds alternate paper and desk around the
 * black band and the wash.
 *
 * Hierarchy: two headlines carry the page at the statement size, the h1 and the black band. Every
 * other statement steps down to the banner or the page size. Every claim is from PRODUCT.md: no
 * client, no metric, no testimonial, and a certification only ever describes the practitioner.
 */
export default async function WhyAdvantaPage() {
  const phases = await getPhases();

  return (
    <>
      <TitleBlock form="wide" title={TITLE} lead={LEAD} />
      <PromiseBand />
      <MakingSection phases={phases} />
      <BuyersSection />
      <CompareSection />
      <SiteState />
      <NextSteps title="See what the toolkit holds for the phase you are on" links={NEXT} />
      <JsonLd
        data={graph(
          ...webPage({
            path: "/why-advanta",
            name: TITLE,
            description: DESCRIPTION,
            type: "AboutPage",
            trail: [{ name: "Why Advanta", path: "/why-advanta" }],
            extra: {
              about: [{ "@id": IDS.organization }, { "@id": IDS.product }],
              mainEntity: { "@id": IDS.brand },
            },
          }),
        )}
      />
    </>
  );
}
