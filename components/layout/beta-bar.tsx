import { cx } from "@/lib/cx";
import styles from "./beta-bar.module.css";

/**
 * The slim notice above the header, shown while the catalog holds sample content. Always dark (its
 * own theme scope), in flow, and above the route fade so it never blinks during a navigation.
 */
export function BetaBar() {
  return (
    <div className={cx(styles.root, "t-label-medium")} data-theme="dark">
      Beta preview — templates shown are samples.
    </div>
  );
}
