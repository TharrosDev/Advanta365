import { TransitionLink } from "@/components/motion/transition-link";
import { Chip } from "@/components/ui/chip";
import type { Bundle } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./bundle-card.module.css";

/**
 * A bundle as a ruled text card: title (the card's one link, stretched over the whole card), the
 * summary, and a footer row with the template count, the price and the saving.
 *
 * It is an `<article>`, one of only two kinds of article in the app (the other is `TemplateCard`),
 * so it is never rendered on /catalog or on a phase page.
 */
export function BundleCard({
  bundle,
  templateCount,
  savingsCents,
  headingLevel = "h3",
  className,
}: {
  bundle: Bundle;
  templateCount: number;
  savingsCents: number;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;

  return (
    <article className={cx(styles.card, "ruled", className)}>
      <Heading className={cx("t-headline-large", styles.title)}>
        <TransitionLink className={styles.link} href={`/bundles/${bundle.slug}`}>
          {bundle.title}
        </TransitionLink>
      </Heading>
      <p className={cx("t-body-large", "c-fg-60", styles.summary)}>{bundle.summary}</p>
      <div className={styles.footer}>
        <span className="t-body-large">
          {`${templateCount} ${templateCount === 1 ? "template" : "templates"}`}
        </span>
        <span className="t-body-large tabular">{formatPrice(bundle.priceCents)}</span>
        {savingsCents > 0 ? <Chip>{`Save ${formatPrice(savingsCents)}`}</Chip> : null}
      </div>
    </article>
  );
}
