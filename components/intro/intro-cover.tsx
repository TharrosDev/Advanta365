import {
  MARK_BAR_D,
  MARK_LEGS_D,
  MARK_STROKE_WIDTH,
  MARK_TAIL_D,
  MARK_VIEWBOX,
} from "@/lib/brand/mark";
import { cssVars, cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./intro-cover.module.css";

/** Ten blocks: nine written, the tenth yours. */
const BLOCKS = 10;

/**
 * The cover of a first visit, rendered by the home page alone. An ink sheet lies over the whole
 * window; on it the mark is written stroke by stroke (the "A" in white, then the tail of its
 * crossbar in the highlighter), a row of ten blocks fills from the left (nine in white, the tenth
 * in the highlighter) and the name fades in as one word. Then the sheet is lifted off the top edge
 * and the page, which was complete under it all along, is there.
 *
 * It is decoration over a finished page: `aria-hidden`, nothing in it can take focus, and it locks
 * neither focus nor scrolling. It is not displayed at all unless the inline script has set
 * `data-intro` on the root element, and its whole timeline is CSS (see the module).
 *
 * The mark is drawn here, not by `LogoMark`, because a pen needs the two strokes of the "A" as
 * separate paths; `pathLength` makes each one unit long, whatever its real length.
 * Hook: `data-intro-cover`.
 */
export function IntroCover() {
  const stroke = {
    pathLength: 1,
    strokeWidth: MARK_STROKE_WIDTH,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;

  return (
    <div data-intro-cover="" aria-hidden="true" className={styles.cover}>
      <div className={styles.signature}>
        <svg
          className={styles.logo}
          viewBox={`0 0 ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`}
          fill="none"
          focusable="false"
        >
          {/* As in `LogoMark`: the tail first, so the leg of the "A" covers its round start. */}
          <path className={cx(styles.pen, styles.tail)} d={MARK_TAIL_D} {...stroke} />
          <path className={cx(styles.pen, styles.legs)} d={MARK_LEGS_D} {...stroke} />
          <path className={cx(styles.pen, styles.bar)} d={MARK_BAR_D} {...stroke} />
        </svg>
        <span className={styles.tally}>
          {Array.from({ length: BLOCKS }, (_, index) => (
            <span
              key={index}
              className={cx(styles.block, index === BLOCKS - 1 && styles.yours)}
              style={cssVars({ "--i": index })}
            />
          ))}
        </span>
        <span className={styles.name}>{SITE.name}</span>
      </div>
    </div>
  );
}
