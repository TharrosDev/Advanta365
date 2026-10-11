import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./fact-list.module.css";

/** Label / value pairs as hairline rows under one strong top rule. */
export function FactList({
  items,
  className,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  className?: string;
}) {
  return (
    <dl className={cx(styles.root, className)}>
      {items.map((item) => (
        <div key={item.label} className={styles.row}>
          <dt className="t-label-medium c-fg-50">{item.label}</dt>
          <dd className="t-body-large">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
