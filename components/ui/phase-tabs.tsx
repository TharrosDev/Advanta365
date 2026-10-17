import { TransitionLink } from "@/components/ui/transition-link";
import { phaseHref } from "@/lib/catalog/search-params";
import { cx } from "@/lib/cx";
import styles from "./phase-tabs.module.css";

type TabPhase = { slug: string; name: string; number?: number };

/**
 * The toolkit's sections as index tabs: a list of links to `/phases/{slug}`, in the order given.
 * A numbered phase shows its number (hidden from assistive technology) over its plain name; Start
 * here and Used at every step have no number. The cards are two per row, then from 40em as many as
 * fit.
 *
 * `current` is the slug of the section being shown. `currentKind` says how: `page` when the page
 * is that section, `true` when the page only belongs to it. The component has no state; a caller
 * that knows the pathname passes `current`.
 */
export function PhaseTabs({
  phases,
  current,
  currentKind = "page",
  className,
}: {
  phases: ReadonlyArray<TabPhase>;
  current?: string;
  currentKind?: "page" | "true";
  className?: string;
}) {
  return (
    <ul className={cx(styles.root, styles.large, className)}>
      {phases.map((phase) => (
        <li key={phase.slug} className={styles.item}>
          <TransitionLink
            href={phaseHref(phase.slug)}
            className={styles.tab}
            aria-current={phase.slug === current ? currentKind : undefined}
          >
            {phase.number === undefined ? null : (
              <span className={styles.numeral} aria-hidden="true">
                {phase.number}
              </span>
            )}
            <span className={cx("type-ui", styles.name)}>{phase.name}</span>
          </TransitionLink>
        </li>
      ))}
    </ul>
  );
}
