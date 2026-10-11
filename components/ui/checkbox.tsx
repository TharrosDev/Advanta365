import type { InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import styles from "./checkbox.module.css";

/**
 * A check row: square hairline box, label and optional facet count.
 *
 * The native input is transparent and covers the whole row, so a click anywhere lands on the input itself.
 * Its accessible name is the label followed by the count. `className` lands on the row; every other prop
 * goes to the input.
 */
export function Checkbox({
  label,
  count,
  disabled,
  className,
  ...rest
}: { label: string; count?: number } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <label className={cx(styles.row, disabled && styles.disabled, className)}>
      <input {...rest} type="checkbox" disabled={disabled} className={styles.input} />
      <span className={styles.box} aria-hidden="true" />
      <span className={cx("t-body-large", styles.label)}>{label}</span>
      {count !== undefined ? (
        <span className={cx("t-label-medium", "c-fg-50", "tabular", styles.count)}>{count}</span>
      ) : null}
    </label>
  );
}
