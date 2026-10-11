import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/lib/cx";
import styles from "./sheet.module.css";

type SheetProps = {
  as?: "div" | "section" | "aside";
  edge?: "rule" | "ink";
  pad?: "none" | "tight" | "regular" | "roomy";
  ref?: Ref<HTMLElement>;
} & HTMLAttributes<HTMLElement>;

/**
 * A sheet of paper on the desk: the panel behind cards, tables, summaries and callouts. `edge` is
 * its border (a hairline rule, or 2px of ink for the panel a page is about); `pad` is its padding,
 * one step smaller below 40em. Every other prop, `ref` included, goes to the element.
 */
export function Sheet({
  as: Tag = "div",
  edge = "rule",
  pad = "regular",
  className,
  ref,
  ...rest
}: SheetProps) {
  return (
    <Tag
      {...rest}
      // The tag is a union, and no one ref type fits every member of it: each is an HTMLElement.
      ref={ref as Ref<never>}
      className={cx(styles.root, styles[edge], styles[pad], className)}
    />
  );
}
