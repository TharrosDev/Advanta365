import { Appear } from "@/components/ui/appear";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { Blank } from "@/components/ui/blank";
import { PaperSheet } from "@/components/ui/paper-sheet";
import { PaperStack } from "@/components/ui/paper-stack";
import { Tag } from "@/components/ui/tag";
import { Tally } from "@/components/ui/tally";
import { cx } from "@/lib/cx";
import styles from "./hero-sheet.module.css";

/**
 * What the specimen shows: one catalog template, written out. `facts` are the template page's own
 * label and value pairs, in its order (Phase, Step, Type, Format, Length).
 */
export type SpecimenContent = {
  title: string;
  summary: string;
  formatTag: string;
  facts: ReadonlyArray<{ label: string; value: string }>;
  phaseOrder: number;
  phaseName: string;
};

/**
 * The specimen: one template drawn as the top sheet of a stack of paper, in the margin of
 * `#inside`. Its format and phase, its own title and summary, its facts as a ledger, then the
 * blank that is left for the buyer and a ten-block tally (nine inked, the tenth marked) that
 * fills once when the sheet is seen. It repeats catalog text, so the whole of it is hidden from
 * assistive technology. The stack settles as it scrolls in. Hook: `data-specimen`.
 */
export function Specimen({
  specimen,
  className,
}: {
  specimen: SpecimenContent;
  className?: string;
}) {
  const { title, summary, formatTag, facts, phaseOrder, phaseName } = specimen;

  return (
    <Appear move="settle" data-specimen="" aria-hidden="true" className={className}>
      <PaperStack under={2}>
        <PaperSheet depth={2} className={styles.page}>
          <div className={styles.head}>
            <Tag variant="format">{formatTag}</Tag>
            <span className={styles.phase}>
              <span className={styles.numeral}>{phaseOrder}</span>
              <span className="type-note">{phaseName}</span>
            </span>
          </div>
          <p className={cx("type-section", styles.title)}>{title}</p>
          <p className={cx("type-note", styles.summary)}>{summary}</p>
          <BandedList as="dl" className={styles.facts}>
            {facts.slice(0, 5).map((fact) => (
              <BandedRow as="div" key={fact.label} className={styles.fact}>
                <dt className={cx("type-note", styles.factLabel)}>{fact.label}</dt>
                <dd className={cx("type-note", styles.factValue)}>{fact.value}</dd>
              </BandedRow>
            ))}
          </BandedList>
          <Blank caret="none" className={styles.blank} />
          <div className={styles.foot}>
            <Tally total={10} filled={9} marked={10} size="sm" animate />
          </div>
        </PaperSheet>
      </PaperStack>
    </Appear>
  );
}
