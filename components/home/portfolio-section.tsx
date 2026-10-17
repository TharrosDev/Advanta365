import { Portfolio } from "@/components/purchase/portfolio";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Icon } from "@/components/ui/icon";
import type { PhaseCoverage } from "@/lib/catalog/coverage";
import type { Template } from "@/lib/catalog/schema";
import { FREE_SAMPLE_COUNT } from "@/lib/catalog/validate";
import { cx } from "@/lib/cx";
import { countWord, formatPriceParts } from "@/lib/format";
import { OFFER, PURCHASE_LINK, TOOLKIT } from "@/lib/site";
import styles from "./home.module.css";

const PRICE = formatPriceParts(OFFER.priceCents, OFFER.currency);

/**
 * What the one purchase is, as the lines of a receipt: the price, what is in the folder (the counts
 * read from `TOOLKIT`) and the files it comes as.
 */
const TERMS: readonly { label: string; value: string }[] = [
  { label: "Price", value: `${PRICE.amount} ${PRICE.currency}, one purchase` },
  {
    label: "Contents",
    value: `${TOOLKIT.playbooks} playbooks, ${TOOLKIT.templates} templates, ${TOOLKIT.fieldGuides} field guides and ${TOOLKIT.jobAids} job aids`,
  },
  { label: "Files", value: "Word, PowerPoint, Excel and PDF" },
];

/**
 * `#toolkit`: on the desk. The one thing the site sells, as the folder it is sold as. The words
 * stand at the left (columns 1 to 5 from 68em): an eyebrow naming the offer, the heading, a lead,
 * a short ledger of the terms (each row ticked in ink) and two buttons, the purchase first and the
 * free samples after. The portfolio stands at the right (columns 7 to 12, as wide as the room for
 * its hanging tag allows) with the covers of the free samples in its pocket, the price on its tag
 * and the tally of the phases under it; narrower, the portfolio stands under the words. The band
 * is the folder's scope: with a button under keyboard focus the covers rise as they do under the
 * pointer.
 */
export function PortfolioSection({
  covers,
  phases,
}: {
  covers: readonly Template[];
  phases: readonly PhaseCoverage[];
}) {
  return (
    <Band
      id="toolkit"
      surface="desk"
      pad="roomy"
      innerClassName={styles.toolkit}
      data-folder-scope=""
    >
      <div className={styles.toolkitText}>
        <Eyebrow>{OFFER.name}</Eyebrow>
        <h2 className={cx("type-banner", styles.toolkitTitle)}>One purchase, the whole toolkit</h2>
        <p className={cx("type-lead", styles.toolkitLead)}>
          Every playbook, template, field guide and job aid, for all eleven phases of the rollout.{" "}
          {countWord(FREE_SAMPLE_COUNT, "capital")} of the templates are free samples in the
          catalog; the rest come in the folder.
        </p>
        <BandedList as="dl" className={styles.toolkitTerms}>
          {TERMS.map(({ label, value }) => (
            <BandedRow as="div" key={label} className={styles.toolkitTerm}>
              <dt className={cx("type-note", styles.toolkitTermLabel)}>
                <Icon name="tick" className={styles.toolkitTick} />
                {label}
              </dt>
              <dd className={cx("type-ui", styles.toolkitTermValue)}>{value}</dd>
            </BandedRow>
          ))}
        </BandedList>
        <div className={styles.toolkitAction}>
          <Button variant="mark" size="lg" href={PURCHASE_LINK.href} arrow>
            Purchase the toolkit
          </Button>
          <Button variant="outline" size="lg" href="/catalog?free=1">
            Try the free samples first
          </Button>
        </div>
      </div>
      <Appear move="settle" className={styles.toolkitObject}>
        <Portfolio size="section" covers={covers} phases={phases} />
      </Appear>
    </Band>
  );
}
