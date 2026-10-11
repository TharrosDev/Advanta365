import { cx } from "@/lib/cx";
import styles from "./wipe-label.module.css";

/**
 * Block-wipe text swap (the menu's "Close"): a solid block grows down over the label, the text
 * appears under it at the midpoint, and the block retracts downward. `hiding` plays the mirror image.
 * The duration is `--overlay-duration` from an ancestor (500ms when none is set). The text is rendered
 * exactly once.
 */
export function WipeLabel({ children, hiding = false }: { children: string; hiding?: boolean }) {
  return (
    <span className={cx(styles.root, hiding && styles.hiding)}>
      <span className={styles.text}>{children}</span>
      <span className={styles.box} aria-hidden="true" />
    </span>
  );
}
