import { TransitionLink } from "@/components/motion/transition-link";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { DELIVERABLE_TYPE_LABELS } from "@/content/taxonomy";
import type { Template } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./template-card.module.css";
import { TemplateCover } from "./template-cover";

/**
 * A catalog card in the reference's insight-card style: a square generated cover, the title, a meta
 * line (`Phase · Type`, the phase only where `phaseName` is given) and the price.
 *
 * The title is the card's ONE link. It contains only the title text and is stretched over the whole
 * card, so the card has a single tab stop and the cover stays decorative (`aria-hidden`). A
 * hyphenated compound in the title ("End-User") is never broken across two lines.
 */
export function TemplateCard({
  template,
  phaseName,
  headingLevel = "h3",
  className,
}: {
  template: Template;
  phaseName?: string;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;
  const typeLabel = DELIVERABLE_TYPE_LABELS[template.deliverableType];

  return (
    <article className={cx(styles.card, "ruled", className)}>
      <div className={styles.cover} aria-hidden="true">
        <TemplateCover type={template.deliverableType} format={template.format} />
      </div>
      <Heading className={cx("t-headline-small", styles.title)}>
        <TransitionLink className={styles.link} href={`/templates/${template.slug}`}>
          <KeepCompounds text={template.title} />
        </TransitionLink>
      </Heading>
      <div className={styles.meta}>
        <p className="t-body-large">{phaseName ? `${phaseName} · ${typeLabel}` : typeLabel}</p>
        <p className="t-body-large c-fg-60 tabular">{formatPrice(template.priceCents)}</p>
      </div>
    </article>
  );
}
