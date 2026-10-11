import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cx } from "@/lib/cx";
import styles from "./shelf-head.module.css";

/**
 * The header row of a full-width section (a shelf of cards): an optional `Eyebrow`, the title, an
 * optional lead under it, and an optional `action` at the right, level with the last line of the
 * text. Below 40em the action goes under the text. The row keeps 42px under it.
 */
export function ShelfHead({
  eyebrow,
  title,
  titleAs: Title = "h2",
  titleId,
  body,
  action,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  titleAs?: "h1" | "h2" | "h3";
  titleId?: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx(styles.root, className)}>
      <div className={styles.text}>
        {eyebrow ? <Eyebrow className={styles.eyebrow}>{eyebrow}</Eyebrow> : null}
        <Title id={titleId} className={cx("type-page", styles.title)}>
          {title}
        </Title>
        {body ? <p className={cx("type-lead", styles.body)}>{body}</p> : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
