import { ViewTransition, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cssVars, cx } from "@/lib/cx";
import styles from "./folder.module.css";

/** The most sheets of the caller's own that stand in a folder. */
const MAX_INSIDE = 3;

type FolderProps = {
  /** What the tab says, such as the number of templates inside. */
  tab?: ReactNode;
  /** How many blank sheets show above the front panel. */
  sheets?: number;
  /**
   * What stands in the folder in place of the blank sheets, the first furthest back: each node
   * (a small cover, usually) is one sheet. At most three show, the first at the right and each
   * one after it a step to the left and in front, so the top right corner of every one shows.
   */
  inside?: readonly ReactNode[];
  /**
   * Makes the folder a shared object: on a page change it travels to the folder of the same slug
   * on the next page. Use a slug once per page.
   */
  slug?: string;
  frontClassName?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
} & HTMLAttributes<HTMLDivElement>;

/**
 * A folder of paper, the object a bundle is: a back panel with a tab at its top left (which
 * carries `tab`), a few sheets showing above the front panel, and the front panel in the
 * highlighter's wash, which holds the children. The sheets are blank paper, or with `inside` the
 * caller's own sheets (a bundle's first covers), which stand taller out of the folder. Inside the front panel the semantic colours are
 * those of a light surface. Under the pointer and under keyboard focus the showing sheets rise a
 * little, one after another; where the folder lies in an `article` whose link is stretched over
 * it, the article is what is hovered. Hook: `data-folder`. Every other prop goes to the element.
 */
export function Folder({
  tab,
  sheets = 3,
  slug,
  inside,
  className,
  frontClassName,
  children,
  ref,
  ...rest
}: FolderProps) {
  const count = Math.max(0, Math.floor(sheets));
  const standing = inside?.slice(0, MAX_INSIDE) ?? [];

  const folder = (
    <div
      {...rest}
      ref={ref}
      data-folder=""
      className={cx(styles.root, standing.length > 0 && styles.holding, className)}
    >
      <span aria-hidden="true" className={styles.back} />
      {tab === undefined || tab === null ? null : (
        <span className={cx("type-note", styles.tab)}>{tab}</span>
      )}
      {standing.length > 0
        ? standing.map((node, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={styles.standing}
              style={cssVars({ "--n": index, "--x": standing.length - 1 - index })}
            >
              {node}
            </span>
          ))
        : Array.from({ length: count }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={styles.sheet}
              style={cssVars({ "--n": index, "--x": standing.length - 1 - index })}
            />
          ))}
      <div className={cx(styles.front, frontClassName)}>{children}</div>
    </div>
  );

  if (!slug) return folder;

  return (
    <ViewTransition name={`folder-${slug}`} share="sheet-morph" default="none">
      {folder}
    </ViewTransition>
  );
}
