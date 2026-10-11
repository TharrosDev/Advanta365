import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/lib/cx";
import styles from "./banded-list.module.css";

type BandedListProps = {
  as?: "ul" | "ol" | "dl" | "div";
  ref?: Ref<HTMLElement>;
} & HTMLAttributes<HTMLElement>;
type BandedRowProps = { as?: "li" | "div"; ref?: Ref<HTMLElement> } & HTMLAttributes<HTMLElement>;

/**
 * A ledger: rows kept apart by hairlines, with one above the first and one under the last, and no
 * box around them. Takes `BandedRow` children. Use `as="dl"` with `BandedRow as="div"` for label
 * and value pairs. Where view timelines exist the hairlines are drawn from the left as the ledger
 * scrolls in. Hook: `data-ledger`. Every other prop, `ref` included, goes to the element.
 */
export function BandedList({ as: Tag = "ul", className, ref, ...rest }: BandedListProps) {
  // The tag is a union, and no one ref type fits every member of it: each is an HTMLElement.
  return (
    <Tag {...rest} ref={ref as Ref<never>} data-ledger="" className={cx(styles.list, className)} />
  );
}

/**
 * One row of a `BandedList`. The row's text is flush with the ledger's edges. It publishes
 * `--row-pad-block` and `--row-pad-inline`: a `RowLink` inside reaches the hairlines above and
 * below and stands 14px past both ends of the row, so its wash has room around the text.
 */
export function BandedRow({ as: Tag = "li", className, ref, ...rest }: BandedRowProps) {
  return <Tag {...rest} ref={ref as Ref<never>} className={cx(styles.row, className)} />;
}

/** The same two under the names the pages use for them. */
export { BandedList as Ledger, BandedRow as LedgerRow };
