"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { KeepCompounds } from "@/components/ui/keep-compounds";
import { TextLink } from "@/components/ui/text-link";
import { cx } from "@/lib/cx";
import { PURCHASE_LINK } from "@/lib/site";
import styles from "./locked-tile.module.css";

/** How long a tile says no: the time its `data-denied` state lasts. */
const DENIED_MS = 600;

/**
 * The one control of a locked tile, and the line it answers with. It renders, in this order: the
 * heading, whose content is a `<button>` named "<title>, locked" (by its label) and stretched over the whole
 * tile; `children` (the tile's facts); and a polite live region that is there, empty, from the
 * first render.
 *
 * Pressing the button opens nothing. The tile (the nearest `[data-tile]`) carries `data-denied`
 * for 600ms: a red outline that pulses, a shake, and the padlock rattling (app/motion.css; under
 * reduced motion the outline alone). A press while it still carries the state takes it away and
 * puts it back, so the answer starts over. From the first press on, the live region holds one
 * line, "Included with the toolkit.", with a link to the purchase page; the button is described by
 * it.
 *
 * `initialDenied` is for a link that names this template (`?view=`): the server has already
 * rendered the tile with the state and the line, and here the tile is brought into view and the
 * answer given once, as a press would give it.
 */
export function LockedTile({
  title,
  headingLevel: Heading = "h3",
  initialDenied = false,
  children,
}: {
  title: string;
  headingLevel?: "h2" | "h3";
  initialDenied?: boolean;
  children?: ReactNode;
}) {
  const lineId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [told, setTold] = useState(initialDenied);

  const deny = () => {
    const tile = buttonRef.current?.closest<HTMLElement>("[data-tile]");
    if (!tile) return;
    window.clearTimeout(timer.current);
    tile.removeAttribute("data-denied");
    // Reading the layout between the two makes the browser see the state go, so that its
    // animations start from the beginning.
    void tile.offsetWidth;
    tile.setAttribute("data-denied", "");
    timer.current = window.setTimeout(() => tile.removeAttribute("data-denied"), DENIED_MS);
  };

  useEffect(() => {
    if (!initialDenied) return;
    buttonRef.current?.closest("[data-tile]")?.scrollIntoView({ block: "center" });
    deny();
  }, [initialDenied]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <>
      <Heading className={cx("type-ui", styles.title)}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.control}
          aria-label={`${title}, locked`}
          aria-describedby={lineId}
          onClick={() => {
            deny();
            setTold(true);
          }}
        >
          <KeepCompounds text={title} />
        </button>
      </Heading>
      {children}
      <p id={lineId} aria-live="polite" className={cx("type-note", styles.line)}>
        {told ? (
          <>
            Included with the toolkit.{" "}
            <TextLink href={PURCHASE_LINK.href} className={styles.way}>
              {PURCHASE_LINK.label}
            </TextLink>
          </>
        ) : null}
      </p>
    </>
  );
}
