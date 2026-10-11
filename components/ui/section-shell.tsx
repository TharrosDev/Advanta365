import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { cx } from "@/lib/cx";
import styles from "./section-shell.module.css";

/**
 * A page section: an isolated `<section>` with an optional theme scope, an `aria-hidden` backdrop layer
 * and an inner block that is the page container (full width, 16 / 32px gutters) and a flex column.
 *
 * Page-specific layout goes on `innerClassName` with a doubled selector (`.hero.hero { gap: 40px }`).
 */
export function SectionShell({
  id,
  theme,
  height = "auto",
  className,
  innerClassName,
  backdrop,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: {
  id?: string;
  theme?: "dark" | "light" | "invert";
  height?: "auto" | "full" | "half";
  className?: string;
  innerClassName?: string;
  backdrop?: ReactNode;
  children: ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  return (
    <section
      id={id}
      className={cx(styles.root, className)}
      data-theme={theme}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <div className={styles.backdrop} aria-hidden="true">
        {backdrop}
      </div>
      <Container
        className={cx(
          styles.inner,
          height === "full" && styles.full,
          height === "half" && styles.half,
          innerClassName,
        )}
      >
        {children}
      </Container>
    </section>
  );
}
