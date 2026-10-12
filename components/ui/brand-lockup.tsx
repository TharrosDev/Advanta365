import { LogoMark } from "@/components/ui/logo-mark";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./brand-lockup.module.css";

/**
 * The brand: the mark, then the name "Advanta365" as one unbroken word in Besley.
 *
 * Both variants draw the mark in two inks. `tile` (the bar, the drawer) puts it on a square ink
 * tile: the "A" in white, its tail in the highlighter. `bare` (the footer) draws the mark alone: on
 * the binder its tail is the highlighter. Size `md` is the bar's: a 28px tile that grows to 49px
 * from 68em, where the mark fills more of it; `sm` stays at 28px. The bare mark is 36px high (21px
 * at `sm`).
 *
 * The "365" on the tail is drawn only where it is at least 7px high, which takes a mark of 35px:
 * on the bar's tile from 68em and on the bare mark at `md`. Size `sm` is drawn without it, and the
 * stylesheet leaves it out of the 28px tile below 68em.
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
          <LogoMark
            tone="two"
            digits={size === "md"}
            height="calc(var(--lockup-mark) * var(--lockup-fill))"
          />
        </span>
      ) : (
        <LogoMark
          tone="two"
          digits={size === "md"}
          height="var(--lockup-mark)"
          className={styles.glyph}
        />
      )}
      <span className={cx(styles.name, nameClassName)}>{SITE.name}</span>
    </span>
  );
}
