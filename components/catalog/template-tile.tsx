import type { ReactNode } from "react";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Tag } from "@/components/ui/tag";
import { TransitionLink } from "@/components/ui/transition-link";
import { DELIVERABLE_TYPE_LABELS } from "@/content/taxonomy";
import type { Template } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { LockedTile } from "./locked-tile";
import { TemplateCover } from "./template-cover";
import styles from "./template-tile.module.css";

/**
 * A template in a grid: a small tile. Always an `<article data-tile>` with exactly one control. Top
 * to bottom: the cover, printed with the template's own title and first line, in a square well, in
 * its format's proportions; the phase and type; the title; the format tag. (The tag printed on the
 * cover itself is left out: at this size it would lie over the cover's title.)
 *
 * A free sample (`data-free`) carries a "Free sample" tag and its title is the one link, `href`,
 * stretched over the tile; the cover rises under the pointer. `scroll={false}` keeps the page where
 * it is when the link is followed, for a link that opens the pop-up over the grid it stands in. The
 * link is not fetched ahead: its page is the whole catalog again, once for every sample in view.
 *
 * Every other template is locked (`data-locked`): its cover is out of focus, and only its cover,
 * and its title is a button that answers with the `data-denied` state and a line under the tile
 * (`LockedTile`). Nothing is drawn over the cover. `denied` renders the tile already
 * in that state, for a link that names a locked template. `href` is not used. The well carries
 * `data-well`, the hook of the red wash its `::before` lays under the cover of a denied tile.
 *
 * A hyphenated compound in the title ("End-User") is never broken. Lay tiles out in a `TileGrid`.
 */
export function TemplateTile({
  template,
  phaseName,
  phaseOrder,
  href,
  headingLevel = "h3",
  scroll = true,
  denied = false,
  unlocked = false,
}: {
  template: Template;
  phaseName?: string;
  phaseOrder?: number;
  href: string;
  headingLevel?: "h2" | "h3";
  scroll?: boolean;
  denied?: boolean;
  /** The browser holds a licence: every tile opens, as a free sample's does. */
  unlocked?: boolean;
}) {
  const Heading = headingLevel;
  const typeLabel = DELIVERABLE_TYPE_LABELS[template.deliverableType];
  const free = template.free;
  // A tile that opens its pop-up: a free sample's, or any tile for a buyer.
  const open = free || unlocked;

  const facts = (
    <>
      <p className={cx("type-note", styles.meta)}>
        {phaseName ? `${phaseName} · ${typeLabel}` : typeLabel}
      </p>
      <p className={styles.tags}>
        <Tag>{template.format.toUpperCase()}</Tag>
        {free && !unlocked ? <Tag variant="saving">Free sample</Tag> : null}
      </p>
    </>
  );

  return (
    <article
      data-tile=""
      data-free={free ? "" : undefined}
      data-locked={open ? undefined : ""}
      data-denied={!open && denied ? "" : undefined}
      data-format={template.format}
      className={styles.tile}
    >
      <div className={styles.well} data-well="">
        <div className={styles.cover}>
          <TemplateCover
            type={template.deliverableType}
            format={template.format}
            size="md"
            lit={open}
            title={template.title}
            summary={template.summary}
            phaseOrder={phaseOrder}
            tagClassName={styles.coverTag}
          />
        </div>
      </div>
      {open ? (
        <>
          <Heading className={cx("type-ui", styles.title)}>
            <TransitionLink className={styles.link} href={href} scroll={scroll} prefetch={false}>
              <KeepCompounds text={template.title} />
            </TransitionLink>
          </Heading>
          {facts}
        </>
      ) : (
        <LockedTile title={template.title} headingLevel={headingLevel} initialDenied={denied}>
          {facts}
        </LockedTile>
      )}
    </article>
  );
}

/**
 * The grid tiles lie in: a list with as many columns of at least 176px as its width holds, and
 * never fewer than two. Its children are `<li>` elements, one tile each. The gap between its rows
 * is where a locked tile's line stands.
 */
export function TileGrid({ className, children }: { className?: string; children: ReactNode }) {
  return <ul className={cx(styles.grid, className)}>{children}</ul>;
}
