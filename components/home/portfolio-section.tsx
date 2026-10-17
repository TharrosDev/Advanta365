import { Portfolio } from "@/components/purchase/portfolio";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import type { PhaseCoverage } from "@/lib/catalog/coverage";
import type { Template } from "@/lib/catalog/schema";
import { FREE_SAMPLE_COUNT } from "@/lib/catalog/validate";
import { cx } from "@/lib/cx";
import { countWord } from "@/lib/format";
import { PURCHASE_LINK } from "@/lib/site";
import styles from "./home.module.css";

/**
 * `#toolkit`: on the desk. The one thing the site sells, as the folder it is sold as: the words
 * and the one button that leads to the purchase page stand at the left (columns 1 to 5 from 68em),
 * the portfolio at the right (columns 7 to 12) with the covers of the free samples in its pocket,
 * the price on its tag and the tally of the phases under it; narrower, the portfolio stands under
 * the words. The band is the folder's scope: with the button under keyboard focus the covers rise
 * as they do under the pointer.
 */
export function PortfolioSection({
  covers,
  phases,
}: {
  covers: readonly Template[];
  phases: readonly PhaseCoverage[];
}) {
  return (
    <Band id="toolkit" surface="desk" innerClassName={styles.toolkit} data-folder-scope="">
      <div className={styles.toolkitText}>
        <h2 className="type-page">One purchase, the whole toolkit</h2>
        <p className={cx("type-lead", styles.toolkitLead)}>
          Every playbook, template, field guide and job aid, for all eleven phases of the rollout.{" "}
          {countWord(FREE_SAMPLE_COUNT, "capital")} of the templates are free samples in the
          catalog; the rest come in the folder.
        </p>
        <div className={styles.toolkitAction}>
          <Button variant="mark" size="lg" href={PURCHASE_LINK.href} arrow>
            Purchase the toolkit
          </Button>
        </div>
      </div>
      <Appear move="settle" className={styles.toolkitObject}>
        <Portfolio size="section" covers={covers} phases={phases} />
      </Appear>
    </Band>
  );
}
