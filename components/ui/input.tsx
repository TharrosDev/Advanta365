import type { InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import styles from "./input.module.css";

/**
 * A text field: a 48px paper box with a firm 2px border that turns to ink on focus. It fills the
 * width of its container; every prop goes to the `<input>`.
 */
export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return <input {...rest} className={cx("type-ui", styles.root, className)} />;
}
