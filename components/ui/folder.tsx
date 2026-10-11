import { ViewTransition, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cssVars, cx } from "@/lib/cx";
import styles from "./folder.module.css";

type FolderProps = {
  /** What the tab says, such as the number of templates inside. */
  tab?: ReactNode;
  /** How many sheets show above the front panel. */
  sheets?: number;
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
 * highlighter's wash, which holds the children. Inside the front panel the semantic colours are
 * those of a light surface. Under the pointer and under keyboard focus the showing sheets rise a
 * little, one after another; where the folder lies in an `article` whose link is stretched over
 * it, the article is what is hovered. Hook: `data-folder`. Every other prop goes to the element.
 */
export function Folder({
  tab,
  sheets = 3,
  slug,
  className,
  frontClassName,
  children,
  ref,
  ...rest
}: FolderProps) {
  const count = Math.max(0, Math.floor(sheets));

  const folder = (
    <div {...rest} ref={ref} data-folder="" className={cx(styles.root, className)}>
      <span aria-hidden="true" className={styles.back} />
      {tab === undefined || tab === null ? null : (
        <span className={cx("type-note", styles.tab)}>{tab}</span>
      )}
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={styles.sheet}
          style={cssVars({ "--n": index })}
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
