import { KeepCompounds } from "@/components/ui/keep-compounds";
import { TransitionLink } from "@/components/ui/transition-link";
import { DELIVERABLE_TYPE_LABELS } from "@/content/taxonomy";
import type { Template } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./template-card.module.css";
import { TemplateCover } from "./template-cover";

/**
 * A template in a grid: a sheet with the cover on top, then the title, a meta line (`Phase · Type`,
 * the phase only where `phaseName` is given) and the price at the foot. Below 40em it is a row: the
 * cover at the left, the text beside it, and the format tag level with the price instead of on the
 * small cover.
 *
 * The title is the card's one link. It holds only the title text and is stretched over the whole
 * card, so the card is one tab stop and its focus ring is drawn around the card. A hyphenated
 * compound in the title ("End-User") is never broken across two lines.
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
    <article className={cx(styles.card, className)}>
      <TemplateCover
        type={template.deliverableType}
        format={template.format}
        className={styles.cover}
        tagClassName={styles.format}
      />
      <div className={styles.text}>
        <Heading className={cx("type-item", styles.title)}>
          <TransitionLink className={styles.link} href={`/templates/${template.slug}`}>
            <KeepCompounds text={template.title} />
          </TransitionLink>
        </Heading>
        <p className={cx("type-note", styles.meta)}>
          {phaseName ? `${phaseName} · ${typeLabel}` : typeLabel}
        </p>
      </div>
      <p className={cx("type-ui", "tabular", styles.price)}>{formatPrice(template.priceCents)}</p>
    </article>
  );
}
