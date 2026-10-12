"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { previousEntryIs, type WindowWithNavigation } from "@/lib/history";
import { createScrimPress } from "@/lib/scrim";
import styles from "./page-dialog.module.css";

// The server has no layout to measure; there the effect is the ordinary one and never runs.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

const never = () => () => undefined;

/**
 * A pop-up that is part of the page's address: a native modal `<dialog>` over the dimmed page, a
 * sheet of paper at the top of the stack with a bar that holds Close and a body that scrolls. The
 * page renders it only while the address asks for it (a free sample in `view`, the checkout in
 * `checkout`), so being rendered is being open: it is made modal before the first paint, and it
 * closes by going to `closeHref`, the same address without that parameter, without moving the
 * page: back one entry when a link inside the site opened it from that very address (the open was
 * a push, so no entry is left behind), otherwise in place of the current entry.
 *
 * It closes on Escape, on Close and on a click on the dimmed page (a click whose target is the
 * dialog itself, the panel covers all of it, and whose press began there too, so that a selection
 * dragged out of the panel does not close it). The dialog's own `close` event is what leaves the
 * address, so every way of closing is one handler. Focus goes back to whatever had it when the
 * dialog opened, the link that was followed; when the page takes the dialog away instead (Back),
 * it is closed first so that focus goes back the same way.
 *
 * The server sends `<dialog open>`, drawn where the modal one stands and with the page dimmed
 * around it, so the content shows before the script runs and without it. Close is a link to
 * `closeHref` for the same reason. A dialog that arrives by a link inside the site enters with a
 * short movement (`data-enter`, app/motion.css); one that was in the server's page does not.
 *
 * `name` says whose pop-up it is, and becomes its hook: `data-template-dialog` or
 * `data-checkout-dialog`, beside `data-page-dialog`, which every one carries. `labelledBy` is the
 * id of the heading that names it, in `bar` or in `children`. `bar` is what stands in the bar
 * before Close (the checkout's title and its steps); without it the bar holds Close alone, at its
 * end. `fill` makes it the whole window below 40em and gives it one height from there up, for a
 * pop-up whose content changes while it is open and should not change its size with it.
 */
export function PageDialog({
  name,
  closeHref,
  labelledBy,
  bar,
  fill = false,
  children,
}: {
  name: "template" | "checkout";
  closeHref: string;
  labelledBy: string;
  bar?: ReactNode;
  fill?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // True while the dialog is being closed by this component on its way out: no address to leave.
  const leaving = useRef(false);
  // Where the press and the release of the click in progress landed.
  const [scrim] = useState(createScrimPress);
  // False while the server's page is being taken over, true for a dialog a navigation brought.
  const arrived = useRef(
    useSyncExternalStore(
      never,
      () => true,
      () => false,
    ),
  );

  useBeforePaint(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (!dialog.matches(":modal")) {
      // Open as the server sent it, but not modal: shut without an event, then opened properly.
      dialog.open = false;
      if (arrived.current) dialog.setAttribute("data-enter", "");
      dialog.showModal();
    }

    return () => {
      if (dialog.open) {
        leaving.current = true;
        dialog.close();
      }
      if (opener && opener !== document.body) opener.focus({ preventScroll: true });
    };
  }, []);

  const onClose = () => {
    if (leaving.current) {
      leaving.current = false;
      return;
    }
    // A dialog a link inside the site opened over this very address was a push, so closing it is
    // going back: nothing is left behind for Back to land on twice. Anywhere else (a direct load,
    // a link from another page, a browser without the Navigation API) the entry before it is not
    // this page, so the close replaces the current entry.
    const here =
      arrived.current &&
      previousEntryIs(
        (window as WindowWithNavigation).navigation,
        closeHref,
        window.location.origin,
      );
    if (here) router.back();
    else router.replace(closeHref, { scroll: false });
  };

  // The dimmed page is the dialog's own backdrop: a click there has the dialog as its target. A
  // selection dragged from the panel onto it also ends there, so the press must have been there too.
  const pressOnScrim = (event: PointerEvent<HTMLDialogElement>) =>
    scrim.press(event.target === event.currentTarget);
  const releaseOnScrim = (event: PointerEvent<HTMLDialogElement>) =>
    scrim.release(event.target === event.currentTarget);
  const closeFromScrim = (event: MouseEvent<HTMLDialogElement>) => {
    if (scrim.click(event.target === event.currentTarget)) event.currentTarget.close();
  };

  // With the script running, Close shuts the dialog and the `close` event does the rest.
  const closeFromLink = (event: MouseEvent<HTMLElement>) => {
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    event.preventDefault();
    dialog.close();
  };

  return (
    <dialog
      ref={dialogRef}
      open
      aria-labelledby={labelledBy}
      data-page-dialog=""
      {...{ [`data-${name}-dialog`]: "" }}
      className={cx(styles.dialog, fill && styles.fill)}
      onClose={onClose}
      onPointerDown={pressOnScrim}
      onPointerUp={releaseOnScrim}
      onClick={closeFromScrim}
    >
      {/* The panel covers the whole dialog, so only the dimmed page counts as "outside". */}
      <div className={styles.panel}>
        <div className={styles.bar}>
          {bar}
          <Button
            variant="outline"
            size="sm"
            href={closeHref}
            onClick={closeFromLink}
            className={styles.close}
          >
            <Icon name="close" />
            Close
          </Button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  );
}
