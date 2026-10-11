import { cx } from "@/lib/cx";
import styles from "./section-label.module.css";

/**
 * The centred caption strip that opens a section ("Catalog", "Bundles", ...). It carries no reveal of its
 * own: wrap it in `<Reveal as="div" effect="fade" index={0}>` where it should fade in.
 */
export function SectionLabel({
  children,
  divider = true,
  bold = false,
  className,
}: {
  children: string;
  divider?: boolean;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={cx(styles.root, divider && styles.divider, className)}>
      <span className={cx("t-label-medium", bold && "w-bold", styles.text)}>{children}</span>
    </div>
  );
}
