import type { Metadata } from "next";
import { InkBackdrop } from "@/components/ink/ink-backdrop";
import { TitleBlock } from "@/components/layout/title-block";
import { ContentsLeaf } from "@/components/purchase/contents-leaf";
import { Portfolio } from "@/components/purchase/portfolio";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { phaseCoverage } from "@/lib/catalog/coverage";
import { getFreeTemplates, getPhases, getTemplates } from "@/lib/catalog/repository";
import styles from "./page.module.css";

const LEAD = "One toolkit, one price. Checkout is not available yet.";

export const metadata: Metadata = {
  title: "Purchase",
  description: LEAD,
};

/**
 * `/purchase`: the one place a sale starts. The bundles, pricing and cart addresses redirect here.
 *
 * Two bands: the title block, then one stage on paper, with light-blue ink rising faintly behind
 * it. On the stage, from 68em, the folder stands at the left (columns 1 to 6, with the price on the
 * tag that hangs from it and the tally of the phases it reaches under it) and the contents leaf at
 * the right (columns 8 to 12, centred on the folder; column 7 is the room the tag hangs into). The
 * leaf holds the `h2` "What is inside", the ledger of counts read from `TOOLKIT`, the Checkout
 * button, which is not built yet, the address to write to until it is, and the note that the catalog
 * is sample content. On a large monitor the pair is drawn larger with the column (see the stylesheet);
 * from about 1010px of window to 68em the two stand side by side, the tag lying on the folder, and
 * below that it is one column, the folder first. The price is printed once, on the tag.
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
        surface="paper"
        className={styles.stage}
        innerClassName={styles.grid}
        backdrop={
          <InkBackdrop
            scene="bloom"
            still={{ wide: "bloom-purchase-wide", tall: "bloom-purchase-tall" }}
            edges="top"
          />
        }
      >
        <Appear move="settle" when="load" className={styles.folder}>
          <Portfolio
            size="page"
            covers={samples}
            phases={phaseCoverage(phases, templates)}
            className={styles.portfolio}
          />
        </Appear>
        <Appear move="settle" when="load" order={1} className={styles.leaf}>
          <ContentsLeaf />
        </Appear>
      </Band>
    </>
  );
}
