import type { SelectHTMLAttributes } from "react";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import styles from "./select.module.css";

/**
 * A native `<select>` drawn as the site's field, with the chevron icon as its indicator.
 * `className` lands on the wrapper; every other prop goes to the `<select>`.
 */
export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <span className={cx(styles.wrap, className)}>
      <select {...rest} className={cx("type-ui", styles.select)}>
        {children}
      </select>
      <Icon name="chevron" className={styles.chevron} />
    </span>
  );
}
