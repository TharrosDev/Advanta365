import { Sheet } from "@/components/ui/sheet";
import { cx } from "@/lib/cx";
import styles from "./figure-strip.module.css";

/**
 * A strip of up to four figures on one sheet (counts, totals, a saving): four cells in a row where
 * the strip is at least 600px wide, two by two where it is narrower. Each cell is a label over its
 * value; the label comes first in the `dl`. A `marked` value is highlighted: the figure that is the
 * buyer's (what they save).
 */
export function FigureStrip({
  items,
  className,
}: {
  items: Array<{ label: string; value: string; marked?: boolean }>;
  className?: string;
}) {
  return (
    <Sheet pad="none" className={className}>
      <dl className={styles.grid}>
        {items.map((item) => (
          <div key={item.label} className={styles.cell}>
            <dt className={cx("type-eyebrow", styles.label)}>{item.label}</dt>
            <dd className={cx("tabular", styles.value)}>
              {item.marked ? <span className={styles.marked}>{item.value}</span> : item.value}
            </dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}
