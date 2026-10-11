import { Band } from "@/components/ui/band";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Sentences } from "@/components/ui/sentences";
import { Sheet } from "@/components/ui/sheet";
import { Tally } from "@/components/ui/tally";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";

/**
 * `#problem` and `#solution`: the pitch as two sheets facing each other on the desk. The problem is
 * the narrow one (columns 1 to 4 from 68em), the answer the wide one (columns 5 to 12); they are as
 * tall as each other and 28px apart, and stack 14px apart below 68em. Each is a `<section>` named
 * by its own heading.
 *
 * The answer's heading is a lockup: the figure "90%" and the rest of the sentence on one baseline.
 * Its text reads as the statement. The tally under it is the same claim drawn out: nine blocks of
 * ink and the tenth marked.
 */
export function PitchSpread() {
  return (
    <Band surface="desk" innerClassName={styles.spread}>
      <Sheet
        as="section"
        id="problem"
        aria-labelledby="problem-title"
        pad="roomy"
        className={cx(styles.pitchSheet, styles.problem)}
      >
        <Eyebrow>The problem</Eyebrow>
        <h2 id="problem-title" className={cx("type-page", styles.pitchTitle)}>
          <Sentences text={"Most rollouts launch.\nFewer get adopted."} />
        </h2>
        <p className={cx("type-copy", styles.pitchCopy)}>
          The technology goes live on schedule. Then people keep emailing attachments, saving to
          their desktops and working around the new tools. The missing piece is almost never the
          platform. It’s the people side: the case for change, the comms, the training and the
          follow-through.
        </p>
      </Sheet>
      <Sheet
        as="section"
        id="solution"
        aria-labelledby="solution-title"
        pad="roomy"
        className={cx(styles.pitchSheet, styles.answer)}
      >
        <Eyebrow>The answer</Eyebrow>
        <h2 id="solution-title" className={cx(styles.pitchTitle, styles.lockup)}>
          <span className={cx("type-figure", styles.lockupFigure)}>90%</span>{" "}
          <span className={cx("type-page", styles.lockupText)}>
            done before you open your AI tool.
          </span>
        </h2>
        <Tally total={10} filled={9} marked={10} size="lg" className={styles.answerTally} />
        <p className={cx("type-lead", styles.answerCopy)}>
          AI can draft a comms plan in seconds. It can’t tell you which one held up with 10,000
          employees, a nervous sponsor and a cutover weekend. Advanta365 can. Start with content
          refined across decades of real rollouts, then use AI to fit it to your organization, tone
          and timeline.
        </p>
      </Sheet>
    </Band>
  );
}
