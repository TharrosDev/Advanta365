import { ViewTransition, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cssVars, cx } from "@/lib/cx";
import styles from "./folder.module.css";

type FolderProps = {
  /** What the tab says, such as the name of what is inside. */
  tab?: ReactNode;
  /**
   * How many blank sheets show above the front panel, or the sheets themselves (template covers,
   * say), the first furthest back. A sheet that is given is laid out by its giver: it stands in a
   * strip across the top of the back panel and places itself there.
   */
  sheets?: number | readonly ReactNode[];
  /**
   * `card` is the folder of a card or a row. `page` is the one a page is built around: every
   * measure of it is a share of its own width, so it is the same object at 18rem and at 34rem,
   * with a taller pocket for its sheets, a deeper inside, a card stock front with a thumb cut at
   * the middle of its top edge and two scores along its foot, and a deeper shadow.
   */
  size?: "card" | "page";
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
 * A folder of paper, the object the toolkit is sold as: a back panel with a tab at its top left
 * (which carries `tab`), a few sheets showing above the front panel, and the front panel in the
 * highlighter's wash, which holds the children. Inside the front panel the semantic colours are
 * those of a light surface. Under the pointer and under keyboard focus the showing sheets rise a
 * little, one after another; where the folder lies in an `article` or a `[data-folder-scope]`
 * that holds a link or a button beside it, focus in there does the same, and the article is also
 * what is hovered. Hooks: `data-folder`, and `data-folder-scope` on an element around it. Every
 * other prop goes to the element.
 */
export function Folder({
  tab,
  sheets = 3,
  size = "card",
  slug,
  className,
  frontClassName,
  children,
  ref,
  ...rest
}: FolderProps) {
  const leaves = typeof sheets === "number" ? null : sheets;
  const count = typeof sheets === "number" ? Math.max(0, Math.floor(sheets)) : 0;

  const folder = (
    <div
      {...rest}
      ref={ref}
      data-folder=""
      className={cx(styles.root, size === "page" && styles.page, className)}
    >
      <span aria-hidden="true" className={styles.back} />
      {tab === undefined || tab === null ? null : (
        <span className={cx("type-note", styles.tab)}>{tab}</span>
      )}
      {leaves
        ? leaves.map((leaf, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={styles.leaf}
              style={cssVars({ "--n": index })}
            >
              {leaf}
            </span>
          ))
        : Array.from({ length: count }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={styles.sheet}
              style={cssVars({ "--n": index })}
            />
          ))}
      <div className={cx(styles.front, frontClassName)}>
        {size === "page" ? <span aria-hidden="true" className={styles.frontStock} /> : null}
        {children}
      </div>
    </div>
  );

  if (!slug) return folder;

  return (
    <ViewTransition name={`folder-${slug}`} share="sheet-morph" default="none">
      {folder}
    </ViewTransition>
  );
}
