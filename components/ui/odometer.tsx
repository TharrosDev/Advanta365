import { cssVars, cx } from "@/lib/cx";
import styles from "./odometer.module.css";

const WHEEL = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * A two-digit figure whose tens roll. The tens stand on a wheel (a blank, then 1 to 9) inside a
 * window one line high; the units and the suffix stand still beside it. At rest the wheel shows
 * the figure's own tens, so without JavaScript and under reduced motion it simply reads the
 * figure. app/motion.css rolls the wheel from the blank inside a `[data-ninety]` band.
 *
 * Decoration: the figure is said in words by the heading it stands beside. Hooks:
 * `data-odometer` with the figure in `data-value`, and `data-odometer-wheel` on the wheel, whose
 * resting `translate` is one em up per ten.
 */
export function Odometer({
  value,
  suffix,
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const figure = Math.min(99, Math.max(0, Math.round(value)));
  const tens = Math.floor(figure / 10);

  return (
    <span
      data-odometer=""
      data-value={figure}
      aria-hidden="true"
      className={cx(styles.root, className)}
    >
      <span className={styles.window}>
        <span data-odometer-wheel="" className={styles.wheel} style={cssVars({ "--tens": tens })}>
          <span className={styles.glyph} />
          {WHEEL.map((digit) => (
            <span key={digit} className={styles.glyph}>
              {digit}
            </span>
          ))}
        </span>
      </span>
      <span className={styles.glyph}>{figure % 10}</span>
      {suffix ? <span className={styles.glyph}>{suffix}</span> : null}
    </span>
  );
}
