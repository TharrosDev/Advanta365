import type { Metadata } from "next";
import { AudienceStrip } from "@/components/about/audience-strip";
import { CompareSection } from "@/components/about/compare-section";
import { ReasonsBand } from "@/components/about/reasons-band";
import { NextSteps } from "@/components/company/next-steps";
import { TitleBlock } from "@/components/layout/title-block";
import { JsonLd } from "@/components/seo/json-ld";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, IDS, webPage } from "@/lib/seo/structured-data";
import { OFFER, SITE, TOOLKIT } from "@/lib/site";
import styles from "./page.module.css";

const TITLE = "Proven rollout experience, at a template price.";

const LEAD = `${SITE.name} is the change management and user adoption toolkit for Microsoft 365 and SharePoint Online. Field-tested in real rollouts, yours to keep, for ${formatPrice(OFFER.priceCents, OFFER.currency)}.`;

const DESCRIPTION = `Why ${SITE.name}, a product of ${SITE.parent}: change management and user adoption content for Microsoft 365 and SharePoint Online, refined across client rollouts over ${TOOLKIT.experience}, owned outright for one price, and 90 percent done before you start. Compared with building it with AI or hiring a consultant.`;

/** The state of the site, said once and plainly (PRODUCT.md: the note on Why Advanta). */
const STATE =
  "This site is a beta: the catalog is sample content, checkout does not take payment yet, and the worked example has no file yet.";

export const metadata: Metadata = pageMetadata({
  path: "/why-advanta",
  title: "Why Advanta",
  description: DESCRIPTION,
  ownCard: true,
});

const NEXT = [
  { href: "/purchase", label: "See the complete toolkit" },
  { href: "/catalog", label: "Browse the catalog" },
];

/**
 * `/why-advanta` ("Why Advanta" in the navigation; `/about` redirects here): one answer to the
 * page's question, and its proof. Writing to us has its own page, `/contact`.
 *
 * Layout, top to bottom: the title block, whose h1 is the answer; the black band (`#why`), the
 * three reasons behind it, each set against the alternative it beats; the three ways to start as
 * three sheets on paper (`#compare`, with the owner's cost estimates marked as estimates); who it
 * is for, in one short band on the desk (`#who`); and the closing row of two places to go, with
 * the one line on the state of the site under it (`#state`).
 *
 * Hierarchy: two headlines carry the page at the statement size, the h1 and the black band. Every
 * other statement steps down. Every claim is from PRODUCT.md: no client, no metric, no
 * testimonial, and a certification only ever describes the practitioner.
 */
export default function WhyAdvantaPage() {
  return (
    <>
      <TitleBlock form="wide" title={TITLE} lead={LEAD} />
      <ReasonsBand />
      <CompareSection />
      <AudienceStrip />
      <NextSteps title="See what the toolkit holds for the phase you are on" links={NEXT}>
        <p id="state" className={cx("type-note", styles.state)}>
          {STATE}
        </p>
      </NextSteps>
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
