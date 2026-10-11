import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./eyebrow.module.css";

/**
 * A section label: small tracked capitals with a 7px highlighter square, outlined in ink, in front.
 * `marker={false}` leaves the square out (legends, table heads, a label on the binder). The text
 * itself is not changed; the capitals are CSS.
 */
export function Eyebrow({
  as: Tag = "p",
  marker = true,
  id,
  className,
  children,
}: {
  as?: "p" | "span" | "div";
  marker?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      id={id}
      className={cx(
        "type-eyebrow",
        styles.root,
        Tag === "span" && styles.inline,
        marker && styles.marker,
        className,
      )}
    >
      {children}
    </Tag>
  );
}
