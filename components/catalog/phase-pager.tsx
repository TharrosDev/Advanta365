import { Icon } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";
import { phaseHref } from "@/lib/catalog/search-params";
import { cx } from "@/lib/cx";
import styles from "./phase-pager.module.css";

type Neighbour = { slug: string; name: string; number?: number };

/**
 * The foot of a section's page: the section before and the section after, in folder order, as two
 * links in a navigation named "Previous and next phase". Each link is a small label over the
 * section's numeral tile (none for Start here and Used at every step) and name, with an arrow
 * pointing the way it goes; the numeral is hidden from assistive technology, so the link reads
 * "Previous Design the platform". Start here has no previous link and Used at every step no next
 * one; the next link keeps the right-hand cell either way. Below 40em the two are stacked.
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
    <TransitionLink href={phaseHref(phase.slug)} className={cx(styles.link, styles[direction])}>
      <Icon name="arrow" className={styles.arrow} />
      <span className={styles.words}>
        <span className={cx("type-note", styles.label)}>
          {direction === "previous" ? "Previous" : "Next"}
        </span>
        <span className={styles.phase}>
          {phase.number === undefined ? null : (
            <span className={styles.tile} aria-hidden="true">
              {phase.number}
            </span>
          )}
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
