import { Icon } from "@/components/ui/icon";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Tag } from "@/components/ui/tag";
import { TransitionLink } from "@/components/ui/transition-link";
import { DELIVERABLE_TYPE_LABELS } from "@/content/taxonomy";
import type { Template } from "@/lib/catalog/schema";
import { cssVars, cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./template-card.module.css";
import { TemplateCover } from "./template-cover";

/** The resting turn of the sheets of a spread, in degrees, by position. */
const TURNS = [-0.6, 0.4, -0.3, 0.5, -0.4, 0.3] as const;

/**
 * A template in a list. Always an `<article>` with exactly one link, whose text is the title; the
 * link is stretched over the article, so the card is one tab stop and its focus ring is drawn
 * around the whole of it. A hyphenated compound in the title ("End-User") is never broken.
 *
 * `layout="row"` is a row of an index: from 68em its position (`index`, from 1, printed as "01"),
 * the cover as a thumbnail, the title with the summary on one line, the phase numeral
 * (`phaseOrder`) with `Phase · Type`, the format tag, the price and an arrow, on a hairline; one
 * above the first row too, when the rows are list items. Narrower, the row drops the number and
 * the summary, and below 40em the price and the tag share its last line. A row never animates in.
 *
 * `layout="sheet"` is the template as an object, from 40em: its cover printed with its own title
 * and first line, lit, standing at the foot of a sheet area in its format's proportions and turned
 * a little by its `index`, with a caption under it that is never turned: phase and type, the
 * title, and the price on the card's last line, so the prices of a row of cards share a baseline.
 * The sheet settles as it scrolls into view, later by its `index`. Below 40em it is the row.
 *
 * The cover shares its place with the same template's cover on the next page, so on a page change
 * the sheet travels. Give `share={false}` where the same template can appear twice on a page.
 */
export function TemplateCard({
  template,
  phaseName,
  phaseOrder,
  headingLevel = "h3",
  layout = "row",
  index,
  share = true,
  className,
}: {
  template: Template;
  phaseName?: string;
  phaseOrder?: number;
  headingLevel?: "h2" | "h3";
  layout?: "row" | "sheet";
  index?: number;
  share?: boolean;
  className?: string;
}) {
  const Heading = headingLevel;
  const typeLabel = DELIVERABLE_TYPE_LABELS[template.deliverableType];
  const sheet = layout === "sheet";
  const place = index === undefined ? 0 : Math.max(0, index - 1);
  const cover = { type: template.deliverableType, format: template.format, phaseOrder };

  return (
    <article
      data-layout={layout}
      data-format={template.format}
      className={cx(styles.card, sheet ? styles.sheet : styles.row, className)}
    >
      {!sheet && index !== undefined ? (
        <span aria-hidden="true" className={styles.index}>
          {String(index).padStart(2, "0")}
        </span>
      ) : null}
      <div className={styles.thumb}>
        <TemplateCover {...cover} size="sm" slug={share && !sheet ? template.slug : undefined} />
      </div>
      {sheet ? (
        <div className={styles.area}>
          <div
            className={styles.object}
            data-move="settle"
            style={cssVars({ "--order": place, "--turn": `${TURNS[place % TURNS.length]}deg` })}
          >
            <TemplateCover
              {...cover}
              size="md"
              lit
              slug={share ? template.slug : undefined}
              title={template.title}
              summary={template.summary}
              className={styles.cover}
            />
          </div>
        </div>
      ) : null}
      <div className={styles.text}>
        <Heading className={cx("type-item", styles.title)}>
          <TransitionLink className={styles.link} href={`/templates/${template.slug}`}>
            <KeepCompounds text={template.title} />
          </TransitionLink>
        </Heading>
        {sheet ? null : <p className={cx("type-note", styles.summary)}>{template.summary}</p>}
      </div>
      <div className={styles.facts}>
        <p className={cx("type-note", styles.meta)}>
          {phaseOrder === undefined ? null : (
            <span aria-hidden="true" className={styles.chip}>
              {phaseOrder}
            </span>
          )}
          {phaseName ? `${phaseName} · ${typeLabel}` : typeLabel}
        </p>
        <Tag className={styles.format}>{template.format.toUpperCase()}</Tag>
      </div>
      <p className={cx("tabular", styles.price)}>{formatPrice(template.priceCents)}</p>
      {sheet ? null : <Icon name="arrow" className={styles.arrow} />}
    </article>
  );
}
