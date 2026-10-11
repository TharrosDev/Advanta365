import { cx } from "@/lib/cx";
import styles from "./comparison-table.module.css";

export type ComparisonRow = { label: string; cells: readonly string[] };

/**
 * A comparison as a real table: one column per option, one row per criterion, the criteria as row
 * headers. The `emphasized` column is drawn inverted (an ink surface with background-coloured text),
 * from the tokens of whatever theme the table sits in.
 *
 * Below 768px the table is wider than a phone. It scrolls inside its own focusable region, so the
 * page never scrolls sideways, and the criteria stay pinned to the left edge while the options move.
 *
 * The caption is for assistive technology only and names the region; `note` is the line under the
 * table and describes it. It has no reveal of its own: the caller wraps it.
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
  /** Index of the column drawn inverted. */
  emphasized?: number;
  note?: string;
  className?: string;
}) {
  const captionId = `${id}-caption`;
  const noteId = note ? `${id}-note` : undefined;

  return (
    <div className={cx(styles.root, className)}>
      {/* The table scrolls inside its own box on a narrow screen; the page never does. */}
      <div className={styles.scroll} role="region" aria-labelledby={captionId} tabIndex={0}>
        <table className={styles.table} aria-describedby={noteId}>
          <caption id={captionId} className="visually-hidden">
            {caption}
          </caption>
          <thead>
            <tr>
              <td className={cx(styles.head, styles.pinned)} />
              {columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={cx(
                    "t-title-large",
                    styles.head,
                    index === emphasized && styles.emphasis,
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th
                  scope="row"
                  className={cx("t-label-large", "c-fg-60", styles.cell, styles.pinned)}
                >
                  {row.label}
                </th>
                {row.cells.map((cell, index) => (
                  // The emphasized cell takes its colour from the module, so it carries no c-fg class.
                  <td
                    key={columns[index] ?? index}
                    className={cx(
                      "t-body-large",
                      styles.cell,
                      index === emphasized ? styles.emphasis : "c-fg-80",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note ? (
        <p id={noteId} className="t-body-medium c-fg-60">
          {note}
        </p>
      ) : null}
    </div>
  );
}
