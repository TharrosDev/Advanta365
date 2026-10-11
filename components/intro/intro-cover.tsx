import { InkBackdrop } from "@/components/ink/ink-backdrop";
import {
  MARK_BAR_D,
  MARK_LEGS_D,
  MARK_STROKE_WIDTH,
  MARK_TAIL_D,
  MARK_VIEWBOX,
} from "@/lib/brand/mark";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./intro-cover.module.css";

/**
 * The cover of a first visit, rendered by the home page alone: the signing. On white paper the mark
 * is written in three pen strokes where it stands (both legs of the "A", its crossbar, then the
 * tail of the crossbar in the highlighter) and the name fades in under it. Then the cover fades and
 * the page, which was complete and painted under it all along, is there.
 *
 * Where the engine is ready in time the ink joins: the layer puts the canvas in the cover's own
 * backdrop and switches the state to `ink`; a black drop falls through the signature, a light-blue
 * one chases it, the ink turns to mist and the cover clears with it. Both ways out are CSS
 * animations started by the state alone, so the cover leaves even if every script stops.
 *
 * It is decoration over a finished page: `aria-hidden`, nothing in it can take focus, and it locks
 * neither focus nor scrolling. It takes the pointer while it is opaque, so the press that ends it
 * never lands on a link under it. "Skip" is a hint, not a control: any input ends the cover. It is
 * not displayed at all unless the boot script has set `data-intro` on the root element.
 *
 * The mark is drawn here, not by `LogoMark`, because a pen needs the strokes of the "A" as
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
      <InkBackdrop scene="intro" />
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
        <span className={styles.name}>{SITE.name}</span>
      </div>
      <span className={cx("type-note", styles.hint)}>Skip</span>
    </div>
  );
}
