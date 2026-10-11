import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import styles from "./check-list.module.css";

/**
 * A list of things that are done or included: each item is a ticked box, then an optional title and
 * the body. `columns={2}` sets the items in two columns from 40em. The ticks are decoration; the
 * list is a plain `ul`.
 */
export function CheckList({
  items,
  titleAs: Title = "h3",
  columns = 1,
  className,
}: {
  items: Array<{ key: string; title?: string; body: ReactNode }>;
  titleAs?: "h2" | "h3" | "h4" | "p";
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <ul className={cx(styles.root, columns === 2 && styles.two, className)}>
      {items.map((item) => (
        <li key={item.key} className={styles.item}>
          <span className={styles.box} aria-hidden="true">
            <Icon name="tick" size={17} className={styles.tick} />
          </span>
          <div>
            {item.title ? (
              <Title className={cx("type-item", styles.title)}>{item.title}</Title>
            ) : null}
            <div className={cx("type-copy", styles.body)}>{item.body}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
