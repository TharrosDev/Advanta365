import { Sheet } from "@/components/ui/sheet";
import { Tag } from "@/components/ui/tag";
import { TextLink } from "@/components/ui/text-link";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import styles from "./bundle-price-table.module.css";

type BundlePriceRow = {
  slug: string;
  title: string;
  /** How many templates the bundle holds. */
  count: number;
  priceCents: number;
  savingsCents: number;
};

/** The three figures after the name, each with the column width the table gives it from 40em. */
const FIGURES = [
  { label: "Templates", width: styles.wideFigure },
  { label: "Price", width: styles.narrowFigure },
  { label: "You save", width: styles.midFigure },
];

/**
 * The bundles and what each costs, as a real table in a sheet: the bundle's name (a link to it) as
 * the row header, then its template count, price and saving. Numbers are right-aligned and
 * tabular; a saving is a highlighted tag. Below 40em each row becomes a block with the name as its
 * heading and one label and value pair per figure, printed from `data-label`; the roles are written
 * out so the table keeps its semantics. The caption names the table for assistive technology.
 */
export function BundlePriceTable({
  caption,
  rows,
  className,
}: {
  caption: string;
  rows: readonly BundlePriceRow[];
  className?: string;
}) {
  const captionId = "bundle-prices-caption";

  return (
    <Sheet pad="none" className={cx(styles.sheet, className)}>
      <table role="table" className={styles.table} aria-labelledby={captionId}>
        <caption id={captionId} className="visually-hidden">
          {caption}
        </caption>
        <thead role="rowgroup" className={styles.head}>
          <tr role="row" className={styles.row}>
            <th
              scope="col"
              role="columnheader"
              className={cx("type-eyebrow", styles.cell, styles.headCell, styles.name)}
            >
              Bundle
            </th>
            {FIGURES.map((figure) => (
              <th
                key={figure.label}
                scope="col"
                role="columnheader"
                className={cx(
                  "type-eyebrow",
                  styles.cell,
                  styles.headCell,
                  styles.number,
                  figure.width,
                )}
              >
                {figure.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup" className={styles.body}>
          {rows.map((row) => (
            <tr key={row.slug} role="row" className={styles.row}>
              <th scope="row" role="rowheader" className={cx("type-ui", styles.cell, styles.name)}>
                <TextLink href={`/bundles/${row.slug}`}>{row.title}</TextLink>
              </th>
              <td
                role="cell"
                data-label="Templates"
                className={cx("type-copy", "tabular", styles.cell, styles.number, styles.value)}
              >
                {row.count}
              </td>
              <td
                role="cell"
                data-label="Price"
                className={cx("type-copy", "tabular", styles.cell, styles.number, styles.value)}
              >
                {formatPrice(row.priceCents)}
              </td>
              <td
                role="cell"
                data-label="You save"
                className={cx("type-copy", "tabular", styles.cell, styles.number, styles.value)}
              >
                {row.savingsCents > 0 ? (
                  <Tag variant="saving">{formatPrice(row.savingsCents)}</Tag>
                ) : (
                  formatPrice(row.savingsCents)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Sheet>
  );
}
