import type { TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import styles from "./textarea.module.css";

/**
 * A field for a few lines of text, drawn as `Input` is: paper with a firm 2px border that turns to
 * ink on focus. It fills the width of its container, starts three lines tall and can be dragged
 * taller; every prop goes to the `<textarea>`.
 */
export function Textarea({
  className,
  rows = 3,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
  return <textarea {...rest} rows={rows} className={cx("type-ui", styles.root, className)} />;
}
