import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Tag } from "@/components/ui/tag";
import { Tally } from "@/components/ui/tally";
import { TransitionLink } from "@/components/ui/transition-link";
import type { PhaseCoverage } from "@/lib/catalog/coverage";
import type { Bundle } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./bundle-card.module.css";

/**
 * A bundle drawn as a folder: a sheet with a tab on its top-left edge. The tab carries the number of
 * templates inside. In the body: the title (the card's one link, stretched over the whole card), the
 * summary, a seven-block tally of the rollout phases the bundle reaches when `coverage` is given,
 * and a foot row with the price and the saving.
 *
 * It is an `<article>`, one of only two kinds of article in the app (the other is `TemplateCard`),
 * so it is never rendered on /catalog or on a phase page. The card leaves 28px above itself for the
 * tab.
 */
export function BundleCard({
  bundle,
  templateCount,
  savingsCents,
  coverage,
  headingLevel = "h3",
  className,
}: {
  bundle: Bundle;
  templateCount: number;
  savingsCents: number;
  coverage?: readonly PhaseCoverage[];
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;
  const covered = coverage?.filter((phase) => phase.covered) ?? [];

  return (
    <article className={cx(styles.card, className)}>
      <p className={cx("type-note", styles.tab)}>
        {`${templateCount} ${templateCount === 1 ? "template" : "templates"}`}
      </p>
      <Heading className={cx("type-section", styles.title)}>
        <TransitionLink className={styles.link} href={`/bundles/${bundle.slug}`}>
          <KeepCompounds text={bundle.title} />
        </TransitionLink>
      </Heading>
      <p className={cx("type-copy", styles.summary)}>{bundle.summary}</p>
      <div className={styles.base}>
        {coverage ? (
          <Tally
            total={coverage.length}
            filled={covered.map((phase) => phase.order)}
            size="md"
            numerals
            label={`Phases: ${covered.map((phase) => phase.name).join(", ")}`}
          />
        ) : null}
        <div className={styles.foot}>
          <span className={styles.price}>{formatPrice(bundle.priceCents)}</span>
          {savingsCents > 0 ? (
            <Tag variant="saving">{`Save ${formatPrice(savingsCents)}`}</Tag>
          ) : null}
        </div>
      </div>
    </article>
  );
}
