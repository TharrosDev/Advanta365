import type { ReactNode } from "react";
import { InkBackdrop } from "@/components/ink/ink-backdrop";
import { Appear } from "@/components/ui/appear";
import { Band } from "@/components/ui/band";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { PageShift } from "@/components/ui/page-shift";
import { cx } from "@/lib/cx";
import styles from "./title-block.module.css";

function has(node: ReactNode): boolean {
  return node !== null && node !== undefined && node !== false && node !== "";
}

/**
 * The band that opens every inner page, on white paper. It holds the page's only `<h1>`, whose text
 * is exactly `title`, and it is the one block of the page that changes with the route
 * (`PageShift`). The title never animates; the lead drifts in as the page loads. A hyphenated
 * compound in the title ("End-User") is kept whole, so the title breaks at its spaces. There is no
 * rule in the margin.
 *
 * `form` chooses the layout from 68em:
 * - `index` (short titles, in `.type-banner`): the h1 stands in the margin; the lead and `children`
 *   sit beside it, with the lead on the title's baseline.
 * - `document` (long titles with a trail, in `.type-banner`): `crumbs` and `meta` stand in the
 *   margin, the trail on the title's baseline; the h1, the lead and `children` fill the content
 *   columns.
 * - `wide` (long titles without a trail, in `.type-statement`): the h1 runs across columns 1 to 9,
 *   the lead and `children` across columns 1 to 8.
 *
 * `aside` is an object (a stack of sheets, a numeral) in columns 9 to 12 from 68em, and under the
 * lead below it; the words then keep to columns 1 to 8.
 *
 * `ink` puts the `title` ink in the right 42% of the block, from 40em, and makes the block at least
 * 20rem tall from 68em. The title, the lead and `children` are one calm rectangle for it (the words
 * need no more room than that), so the ink thins under them and nowhere else.
 *
 * `flush` is for a page whose products start right under the title (an index, the catalog): the block
 * keeps no padding under its words, and no least height for the ink, so the padding of the band
 * that follows is the one space between the title and the first product. Give that band
 * `pad="tight"`.
 *
 * Below 68em every form is one column in the same order: crumbs, meta, h1, lead, children, aside.
 */
export function TitleBlock({
  title,
  lead,
  form = "index",
  crumbs,
  meta,
  children,
  ink = false,
  flush = false,
  aside,
}: {
  title: string;
  lead?: ReactNode;
  form?: "index" | "document" | "wide";
  crumbs?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  ink?: boolean;
  flush?: boolean;
  aside?: ReactNode;
}) {
  const hasLead = has(lead);
  const hasExtra = has(children);
  const hasAside = has(aside);

  // How many of the twelve columns the words may take.
  const span = hasAside ? styles.s8 : form === "wide" ? styles.s9 : ink ? styles.s8 : styles.s12;

  const trail = has(crumbs) ? <div className={styles.trail}>{crumbs}</div> : null;
  const facts = has(meta) ? <div className={styles.meta}>{meta}</div> : null;
  const heading = (
    <h1
      className={cx(
        form === "wide" ? "type-statement" : "type-banner",
        styles.title,
        form !== "index" && styles.measured,
      )}
    >
      <KeepCompounds text={title} />
    </h1>
  );
  const intro = hasLead ? (
    <Appear as="p" when="load" className={cx("type-lead", styles.lead)}>
      {lead}
    </Appear>
  ) : null;
  const extra = hasExtra ? <div className={styles.extra}>{children}</div> : null;

  let words: ReactNode;
  if (form === "wide") {
    words = (
      <>
        {trail}
        {facts}
        {heading}
        {intro}
        {extra}
      </>
    );
  } else if (form === "document") {
    words = (
      <>
        {trail || facts ? (
          <div className={cx(styles.column, styles.margin)}>
            {trail ? <div className={styles.titleLine}>{trail}</div> : null}
            {facts}
          </div>
        ) : null}
        <div className={cx(styles.column, styles.content)}>
          {heading}
          {intro}
          {extra}
        </div>
      </>
    );
  } else {
    words = (
      <>
        <div className={cx(styles.column, styles.margin)}>
          {trail}
          {facts}
          {heading}
        </div>
        <div className={cx(styles.column, styles.content, !hasLead && !hasExtra && styles.vacant)}>
          {intro ? <div className={styles.titleLine}>{intro}</div> : null}
          {extra}
        </div>
      </>
    );
  }

  return (
    <PageShift>
      <Band
        as="div"
        surface="paper"
        pad="none"
        className={cx(styles.block, ink && styles.inked, flush && styles.flush)}
        backdrop={
          ink ? (
            <InkBackdrop
              scene="title"
              still={{ wide: "title" }}
              edges="left bottom"
              className={styles.ink}
            />
          ) : undefined
        }
      >
        <div className={styles.grid}>
          <div
            className={cx(styles.words, styles[form], span)}
            data-ink-calm={ink ? "text" : undefined}
          >
            {words}
          </div>
          {hasAside ? <div className={styles.aside}>{aside}</div> : null}
        </div>
      </Band>
    </PageShift>
  );
}
