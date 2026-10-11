import { Wrap } from "@/components/ui/wrap";
import { cx } from "@/lib/cx";
import styles from "./beta-strip.module.css";

/**
 * The notice above the bar, shown while the catalog holds sample content: one line on the wash,
 * aligned with the left edge of the page column. It is in the flow and scrolls away with the page.
 */
export function BetaStrip() {
  return (
    <div className={styles.root}>
      <Wrap className={styles.inner}>
        <p className={cx("type-note", styles.text)}>Beta preview — templates shown are samples.</p>
      </Wrap>
    </div>
  );
}
