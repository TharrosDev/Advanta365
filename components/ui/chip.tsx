import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./chip.module.css";

/**
 * A small square tag. `solid` is the inverted note ("Save $40", a file format); `outline` is the
 * hairline-ruled chip at body size used for product names. Never interactive.
 */
export function Chip({
  children,
  variant = "solid",
  className,
}: {
  children: ReactNode;
  variant?: "solid" | "outline";
  className?: string;
}) {
  const outline = variant === "outline";

  return (
    <span
      className={cx(
        styles.root,
        outline ? styles.outline : styles.solid,
        outline ? "t-body-large" : "t-label-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}
