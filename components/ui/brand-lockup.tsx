import { LogoMark } from "@/components/ui/logo-mark";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./brand-lockup.module.css";

/**
 * The brand: the mark, then the name "Advanta365" as one unbroken word in Besley.
 *
 * `tile` (the bar, the drawer) puts the mark in ink on a square highlighter tile. `bare` (the
 * footer) draws the mark alone in two inks: on the binder its tail is the highlighter. Size `md` is
 * the bar's: a 28px tile that grows to 35px from 68em; `sm` stays at 28px. The bare mark is 28px
 * high (21px at `sm`).
 *
 * The name is real text, so a link around the lockup is named by it. `nameClassName` lands on the
 * name, for a caller that has to hide it visually on a very narrow bar.
 */
export function BrandLockup({
  variant = "tile",
  size = "md",
  className,
  nameClassName,
}: {
  variant?: "tile" | "bare";
  size?: "sm" | "md";
  className?: string;
  nameClassName?: string;
}) {
  return (
    <span className={cx(styles.root, styles[variant], styles[size], className)}>
      {variant === "tile" ? (
        <span className={styles.square}>
          <LogoMark height="calc(var(--lockup-mark) * 0.6)" />
        </span>
      ) : (
        <LogoMark tone="two" height="var(--lockup-mark)" className={styles.glyph} />
      )}
      <span className={cx(styles.name, nameClassName)}>{SITE.name}</span>
    </span>
  );
}
