import type { ReactNode } from "react";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { Tag } from "@/components/ui/tag";
import { TransitionLink } from "@/components/ui/transition-link";
import { DELIVERABLE_TYPE_LABELS } from "@/content/taxonomy";
import type { Template } from "@/lib/catalog/schema";
import { cx } from "@/lib/cx";
import { ChainLock, ChainLockParts } from "./chain-lock";
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
 * under a chain and a padlock (`ChainLock`), and its title is a button that answers with the
 * `data-denied` state and a line under the tile (`LockedTile`). `denied` renders the tile already
 * in that state, for a link that names a locked template. `href` is not used.
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
}: {
  template: Template;
  phaseName?: string;
  phaseOrder?: number;
  href: string;
  headingLevel?: "h2" | "h3";
  scroll?: boolean;
  denied?: boolean;
}) {
  const Heading = headingLevel;
  const typeLabel = DELIVERABLE_TYPE_LABELS[template.deliverableType];
  const free = template.free;

  const facts = (
    <>
      <p className={cx("type-note", styles.meta)}>
        {phaseName ? `${phaseName} · ${typeLabel}` : typeLabel}
      </p>
      <p className={styles.tags}>
        <Tag>{template.format.toUpperCase()}</Tag>
        {free ? <Tag variant="saving">Free sample</Tag> : null}
      </p>
    </>
  );

  return (
    <article
      data-tile=""
      data-free={free ? "" : undefined}
      data-locked={free ? undefined : ""}
      data-denied={!free && denied ? "" : undefined}
      data-format={template.format}
      className={styles.tile}
    >
      <div className={styles.well}>
        <div className={styles.cover}>
          <TemplateCover
            type={template.deliverableType}
            format={template.format}
            size="md"
            lit={free}
            title={template.title}
            summary={template.summary}
            phaseOrder={phaseOrder}
            tagClassName={styles.coverTag}
          />
        </div>
        {free ? null : <ChainLock />}
      </div>
      {free ? (
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
 * is where a locked tile's line stands. It carries the drawing every lock in it draws from
 * (`ChainLockParts`); pass `locks={false}` for a grid that holds free samples only.
 */
export function TileGrid({
  className,
  locks = true,
  children,
}: {
  className?: string;
  locks?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      {locks ? <ChainLockParts /> : null}
      <ul className={cx(styles.grid, className)}>{children}</ul>
    </>
  );
}
