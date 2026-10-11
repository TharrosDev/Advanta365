import type { InputHTMLAttributes } from "react";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import styles from "./checkbox.module.css";

/**
 * A check row: a 21px box, the label and an optional facet count at the right. A checked box is
 * the highlighter with an ink border and an ink tick.
 *
 * The native input is transparent and covers the whole row, so a click anywhere lands on the input
 * itself; the focus ring is drawn on the box. Its accessible name is the label followed by the
 * count. `className` lands on the row; every other prop goes to the input.
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
      <span className={styles.box} aria-hidden="true">
        <Icon name="tick" size={17} className={styles.tick} />
      </span>
      <span className={cx("type-ui", styles.label)}>{label}</span>
      {count !== undefined ? (
        <span className={cx("type-note", "tabular", styles.count)}>{count}</span>
      ) : null}
    </label>
  );
}
