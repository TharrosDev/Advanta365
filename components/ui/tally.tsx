import { cssVars, cx } from "@/lib/cx";
import styles from "./tally.module.css";

type BlockState = "ink" | "mark" | "empty";

/**
 * A row of equal blocks that counts something out: ten blocks with nine inked and the tenth marked
 * is the "90% done" claim; seven blocks are the seven phases.
 *
 * `filled` is either how many blocks are inked from the left or the list of 1-based positions that
 * are; `marked` is the 1-based position of the one highlighted block (the part that is the buyer's).
 * Every other block is empty. `numerals` prints each position in its block (size `md`). The tally is
 * decoration unless `label` is given, which makes it an image with that name. `animate` fills the
 * blocks one after another, once, when the tally is seen (`data-watch`, which the observer of
 * `MotionRoot` answers with `data-seen`); without it, without JavaScript and under reduced
 * motion, the tally is simply drawn in its final state. Inside a `[data-ninety]` band the blocks
 * follow the band's scroll instead (app/motion.css), so leave `animate` off there.
 *
 * `anchor` names one block for the ink layer: `{ block: 10, name: "tenth" }` puts
 * `data-ink-anchor="tenth"` on the tenth block, the place a drop of ink falls from.
 *
 * Hooks: `data-tally` on the root, `data-block="ink" | "mark" | "empty"` on each block, whose
 * position from 0 is the custom property `--i`.
 */
export function Tally({
  total,
  filled,
  marked,
  size = "md",
  numerals = false,
  animate = false,
  label,
  anchor,
  className,
}: {
  total: number;
  filled: number | readonly number[];
  marked?: number;
  size?: "sm" | "md" | "lg";
  numerals?: boolean;
  animate?: boolean;
  label?: string;
  anchor?: { block: number; name: string };
  className?: string;
}) {
  const stateOf = (position: number): BlockState => {
    if (position === marked) return "mark";
    const inked = typeof filled === "number" ? position <= filled : filled.includes(position);
    return inked ? "ink" : "empty";
  };

  const blocks = Array.from({ length: Math.max(0, total) }, (_, index) => {
    const state = stateOf(index + 1);
    return (
      <span
        key={index}
        data-block={state}
        data-ink-anchor={anchor?.block === index + 1 ? anchor.name : undefined}
        className={cx(styles.block, styles[state])}
        style={cssVars({ "--i": index })}
      >
        {numerals ? index + 1 : null}
      </span>
    );
  });

  const classes = cx(
    styles.root,
    styles[size],
    numerals && styles.numerals,
    animate && styles.animate,
    className,
  );

  const watch = animate ? "" : undefined;

  if (label) {
    return (
      <span data-tally="" data-watch={watch} role="img" aria-label={label} className={classes}>
        {blocks}
      </span>
    );
  }

  return (
    <span data-tally="" data-watch={watch} aria-hidden="true" className={classes}>
      {blocks}
    </span>
  );
}
