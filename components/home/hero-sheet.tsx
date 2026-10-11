import { Blank } from "@/components/ui/blank";
import { Tag } from "@/components/ui/tag";
import { Tally } from "@/components/ui/tally";
import { cx } from "@/lib/cx";
import styles from "./hero-sheet.module.css";

/**
 * What the hero sheet shows: one catalog template, written out. `facts` are the template page's own
 * label and value pairs, in its order (Phase, Step, Type, Format, Length).
 */
export type HeroSpecimen = {
  title: string;
  summary: string;
  formatTag: string;
  facts: ReadonlyArray<{ label: string; value: string }>;
  phaseOrder: number;
  phaseName: string;
  phaseCount: number;
};

/** The three facts a phone keeps. */
const PHONE_FACTS: ReadonlySet<string> = new Set(["Phase", "Type", "Format"]);

/**
 * The hero sheet: a template drawn as a working copy on the desk. Two empty sheets sit tilted
 * behind the top one; on its right edge a column of numbered index tabs marks the specimen's phase
 * in highlighter; inside, the template's own title, summary and facts, then a blank with a blinking
 * caret and a ten-block tally (nine inked, the tenth marked) that fills once as the page paints.
 * It repeats catalog text, so the whole thing is hidden from assistive technology.
 *
 * Laid out in the width of columns 8 to 12 from 68em. The sheet itself is 49px narrower than the
 * stack so the tabs have room; below 40em it keeps one back sheet, three facts and smaller tabs.
 * Hook: `data-hero-sheet`.
 */
export function HeroSheet({ specimen }: { specimen: HeroSpecimen }) {
  const { title, summary, formatTag, facts, phaseOrder, phaseName, phaseCount } = specimen;
  const shown = facts.slice(0, 5);
  const phoneFacts = shown.filter(({ label }) => PHONE_FACTS.has(label));

  return (
    <div data-hero-sheet="" aria-hidden="true" className={styles.stack}>
      <span className={cx(styles.back, styles.backLeft)} />
      <span className={cx(styles.back, styles.backRight)} />
      <div className={styles.page}>
        <div className={styles.head}>
          <Tag variant="format">{formatTag}</Tag>
          <span className={styles.phase}>
            <span className={styles.numeral}>{phaseOrder}</span>
            <span className="type-note">{phaseName}</span>
          </span>
        </div>
        <p className={cx("type-section", styles.title)}>{title}</p>
        <p className={cx("type-note", styles.summary)}>{summary}</p>
        <div className={styles.facts}>
          {shown.map((fact, index) => {
            const phoneRow = phoneFacts.indexOf(fact);
            return (
              <div
                key={fact.label}
                className={cx(
                  styles.fact,
                  phoneRow === -1 && styles.wideOnly,
                  index % 2 === 1 && styles.wideStripe,
                  phoneRow % 2 === 1 && styles.phoneStripe,
                )}
              >
                <span className={cx("type-note", styles.factLabel)}>{fact.label}</span>
                <span className={cx("type-note", styles.factValue)}>{fact.value}</span>
              </div>
            );
          })}
        </div>
        <Blank caret="blink" className={styles.blank} />
        <div className={styles.foot}>
          <Tally total={10} filled={9} marked={10} size="sm" animate />
        </div>
        <div className={styles.tabs}>
          {Array.from({ length: phaseCount }, (_, index) => (
            <span
              key={index}
              className={cx(styles.tab, index + 1 === phaseOrder && styles.tabCurrent)}
            >
              {index + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
