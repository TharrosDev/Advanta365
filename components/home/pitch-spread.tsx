import { InkBackdrop } from "@/components/ink/ink-backdrop";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Sentences } from "@/components/ui/sentences";
import { Tally } from "@/components/ui/tally";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";

/**
 * `#problem`: a statement on paper. The heading stands in columns 1 to 9, one sentence to a block,
 * each inking in as it scrolls in; its paragraph stands lower, in columns 7 to 12.
 */
export function ProblemSection() {
  return (
    <Band
      id="problem"
      surface="paper"
      pad="roomy"
      aria-labelledby="problem-title"
      innerClassName={styles.statement}
    >
      <Eyebrow className={styles.statementLabel}>The problem</Eyebrow>
      <h2 id="problem-title" className={cx("type-statement", styles.statementTitle)}>
        <Sentences move text={"Most rollouts launch.\nFewer get adopted."} />
      </h2>
      <Appear as="p" className={cx("type-copy", styles.statementAside, styles.statementCopy)}>
        The technology goes live on schedule. Then people keep emailing attachments, saving to their
        desktops and working around the new tools. The missing piece is almost never the platform.
        It’s the people side: the case for change, the comms, the training and the follow-through.
      </Appear>
    </Band>
  );
}

/**
 * `#solution`: the ninety, the one black band of the page, with its own ink behind it. The figure
 * "90%" stands beside the heading, which says the same figure in words that are hidden from the
 * eye, so the heading still reads as the whole statement. The figure is printed as it is and never
 * moves: a number that rolls shows a wrong one while the page scrolls. Under them a ten-block
 * tally: nine blocks of ink and the tenth marked. As the band scrolls through the window the blocks
 * ink in one after another and, when the tenth turns light blue, one drop of light-blue ink falls
 * from it into the black water (app/motion.css and the ink layer; this file only says where things
 * are). The tenth block carries the anchor itself and names the place.
 *
 * In the document: the label, the figure, the heading, the paragraph, the tally, the open water.
 * From 68em the grid sets the figure and the sentence on one line, the tally under them, and the
 * paragraph beside the open water at the foot.
 */
export function SolutionSection() {
  return (
    <Band
      id="solution"
      surface="ink"
      data-ninety=""
      aria-labelledby="solution-title"
      innerClassName={styles.ninety}
      backdrop={
        <InkBackdrop
          scene="ninety"
          still={{ wide: "ninety-wide", tall: "ninety-tall" }}
          edges="top bottom"
        />
      }
    >
      <Eyebrow className={styles.ninetyLabel}>The answer</Eyebrow>
      <div className={styles.ninetyFigure}>
        <span className={styles.ninetyNumber} data-ink-calm="display">
          {/* Decoration: the heading says the figure. */}
          <span aria-hidden="true" className="type-poster">
            90%
          </span>
        </span>
      </div>
      <h2 id="solution-title" className={cx("type-page", styles.ninetyTitle)} data-ink-calm="text">
        <span className="visually-hidden">90% </span>
        done before you open your AI tool.
      </h2>
      <p className={cx("type-lead", styles.ninetyCopy)} data-ink-calm="text">
        AI can draft a comms plan in seconds. It can’t tell you which one held up with 10,000
        employees, a nervous sponsor and a cutover weekend. Advanta365 can. Start with content
        refined across decades of real rollouts, then use AI to fit it to your organization, tone
        and timeline.
      </p>
      <div className={styles.ninetyTally}>
        <Tally total={10} filled={9} marked={10} size="lg" anchor={{ block: 10, name: "tenth" }} />
      </div>
      <div data-ink-anchor="open" aria-hidden="true" className={styles.ninetyOpen} />
    </Band>
  );
}
