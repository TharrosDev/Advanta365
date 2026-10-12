import type { Metadata } from "next";
import { FaqList } from "@/components/company/faq-list";
import { InkBackdrop } from "@/components/ink/ink-backdrop";
import { TitleBlock } from "@/components/layout/title-block";
import { Portfolio } from "@/components/purchase/portfolio";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { FactList } from "@/components/ui/fact-list";
import { Note } from "@/components/ui/note";
import { Split } from "@/components/ui/split";
import { TextLink } from "@/components/ui/text-link";
import { phaseCoverage } from "@/lib/catalog/coverage";
import { getFreeTemplates, getPhases, getTemplates } from "@/lib/catalog/repository";
import { cx } from "@/lib/cx";
import { PURCHASE_QUESTIONS } from "@/lib/purchase/questions";
import { SITE, TOOLKIT } from "@/lib/site";
import styles from "./page.module.css";

const LEAD = "One toolkit, one price. Checkout is not available yet.";

export const metadata: Metadata = {
  title: "Purchase",
  description: LEAD,
};

/** A count of the ledger, set as a figure in front of the words that say what is counted. */
function Count({ value, children }: { value: number; children: string }) {
  return (
    <>
      <span data-count="" className={styles.count}>
        {value}
      </span>{" "}
      {children}
    </>
  );
}

/**
 * What the full toolkit holds, with the counts read from `TOOLKIT`. This is not a count of the
 * catalog, which lists sample content.
 */
const INSIDE = [
  {
    label: "Playbooks",
    value: <Count value={TOOLKIT.playbooks}>covering every phase of the rollout.</Count>,
  },
  {
    label: "Templates",
    value: (
      <Count value={TOOLKIT.templates}>
        ready to use: emails, plans, checklists, worksheets and workshop kits.
      </Count>
    ),
  },
  {
    label: "Field guides",
    value: <Count value={TOOLKIT.fieldGuides}>for change practitioners and IM partners.</Count>,
  },
  {
    label: "Job aids",
    value: <Count value={TOOLKIT.jobAids}>to go with the training.</Count>,
  },
  {
    label: "Training",
    value: `For ${TOOLKIT.trainingAudiences} audiences: end users, Site Owners and IM Representatives, with facilitator guides and learning guides.`,
  },
];

/**
 * `/purchase`: the one place a sale starts. The bundles, pricing and cart addresses redirect here.
 *
 * Top to bottom: the title block; on paper, the portfolio (the toolkit as one folder, the price on
 * the tag that hangs from it, the tally of the phases it reaches) with light-blue ink rising
 * faintly behind it; on the desk, what is inside as a ledger read from `TOOLKIT`, then the Checkout
 * button, which is not built yet (it looks disabled and says so, and stays in the tab order so a
 * keyboard reaches its words), the address to write to until it is, and the note that the catalog
 * is sample content; on paper again, the questions about buying, with the line that says their
 * answers are provisional. The price is printed once, on the tag.
 */
export default async function PurchasePage() {
  const [phases, templates, samples] = await Promise.all([
    getPhases(),
    getTemplates(),
    getFreeTemplates(),
  ]);

  return (
    <>
      <TitleBlock form="index" title="Purchase" lead={LEAD} />

      <Band
        as="div"
        surface="paper"
        className={styles.stage}
        backdrop={
          <InkBackdrop
            scene="bloom"
            still={{ wide: "bloom-wide", tall: "bloom-tall" }}
            edges="top"
          />
        }
      >
        <Appear move="settle" when="load">
          <Portfolio size="page" covers={samples} phases={phaseCoverage(phases, templates)} />
        </Appear>
      </Band>

      <Band surface="desk">
        <Split margin={<h2 className="type-page">What is inside</h2>}>
          <FactList items={INSIDE} />

          <div className={styles.action}>
            <Button size="lg" aria-disabled="true">
              Checkout coming soon
            </Button>
            <p className={cx("type-copy", styles.contact)}>
              Questions, or want to buy by purchase order? Write to{" "}
              <TextLink href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</TextLink>.
            </p>
          </div>

          <Note className={styles.sample}>
            Beta preview: the catalog on this site shows sample content, not the whole toolkit.
          </Note>
        </Split>
      </Band>

      <Band surface="paper">
        <Split margin={<h2 className="type-page">Questions</h2>}>
          <p className={cx("type-note", styles.provisional)}>
            These answers are provisional while the site is in beta. The commercial ones describe
            what is intended, and will be confirmed before launch.
          </p>
          <FaqList items={PURCHASE_QUESTIONS} />
        </Split>
      </Band>
    </>
  );
}
