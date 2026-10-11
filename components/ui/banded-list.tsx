import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/lib/cx";
import styles from "./banded-list.module.css";

type BandedListProps = {
  as?: "ul" | "ol" | "dl" | "div";
  ref?: Ref<HTMLElement>;
} & HTMLAttributes<HTMLElement>;
type BandedRowProps = { as?: "li" | "div"; ref?: Ref<HTMLElement> } & HTMLAttributes<HTMLElement>;

/**
 * A list drawn as one sheet whose rows alternate between two tones, with no lines between them.
 * Takes `BandedRow` children. Use `as="dl"` with `BandedRow as="div"` for label and value pairs.
 * Every other prop, `ref` included, goes to the element.
 */
export function BandedList({ as: Tag = "ul", className, ref, ...rest }: BandedListProps) {
  // The tag is a union, and no one ref type fits every member of it: each is an HTMLElement.
  return <Tag {...rest} ref={ref as Ref<never>} className={cx(styles.list, className)} />;
}

/**
 * One row of a `BandedList`. It publishes its padding as `--row-pad-block` and `--row-pad-inline`,
 * so a `RowLink` inside can reach the row's edges.
 */
export function BandedRow({ as: Tag = "li", className, ref, ...rest }: BandedRowProps) {
  return <Tag {...rest} ref={ref as Ref<never>} className={cx(styles.row, className)} />;
}
