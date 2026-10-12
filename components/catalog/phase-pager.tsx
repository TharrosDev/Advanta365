import { Icon } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";
import { cx } from "@/lib/cx";
import styles from "./phase-pager.module.css";

type Neighbour = { slug: string; name: string; order: number };

/**
 * The foot of a phase page: the phase before and the phase after, as two links in a navigation
 * named "Previous and next phase". Each link is a small label over the phase's numeral tile and
 * name, with an arrow pointing the way it goes; the numeral is hidden from assistive technology,
 * so the link reads "Previous phase Design". The first phase has no previous link and the last no
 * next one; the next link keeps the right-hand cell either way. Below 40em the two are stacked.
 * Hover, keyboard focus and a press fill a link with the wash and move its arrow.
 */
export function PhasePager({
  previous,
  next,
  className,
}: {
  previous?: Neighbour;
  next?: Neighbour;
  className?: string;
}) {
  if (!previous && !next) return null;

  const link = (phase: Neighbour, direction: "previous" | "next") => (
    <TransitionLink href={`/phases/${phase.slug}`} className={cx(styles.link, styles[direction])}>
      <Icon name="arrow" className={styles.arrow} />
      <span className={styles.words}>
        <span className={cx("type-note", styles.label)}>
          {direction === "previous" ? "Previous phase" : "Next phase"}
        </span>
        <span className={styles.phase}>
          <span className={styles.tile} aria-hidden="true">
            {phase.order}
          </span>
          <span className={cx("type-section", styles.name)}>{phase.name}</span>
        </span>
      </span>
    </TransitionLink>
  );

  return (
    <nav aria-label="Previous and next phase" className={cx(styles.root, className)}>
      {previous ? link(previous, "previous") : null}
      {next ? link(next, "next") : null}
    </nav>
  );
}
