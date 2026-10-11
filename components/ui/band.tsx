import type { HTMLAttributes, Ref } from "react";
import { Wrap } from "@/components/ui/wrap";
import { cx } from "@/lib/cx";
import styles from "./band.module.css";

type BandProps = {
  as?: "section" | "div" | "header" | "footer" | "aside";
  surface?: "desk" | "paper" | "wash" | "binder";
  pad?: "none" | "title" | "tight" | "regular";
  /** Lands on the inner `Wrap`, the element that holds the children. */
  innerClassName?: string;
  ref?: Ref<HTMLElement>;
} & HTMLAttributes<HTMLElement>;

/**
 * A full-width strip of the page on one surface, with its content in a `Wrap`. `surface` becomes
 * `data-band`, which paints the ground and redefines the semantic colours for everything inside.
 * `pad` is the block padding; it is published as `--pad` so a `Split` inside can run its margin rule
 * through it. Edges between bands are hard.
 */
export function Band({
  as: Tag = "section",
  surface = "desk",
  pad = "regular",
  className,
  innerClassName,
  children,
  ref,
  ...rest
}: BandProps) {
  return (
    <Tag
      {...rest}
      // The tag is a union, and no one ref type fits every member of it: each is an HTMLElement.
      ref={ref as Ref<never>}
      data-band={surface}
      className={cx(styles.root, styles[pad], className)}
    >
      <Wrap className={innerClassName}>{children}</Wrap>
    </Tag>
  );
}
