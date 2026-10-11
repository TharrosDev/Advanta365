import { Folder } from "@/components/ui/folder";
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
 * A bundle, drawn with a `Folder` whose tab carries the number of templates inside. Always an
 * `<article>` (one of only two kinds in the app; the other is `TemplateCard`) with exactly one
 * link, the title, stretched over the whole of it, so the card is one tab stop.
 *
 * `layout="feature"` is the large folder: its front panel holds the title, the summary, a
 * seven-block tally of the rollout phases the bundle reaches when `coverage` is given, the price
 * and the saving. `layout="row"` is a row of a ledger: the folder as a 13rem object at the left,
 * then the title, the summary and the tally, and the price with the saving at the right, on a
 * hairline (one above the first row too, when the rows are list items). Below 68em the price goes
 * under the text, and below 40em the folder stands above it.
 *
 * The folder shares its place with the same bundle's folder on the next page, so on a page change
 * it travels. Give `share={false}` where the same bundle can appear twice on a page.
 */
export function BundleCard({
  bundle,
  templateCount,
  savingsCents,
  coverage,
  headingLevel = "h3",
  layout = "row",
  share = true,
  className,
}: {
  bundle: Bundle;
  templateCount: number;
  savingsCents: number;
  coverage?: readonly PhaseCoverage[];
  headingLevel?: "h2" | "h3";
  layout?: "row" | "feature";
  share?: boolean;
  className?: string;
}) {
  const Heading = headingLevel;
  const covered = coverage?.filter((phase) => phase.covered) ?? [];
  const feature = layout === "feature";
  const count = `${templateCount} ${templateCount === 1 ? "template" : "templates"}`;
  const slug = share ? bundle.slug : undefined;

  const title = (
    <Heading className={cx(feature ? "type-page" : "type-section", styles.title)}>
      <TransitionLink className={styles.link} href={`/bundles/${bundle.slug}`}>
        <KeepCompounds text={bundle.title} />
      </TransitionLink>
    </Heading>
  );
  const summary = <p className={cx("type-copy", styles.summary)}>{bundle.summary}</p>;
  const tally = coverage ? (
    <Tally
      total={coverage.length}
      filled={covered.map((phase) => phase.order)}
      size="md"
      numerals
      label={`Phases: ${covered.map((phase) => phase.name).join(", ")}`}
      className={styles.tally}
    />
  ) : null;
  const foot = (
    <div className={styles.foot}>
      <span className={styles.price}>{formatPrice(bundle.priceCents)}</span>
      {savingsCents > 0 ? <Tag variant="saving">{`Save ${formatPrice(savingsCents)}`}</Tag> : null}
    </div>
  );

  if (feature) {
    return (
      <article data-layout="feature" className={cx(styles.card, styles.feature, className)}>
        <Folder tab={count} slug={slug} className={styles.folder} frontClassName={styles.front}>
          {title}
          {summary}
          <div className={styles.base}>
            {tally}
            {foot}
          </div>
        </Folder>
      </article>
    );
  }

  return (
    <article data-layout="row" className={cx(styles.card, styles.row, className)}>
      <Folder tab={count} slug={slug} className={styles.object} />
      <div className={styles.text}>
        {title}
        {summary}
        {tally}
      </div>
      {foot}
    </article>
  );
}
