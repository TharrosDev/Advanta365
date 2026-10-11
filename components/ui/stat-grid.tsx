import { cx } from "@/lib/cx";
import styles from "./stat-grid.module.css";

/**
 * A row of figures, each under a strong top rule. In the DOM the label comes first (it names the value);
 * on screen the value sits on top, then the label, then the optional note.
 */
export function StatGrid({
  items,
  className,
}: {
  items: Array<{ label: string; value: string; note?: string }>;
  className?: string;
}) {
  return (
    <dl className={cx(styles.root, className)}>
      {items.map((item) => (
        <div key={item.label} className={styles.item}>
          <dt className="t-label-medium c-fg-50">{item.label}</dt>
          <dd className={cx("t-headline-large", "tabular", styles.value)}>{item.value}</dd>
          {item.note ? (
            <dd className={cx("t-label-medium", "c-fg-50", styles.note)}>{item.note}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
