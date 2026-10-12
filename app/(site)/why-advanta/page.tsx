import type { Metadata } from "next";
import { BuyersSection } from "@/components/about/buyers-section";
import { CompareSection } from "@/components/about/compare-section";
import { MakingSection } from "@/components/about/making-section";
import { PromiseBand } from "@/components/about/promise-band";
import { SiteState } from "@/components/about/site-state";
import { NextSteps } from "@/components/company/next-steps";
import { TitleBlock } from "@/components/layout/title-block";
import { getPhases } from "@/lib/catalog/repository";
import { SITE, TOOLKIT } from "@/lib/site";

const TITLE = "Change content that has met real users.";

const LEAD = `${SITE.name}, a product of ${SITE.parent}, is change management and user adoption content for Microsoft 365 and SharePoint Online. It exists to help every organization moving to Microsoft 365 get real adoption, not just a launch.`;

export const metadata: Metadata = {
  title: "Why Advanta",
  description: `${SITE.name} is change management and user adoption content for Microsoft 365 and SharePoint Online, refined across client rollouts over ${TOOLKIT.experience}.`,
};

const NEXT = [
  { href: "/catalog", label: "Browse the catalog" },
  { href: "/purchase", label: "See the complete toolkit" },
];

/**
 * `/why-advanta` ("Why Advanta" in the navigation; `/about` redirects here): what the toolkit is,
 * how it was made, who it is for, how it compares and where the site stands. Writing to us has its
 * own page, `/contact`.
 *
 * Layout, top to bottom: the title block with ink (the `title` scene, so no new ink and no new
 * still); the black promise (`#promise`, the 90 to 10 promise on a ten-block tally, static, no ink
 * behind it); how it was made on paper (`#made`, four passes and the seven phases); who it is for
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
      <TitleBlock form="wide" ink title={TITLE} lead={LEAD} />
      <PromiseBand />
      <MakingSection phases={phases} />
      <BuyersSection />
      <CompareSection />
      <SiteState />
      <NextSteps title="See what the toolkit holds for the phase you are on" links={NEXT} />
    </>
  );
}
