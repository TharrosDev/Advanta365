import type { ReactNode } from "react";
import { BandedList, BandedRow } from "@/components/ui/banded-list";
import { cx } from "@/lib/cx";
import styles from "./fact-list.module.css";

/**
 * Label and value pairs as a banded sheet: a `dl` whose rows put the label in a fixed first
 * column and the value beside it. Below 40em the value goes under its label.
 */
export function FactList({
  items,
  className,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  className?: string;
}) {
  return (
    <BandedList as="dl" className={className}>
      {items.map((item) => (
        <BandedRow as="div" key={item.label} className={styles.row}>
          <dt className={cx("type-eyebrow", styles.label)}>{item.label}</dt>
          <dd className={cx("type-copy", styles.value)}>{item.value}</dd>
        </BandedRow>
      ))}
    </BandedList>
  );
}
