import { Sheet } from "@/components/ui/sheet";
import { cx } from "@/lib/cx";
import styles from "./comparison-table.module.css";

export type ComparisonRow = { label: string; cells: readonly string[] };

/**
 * A comparison as a real table in a sheet: one column per option, one row per criterion, the
 * criteria as row headers. The `emphasized` column is the buyer's: its head is the highlighter with
 * an ink ring, its cells the wash at a heavier weight.
 *
 * Below 40em the table does not scroll. Each row becomes a block with its criterion as the heading
 * and one label and value pair per option; the label is printed from the cell's `data-label`. The
 * roles are written out on every part, so the table keeps its semantics once its display is block.
 *
 * The caption is for assistive technology only and names the table; `note` is the line under it.
 */
export function ComparisonTable({
  id,
  caption,
  columns,
  rows,
  emphasized,
  note,
  className,
}: {
  /** Prefix of the caption and note ids: `{id}-caption`, `{id}-note`. */
  id: string;
  caption: string;
  columns: readonly string[];
  rows: readonly ComparisonRow[];
  /** Index of the column drawn as the buyer's. */
  emphasized?: number;
  note?: string;
  className?: string;
}) {
  const captionId = `${id}-caption`;
  const noteId = note ? `${id}-note` : undefined;

  return (
    <div className={className}>
      <Sheet pad="none" className={styles.sheet}>
        <table
          role="table"
          className={styles.table}
          aria-labelledby={captionId}
          aria-describedby={noteId}
        >
          <caption id={captionId} className="visually-hidden">
            {caption}
          </caption>
          <thead role="rowgroup" className={styles.head}>
            <tr role="row" className={styles.row}>
              <td role="cell" className={cx(styles.corner, styles.cell)} />
              {columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  role="columnheader"
                  className={cx(
                    "type-item",
                    styles.cell,
                    styles.columnHead,
                    index === emphasized && styles.emphasis,
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup" className={styles.body}>
            {rows.map((row) => (
              <tr key={row.label} role="row" className={styles.row}>
                <th
                  scope="row"
                  role="rowheader"
                  className={cx("type-eyebrow", styles.cell, styles.rowHead)}
                >
                  {row.label}
                </th>
                {row.cells.map((cell, index) => (
                  <td
                    key={columns[index] ?? index}
                    role="cell"
                    data-label={columns[index]}
                    className={cx(
                      "type-copy",
                      styles.cell,
                      styles.value,
                      index === emphasized && styles.emphasis,
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Sheet>
      {note ? (
        <p id={noteId} className={cx("type-note", styles.note)}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
