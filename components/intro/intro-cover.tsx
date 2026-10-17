import { MARK_HUE_D, MARK_INK_D, MARK_VIEWBOX } from "@/lib/brand/mark";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import styles from "./intro-cover.module.css";

/**
 * The cover of a first visit, rendered by the home page alone: the signing. On white paper the arm
 * of the mark rises smoothly from its foot to the peak, then the leg in the highlighter drops from
 * the peak to the ground, fast and with weight, and settles. The name and "An EchoFive product" are
 * then written in under it, one after the other. Then the cover fades and the page, already
 * complete and painted underneath, is there.
 *
 * Every way out is a CSS animation started by the state alone, so the cover leaves even if every
 * script stops.
 *
 * It is decoration over a finished page: `aria-hidden`, nothing in it can take focus, and it locks
 * neither focus nor scrolling. It takes the pointer for as long as a press can end it and through
 * the whole 200ms skip, and the boot script swallows the click of a touch that outlasts the skip,
 * so the press that ends it never lands on a link under it. "Skip" is a hint, not a control: any
 * input ends the cover. It is not displayed at all unless the boot script has set `data-intro` on
 * the root element.
 *
 * The mark is drawn here, not by `LogoMark`, because the two halves move one after the other and
 * need classes of their own. Hook: `data-intro-cover`.
 */
export function IntroCover() {
  return (
    <div data-intro-cover="" aria-hidden="true" className={styles.cover}>
      <div className={styles.signature}>
        <svg
          className={styles.logo}
          viewBox={`0 0 ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`}
          fill="none"
          focusable="false"
        >
          {/* As in `LogoMark`: the leg first, so the arm covers the edge where they meet. */}
          <path className={styles.leg} d={MARK_HUE_D} />
          <path className={styles.arm} d={MARK_INK_D} />
        </svg>
        <span className={styles.name}>
          <span className={styles.write}>{SITE.name}</span>
        </span>
        <span className={styles.byline}>
          <span className={styles.write}>An {SITE.parent} product</span>
        </span>
      </div>
      <span className={cx("type-note", styles.hint)}>Skip</span>
    </div>
  );
}
