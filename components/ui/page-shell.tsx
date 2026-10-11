import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./page-shell.module.css";

/**
 * Root element of every page (the site layout owns `<main>`). Clears the absolutely positioned header;
 * `bleed` drops that offset so the first section can run under it (home only).
 */
export function PageShell({
  bleed = false,
  className,
  children,
}: {
  bleed?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cx(styles.root, bleed && styles.bleed, className)}>{children}</div>;
}
