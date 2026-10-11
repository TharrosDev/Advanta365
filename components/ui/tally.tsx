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
 * blocks one after another, once, on first paint; without it, and under reduced motion, the tally
 * is simply drawn in its final state.
 *
 * Hooks: `data-tally` on the root, `data-block="ink" | "mark" | "empty"` on each block.
 */
export function Tally({
  total,
  filled,
  marked,
  size = "md",
  numerals = false,
  animate = false,
  label,
  className,
}: {
  total: number;
  filled: number | readonly number[];
  marked?: number;
  size?: "sm" | "md" | "lg";
  numerals?: boolean;
  animate?: boolean;
  label?: string;
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

  if (label) {
    return (
      <span data-tally="" role="img" aria-label={label} className={classes}>
        {blocks}
      </span>
    );
  }

  return (
    <span data-tally="" aria-hidden="true" className={classes}>
      {blocks}
    </span>
  );
}
