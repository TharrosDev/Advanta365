import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./tag.module.css";

const TYPE = { format: "type-tag", saving: "type-note", plain: "type-ui" } as const;

/**
 * A small label that is never a control. `format` is the file-format tag on a cover or a sheet
 * (DOCX, PPTX); `saving` is a highlighted amount the buyer keeps ("Save $40"); `plain` is a quiet
 * boxed word, such as a product name in a row of them.
 */
export function Tag({
  variant = "format",
  className,
  children,
}: {
  variant?: "format" | "saving" | "plain";
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cx(TYPE[variant], styles.root, styles[variant], className)}>{children}</span>
  );
}
