import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/lib/cx";
import styles from "./wrap.module.css";

type WrapProps = {
  as?: "div" | "section" | "header" | "footer" | "nav";
  ref?: Ref<HTMLElement>;
} & HTMLAttributes<HTMLElement>;

/**
 * The page column: centred, at most the twelve-column grid wide, with the page padding on both
 * sides. Everything that lines up with the grid sits inside one.
 */
export function Wrap({ as: Tag = "div", className, ref, ...rest }: WrapProps) {
  // The tag is a union, and no one ref type fits every member of it: each is an HTMLElement.
  return <Tag {...rest} ref={ref as Ref<never>} className={cx(styles.root, className)} />;
}
