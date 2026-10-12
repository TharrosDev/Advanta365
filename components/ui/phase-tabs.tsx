import { TransitionLink } from "@/components/ui/transition-link";
import { cx } from "@/lib/cx";
import styles from "./phase-tabs.module.css";

/**
 * The rollout phases as numbered index tabs: a list of links to `/phases/{slug}`, in the order
 * given. Each link shows its number (the position in the list, hidden from assistive technology)
 * and the phase name, so its accessible name is exactly the phase name.
 *
 * `size="rail"` is the strip under the bar: equal tabs in one row, standing on the bottom edge of
 * whatever holds them. `size="large"` is the set of index cards on a page: two per row, then from
 * 40em one row in which each card is as wide as its name needs where the list is wide enough for
 * the seven, and four across where it is not.
 *
 * `current` is the slug of the phase being shown. `currentKind` says how: `page` when the page is
 * that phase, `true` when the page only belongs to it (a template of that phase). The component has
 * no state; a caller that knows the pathname passes `current`.
 */
export function PhaseTabs({
  phases,
  current,
  currentKind = "page",
  size = "rail",
  className,
}: {
  phases: ReadonlyArray<{ slug: string; name: string }>;
  current?: string;
  currentKind?: "page" | "true";
  size?: "rail" | "large";
  className?: string;
}) {
  return (
    <ul className={cx(styles.root, styles[size], className)}>
      {phases.map((phase, index) => (
        <li key={phase.slug} className={styles.item}>
          <TransitionLink
            href={`/phases/${phase.slug}`}
            className={styles.tab}
            aria-current={phase.slug === current ? currentKind : undefined}
          >
            <span className={styles.numeral} aria-hidden="true">
              {index + 1}
            </span>
            <span className={cx(size === "rail" ? "type-note" : "type-ui", styles.name)}>
              {phase.name}
            </span>
          </TransitionLink>
        </li>
      ))}
    </ul>
  );
}
