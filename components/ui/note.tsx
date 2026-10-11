import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./note.module.css";

/**
 * A short aside set on the wash: one sentence the reader should not miss, such as "these are
 * samples". A paragraph, so it takes text and inline elements.
 */
export function Note({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cx("type-ui", styles.root, className)}>{children}</p>;
}
