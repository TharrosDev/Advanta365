import type { HTMLAttributes, Ref } from "react";
import { cssVars, cx } from "@/lib/cx";
import styles from "./paper-sheet.module.css";

type PaperSheetProps = {
  as?: "div" | "section" | "aside" | "span" | "li";
  /** The sheet's proportions: free, portrait (5/7), landscape (4/3) or slide (16/9). */
  ratio?: "free" | "portrait" | "landscape" | "slide";
  /** `md` and `lg` carry the paper's grain; `sm` is a thumbnail and does not. */
  size?: "sm" | "md" | "lg";
  /** Elevation at rest, 0 to 4. The lifted shadow is one step up, and at least 3. */
  depth?: 0 | 1 | 2 | 3 | 4;
  /** Rises, tilts and takes the light under the pointer. */
  lit?: boolean;
  /** The resting turn, in degrees. */
  turn?: number;
  ref?: Ref<HTMLElement>;
} & HTMLAttributes<HTMLElement>;

/**
 * The paper object: a sheet with a light on it (white at the light, a shade darker at its far
 * corners), its tooth, a 3px corner and a layered shadow. It has no padding of its own. Its paper
 * is painted on `::before`, so a caller can cut it with `--sheet-clip` (a clip-path, for a folded
 * corner) and keep the shadow; its lifted shadow waits on `::after`, and only that shadow's
 * opacity ever moves. Inside it the semantic colours are those of paper, whatever band it lies on.
 *
 * The sheet owns its resting `rotate` (`turn`), its lift and its tilt; an entrance belongs to a
 * wrapper around it (`Appear`). Hooks: `data-paper`, and `data-lit` on a lit sheet. Every other
 * prop, `ref` included, goes to the element.
 */
export function PaperSheet({
  as: Tag = "div",
  ratio = "free",
  size = "md",
  depth = 2,
  lit = false,
  turn,
  className,
  style,
  ref,
  ...rest
}: PaperSheetProps) {
  return (
    <Tag
      {...rest}
      // The tag is a union, and no one ref type fits every member of it: each is an HTMLElement.
      ref={ref as Ref<never>}
      data-paper=""
      data-lit={lit ? "" : undefined}
      className={cx(styles.root, styles[ratio], styles[size], styles[`depth${depth}`], className)}
      style={turn === undefined ? style : { ...style, ...cssVars({ "--turn": `${turn}deg` }) }}
    />
  );
}
