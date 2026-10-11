import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./split.module.css";

/**
 * The margin layout. From 68em it is the twelve-column grid with `margin` in columns 1 to 3 (labels,
 * breadcrumbs, meta) and the children in columns 4 to 12. `rule` draws the margin rule in the
 * middle of the gutter between them; it runs through the block padding of the `Band` around it.
 * `sticky` keeps the margin under the bar while the content scrolls. Below 68em the margin sits
 * above the content and there is no rule.
 */
export function Split({
  margin,
  sticky = false,
  rule = true,
  className,
  marginClassName,
  contentClassName,
  children,
}: {
  margin?: ReactNode;
  sticky?: boolean;
  rule?: boolean;
  className?: string;
  marginClassName?: string;
  contentClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cx(styles.root, className)}>
      {margin !== undefined && margin !== null ? (
        <div className={cx(styles.margin, sticky && styles.sticky, marginClassName)}>{margin}</div>
      ) : null}
      <div className={cx(styles.content, rule && styles.hasRule, contentClassName)}>{children}</div>
    </div>
  );
}
