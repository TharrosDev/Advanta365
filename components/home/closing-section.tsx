import { InkBackdrop } from "@/components/ink/ink-backdrop";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { Sentences } from "@/components/ui/sentences";
import { Tally } from "@/components/ui/tally";
import { cx } from "@/lib/cx";
import { PURCHASE_LINK } from "@/lib/site";
import styles from "./home.module.css";

/**
 * `#closing`: the last ten. On paper, with light-blue ink rising from the foot of the band behind
 * it. The statement (one sentence to a block) stands at the left in columns 1 to 9 and is a calm
 * rectangle for the ink; the one button that leads to the Purchase page stands under it; a thin
 * tally, nine blocks inked and the tenth marked, runs across the foot of the band.
 */
export function ClosingSection() {
  return (
    <Band
      id="closing"
      surface="paper"
      innerClassName={styles.closing}
      backdrop={
        <InkBackdrop scene="bloom" still={{ wide: "bloom-wide", tall: "bloom-tall" }} edges="top" />
      }
    >
      <h2 className={cx("type-statement", styles.closingTitle)} data-ink-calm="display">
        <Sentences move text={"Get the 90%.\nFinish the rest your way."} />
      </h2>
      <Appear className={styles.closingAction}>
        <Button variant="mark" size="lg" href={PURCHASE_LINK.href} arrow>
          Get the toolkit
        </Button>
      </Appear>
      <Tally total={10} filled={9} marked={10} size="sm" className={styles.closingTally} />
    </Band>
  );
}
