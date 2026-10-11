import type { InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import styles from "./input.module.css";

/** A hairline text field: no box, one rule under the text that darkens on focus. */
export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return <input {...rest} className={cx(styles.root, className)} />;
}
