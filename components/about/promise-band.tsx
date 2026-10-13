import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Sentences } from "@/components/ui/sentences";
import { Tally } from "@/components/ui/tally";
import { cx } from "@/lib/cx";
import { TOOLKIT } from "@/lib/site";
import styles from "./promise-band.module.css";

// One sentence to a block: the statement always breaks between them.
const STATEMENT =
  "The judgment is already built in.\nAI or a practitioner finishes the last 10 percent.";

const LEAD =
  "AI can draft a comms plan, but what it drafts is plausible, not proven. Advanta365 is the starting material for AI, not a competitor to it: the judgment is already in the material, and AI or a practitioner does the tailoring.";

const TALLY_LABEL = "Ten blocks: nine are built into the toolkit and the tenth is yours to finish.";

const BUILT = `Already in the toolkit: the case, the plan, the comms, the training and the cutover, refined across client rollouts over ${TOOLKIT.experience}.`;

const YOURS =
  "Yours to tailor to your organization, your tone and your timeline, by hand or with your AI tools.";

/**
 * `#promise`: the one black band of the page, on the 90 to 10 promise. From the label down: the
 * statement, one sentence to a block and the page's second headline; the paragraph under it; then
 * the scale, a ten-block tally that fills as it is seen (nine blocks of ink and the tenth marked)
 * with a bracket drawn under each part and its figure and sentence under the bracket. The bracket
 * of the nine stands under blocks 1 to 9 and the bracket of the tenth under block 10, because both
 * sit on the same ten-column grid as the blocks, with the same 7px gap. Each figure carries a small
 * swatch of the block it stands for, which a phone, where the two sentences stack below 40em, needs
 * to show which is which.
 *
 * The figures are printed as they are and never count up. Under reduced motion and without
 * JavaScript the tally and both brackets are simply drawn.
 */
export function PromiseBand() {
  return (
    <Band
      id="promise"
      surface="ink"
      pad="roomy"
      aria-labelledby="promise-title"
      innerClassName={styles.grid}
    >
      <Eyebrow className={styles.label}>The promise</Eyebrow>
      <h2 id="promise-title" className={cx("type-statement", styles.statement)}>
        <Sentences text={STATEMENT} move />
      </h2>
      <Appear as="p" className={cx("type-lead", styles.lead)}>
        {LEAD}
      </Appear>

      <div className={styles.scale}>
        <Tally
          total={10}
          filled={9}
          marked={10}
          size="lg"
          animate
          label={TALLY_LABEL}
          className={styles.tally}
        />
        <Appear
          move="grow"
          aria-hidden="true"
          className={cx(styles.bracket, styles.bracketBuilt)}
        />
        <Appear
          move="grow"
          order={1}
          aria-hidden="true"
          className={cx(styles.bracket, styles.bracketYours)}
        />
        <div className={cx(styles.part, styles.partBuilt)}>
          <p className={cx("type-amount", styles.figure, styles.figureBuilt)}>90%</p>
          <p className={cx("type-copy", styles.caption)}>{BUILT}</p>
        </div>
        <div className={cx(styles.part, styles.partYours)}>
          <p className={cx("type-amount", styles.figure, styles.figureYours)}>10%</p>
          <p className={cx("type-copy", styles.caption)}>{YOURS}</p>
        </div>
      </div>
    </Band>
  );
}
