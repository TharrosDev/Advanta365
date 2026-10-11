import type { SelectHTMLAttributes } from "react";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { cx } from "@/lib/cx";
import styles from "./select.module.css";

/**
 * A native `<select>` in the hairline field style with the site arrow as its indicator. `className` lands
 * on the wrapper; every other prop goes to the `<select>`.
 */
export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <span className={cx(styles.wrap, className)}>
      <select {...rest} className={styles.select}>
        {children}
      </select>
      <ArrowIcon direction="down" size={14} className={styles.arrow} />
    </span>
  );
}
