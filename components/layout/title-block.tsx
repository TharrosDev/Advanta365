import type { ReactNode } from "react";
import { Band } from "@/components/ui/band";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Split } from "@/components/ui/split";
import { cx } from "@/lib/cx";
import styles from "./title-block.module.css";

function has(node: ReactNode): boolean {
  return node !== null && node !== undefined && node !== false && node !== "";
}

/**
 * The band that opens every inner page. It holds the page's only `<h1>`, whose text is exactly
 * `title`, on the desk surface. A hyphenated compound in the title ("End-User") is kept whole, so
 * the title breaks at its spaces.
 *
 * `form` chooses the layout from 68em:
 * - `index` (short titles): the h1 stands in the margin; the lead and `children` sit beside it,
 *   with the lead on the title's baseline.
 * - `document` (long titles with a trail): `crumbs` and `meta` stand in the margin, the trail on
 *   the title's baseline; the h1, the lead and `children` fill the content columns.
 * - `wide` (long titles without a trail): the h1 runs across columns 1 to 9, the lead and
 *   `children` across columns 1 to 8, and there is no margin rule.
 *
 * Below 68em every form is one column in the same order: crumbs, meta, h1, lead, children.
 */
export function TitleBlock({
  title,
  lead,
  form = "index",
  crumbs,
  meta,
  children,
}: {
  title: string;
  lead?: ReactNode;
  form?: "index" | "document" | "wide";
  crumbs?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  const hasLead = has(lead);
  const hasExtra = has(children);

  const trail = has(crumbs) ? <div className={styles.trail}>{crumbs}</div> : null;
  const facts = has(meta) ? <div className={styles.meta}>{meta}</div> : null;
  const heading = (
    <h1 className={cx("type-page", styles.title, form !== "index" && styles.measured)}>
      <KeepCompounds text={title} />
    </h1>
  );
  const intro = hasLead ? <p className={cx("type-lead", styles.lead)}>{lead}</p> : null;
  const extra = hasExtra ? <div className={styles.extra}>{children}</div> : null;

  if (form === "wide") {
    return (
      <Band as="div" surface="desk" pad="title">
        <div className={styles.wide}>
          {trail}
          {facts}
          {heading}
          {intro}
          {extra}
        </div>
      </Band>
    );
  }

  if (form === "document") {
    return (
      <Band as="div" surface="desk" pad="title">
        <Split
          margin={
            trail || facts ? (
              <>
                {trail ? <div className={styles.titleLine}>{trail}</div> : null}
                {facts}
              </>
            ) : undefined
          }
          marginClassName={styles.column}
          contentClassName={styles.column}
        >
          {heading}
          {intro}
          {extra}
        </Split>
      </Band>
    );
  }

  return (
    <Band as="div" surface="desk" pad="title">
      <Split
        className={styles.index}
        margin={
          <>
            {trail}
            {facts}
            {heading}
          </>
        }
        marginClassName={styles.column}
        contentClassName={cx(styles.column, !hasLead && !hasExtra && styles.vacant)}
      >
        {intro ? <div className={styles.titleLine}>{intro}</div> : null}
        {extra}
      </Split>
    </Band>
  );
}
