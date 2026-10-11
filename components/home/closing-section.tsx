import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { Sentences } from "@/components/ui/sentences";
import { Sheet } from "@/components/ui/sheet";
import { Tally } from "@/components/ui/tally";
import { cx } from "@/lib/cx";
import styles from "./home.module.css";

/**
 * `#closing`: the last band before the footer. One sheet with an ink edge across the grid: the
 * statement (one sentence to a block) in columns 1 to 8, the one button that leads to the catalog in
 * columns 9 to 12 level with the last line (under the statement below 68em), and under them a thin
 * tally, nine blocks inked and the tenth marked, the whole width of the sheet.
 */
export function ClosingSection() {
  return (
    <Band id="closing" surface="desk">
      <Sheet edge="ink" pad="roomy" className={styles.closingSheet}>
        <div className={styles.closingGrid}>
          <h2 className={cx("type-banner", styles.closingTitle)}>
            <Sentences text={"Get the 90%.\nFinish the rest your way."} />
          </h2>
          <div className={styles.closingAction}>
            <Button variant="mark" size="lg" href="/catalog" arrow>
              Shop Advanta365
            </Button>
          </div>
        </div>
        <Tally total={10} filled={9} marked={10} size="sm" className={styles.closingTally} />
      </Sheet>
    </Band>
  );
}
