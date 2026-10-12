import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { FactList } from "@/components/ui/fact-list";
import { Icon } from "@/components/ui/icon";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { PaperStack } from "@/components/ui/paper-stack";
import { cx } from "@/lib/cx";
import { SectionHead } from "./section-head";
import styles from "./buyers-section.module.css";

const TITLE = "For the people responsible\nfor the rollout.";

const INTRO = "Five roles buy it, and each one is looking after something different.";

const BUYER_LABEL = "Buyer";
const CARES_LABEL = "What they care about";

type Buyer = { name: string; cares: string; proof?: string };

/** The owner's five buyers and what each cares about, in his order (PRODUCT.md). */
const BUYERS: readonly Buyer[] = [
  {
    name: "Change management leads and practitioners",
    cares: "Saving time, looking credible",
  },
  {
    name: "IT and M365 project managers",
    cares: "Hitting cutover dates, avoiding a rollout no one uses",
  },
  {
    name: "IM and records leads",
    cares: "Governance, metadata, avoiding a mess of duplicate sites",
  },
  {
    name: "CIOs and sponsors",
    cares: "Return on the M365 investment, risk",
  },
  {
    name: "Public sector and Crown corporations",
    cares: "Governance, accountability",
    proof: "Proven in Canadian public-sector environments.",
  },
];

const BEYOND =
  "SharePoint-first out of the box. The change management core applies to almost any technology rollout.";

/**
 * `#who`: who it is for, on the desk. The head (label, statement and one line) runs across the
 * page; under it lies the register, a ledger on a sheet of paper with two sheets beneath it: one
 * row to a buyer, a numeral in the margin, the buyer in the document's face and what they care
 * about. From 68em the sheet has a head row with its two column labels, a margin line between the
 * numerals and the names, and the three parts of a row share the twelve columns (the numeral in
 * column 1, the name in columns 2 to 7, the concern in 8 to 12). Below 68em each row stacks and
 * carries its own label. The one proof the owner states, for the public sector, stands in that
 * buyer's row under a bare ink tick. Under the register a fact row says what the toolkit covers
 * beyond SharePoint.
 */
export function BuyersSection() {
  return (
    <Band id="who" surface="desk" aria-labelledby="who-title">
      <SectionHead id="who-title" label="Who it is for" title={TITLE}>
        <p>{INTRO}</p>
      </SectionHead>

      <Appear move="settle" className={styles.book}>
        <PaperStack under={2}>
          <PaperSheet size="lg" depth={2}>
            {/* The wide layout's column labels; below it each row carries its own. */}
            <div className={cx("type-eyebrow", styles.head)} aria-hidden="true">
              <span className={styles.headBuyer}>{BUYER_LABEL}</span>
              <span className={styles.headCares}>{CARES_LABEL}</span>
            </div>

            <BandedList as="ol" className={styles.ledger}>
              {BUYERS.map((buyer, index) => (
                <BandedRow key={buyer.name} className={styles.row}>
                  <span className={styles.numeral} aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3 className={cx("type-page", styles.name)}>{buyer.name}</h3>
                  <div className={styles.cares}>
                    <p className={cx("type-eyebrow", styles.label)}>{CARES_LABEL}</p>
                    <p className={cx("type-lead", styles.value)}>{buyer.cares}</p>
                    {buyer.proof ? (
                      <p className={cx("type-copy", styles.proof)}>
                        <Icon name="tick" className={styles.tick} />
                        <span>
                          <KeepCompounds text={buyer.proof} />
                        </span>
                      </p>
                    ) : null}
                  </div>
                </BandedRow>
              ))}
            </BandedList>
          </PaperSheet>
        </PaperStack>
      </Appear>

      <FactList className={styles.beyond} items={[{ label: "Beyond SharePoint", value: BEYOND }]} />
    </Band>
  );
}
