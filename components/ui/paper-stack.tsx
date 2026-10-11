import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cssVars, cx } from "@/lib/cx";
import styles from "./paper-stack.module.css";

type PaperStackProps = {
  /** How many blank sheets lie beneath the child. */
  under?: number;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
} & HTMLAttributes<HTMLDivElement>;

const MAX_SHIFT = 14;
const MAX_TURN = 2;

/** Where the sheet `level` places down lies (1 is the nearest), in a stack of `count`. */
function placeOf(level: number, count: number) {
  const depth = level / count;
  // A few sheets lie loose, each turned the other way; many are the edges of a thick document.
  if (count <= 4) {
    const side = level % 2 === 1 ? 1 : -1;
    return {
      x: side * depth * MAX_SHIFT * 0.6,
      y: depth * MAX_SHIFT * 0.7,
      turn: side * depth * MAX_TURN,
    };
  }
  return { x: depth * MAX_SHIFT * 0.5, y: depth * MAX_SHIFT, turn: ((level % 3) - 1) * 0.3 };
}

/**
 * A stack of paper: `under` blank sheets beneath the child, which is the sheet on top (a
 * `PaperSheet`, or anything that fills the box). The sheets beneath are shifted by at most 14px
 * and turned by at most 2 degrees; below 40em they are not shifted and turn by at most 1.2, so no
 * box leaves the page gutter. The stack is as large as its child: leave 14px around it from 40em.
 * Hook: `data-paper-stack`. Every other prop goes to the element.
 */
export function PaperStack({ under = 2, className, children, ref, ...rest }: PaperStackProps) {
  const count = Math.max(0, Math.floor(under));

  return (
    <div {...rest} ref={ref} data-paper-stack="" className={cx(styles.root, className)}>
      {Array.from({ length: count }, (_, index) => {
        // Deepest first, so the nearer sheets are painted over it.
        const place = placeOf(count - index, count);
        return (
          <span
            key={index}
            aria-hidden="true"
            className={styles.under}
            style={cssVars({
              "--dx": `${place.x.toFixed(2)}px`,
              "--dy": `${place.y.toFixed(2)}px`,
              "--rot": `${place.turn.toFixed(2)}deg`,
            })}
          />
        );
      })}
      {children}
    </div>
  );
}
