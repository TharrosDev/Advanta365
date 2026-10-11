"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { FocusEvent, RefObject } from "react";
import type { NavLink } from "@/components/layout/nav-links";
import { Reveal } from "@/components/motion/reveal";
import { TransitionLink } from "@/components/motion/transition-link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { WipeLabel } from "@/components/ui/wipe-label";
import { WipeLink } from "@/components/ui/wipe-link";
import { WipeRule } from "@/components/ui/wipe-rule";
import { cssVars, cx } from "@/lib/cx";
import { durations } from "@/lib/motion/durations";
import { setThemeRequest } from "@/lib/motion/theme";
import styles from "./menu.module.css";

export type MenuLink = NavLink;
export type MenuProps = {
  primary: readonly MenuLink[];
  secondary: readonly MenuLink[];
  contact: { email: string; caption: string };
};

/** The curtain's duration, opening and closing. The overlay unmounts this long after a close starts. */
const OVERLAY_MS = durations.slower;
/** Where the "Close" text sits with no shift: 16px panel padding + 16px button padding. */
const CLOSE_TEXT_TOP = 16 + 16;
/** How far above that "Close" may follow a "Menu" that has scrolled toward the top edge. */
const CLOSE_MAX_RISE = 16;
/** The panel's side padding, which the "Close" text is inset by on phones. */
const PANEL_GUTTER = 16;

const FOCUSABLE = "a[href], button:not([disabled])";

const OVERLAY_STYLE = cssVars({ "--overlay-duration": `${OVERLAY_MS}ms` });

function matchesFocusVisible(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

/**
 * Which rows of a ruled list are active. A row is active while the pointer is on it or while it holds
 * keyboard focus; an active row n lights rule n (above it) and rule n + 1 (below it).
 */
function useActiveRows() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);

  const lights = (row: number | null, rule: number) =>
    row !== null && (rule === row || rule === row + 1);

  return {
    isActive: (rule: number) => lights(hovered, rule) || lights(focused, rule),
    handlers: (row: number) => ({
      onMouseEnter: () => setHovered(row),
      onMouseLeave: () => setHovered((current) => (current === row ? null : current)),
      onFocus: (event: FocusEvent<HTMLElement>) => {
        if (matchesFocusVisible(event.target)) setFocused(row);
      },
      onBlur: () => setFocused((current) => (current === row ? null : current)),
    }),
  };
}

/**
 * The open menu: an invisible backdrop that closes it, and the curtain panel with the three lists.
 * Mounted while the menu is open and for the 500ms of the closing curtain, so its hover state and its
 * entrance animations start fresh every time.
 */
function MenuOverlay({
  id,
  open,
  closing,
  anchorRef,
  current,
  primary,
  secondary,
  contact,
  onClose,
}: MenuProps & {
  id: string;
  open: boolean;
  closing: boolean;
  /** The "Menu" text in the header: "Close" is laid over it. */
  anchorRef: RefObject<HTMLElement | null>;
  current: string;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const primaryRows = useActiveRows();
  const contactRows = useActiveRows();

  // "Close" lands where "Menu" is. Both are measured against the overlay's own box (not the window,
  // whose width includes a reserved scrollbar gutter), before the first paint and on every resize.
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const label = anchorRef.current;
    if (!overlay || !label) return;

    const place = () => {
      const box = overlay.getBoundingClientRect();
      const text = label.getBoundingClientRect();
      const shift = Math.max(-CLOSE_MAX_RISE, text.top - box.top - CLOSE_TEXT_TOP);
      const inset = Math.max(0, box.right - text.right - PANEL_GUTTER);
      overlay.style.setProperty("--menu-shift", `${shift}px`);
      overlay.style.setProperty("--menu-close-inset", `${inset}px`);
    };

    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [anchorRef]);

  // The page behind does not scroll while the overlay is up, the closing curtain included.
  useEffect(() => {
    const { style } = document.body;
    const previous = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = previous;
    };
  }, []);

  // Open: the page turns dark, focus moves into the panel and stays there, Escape closes. All of it
  // is released the moment a close starts (or the overlay unmounts), not when the curtain has gone.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    setThemeRequest("menu", true);
    panel?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const stops = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (!first || !last) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const active = document.activeElement;
      const outside = !active || !panel.contains(active);
      if (event.shiftKey) {
        if (outside || active === first || active === panel) {
          event.preventDefault();
          last.focus();
        }
      } else if (outside || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      setThemeRequest("menu", false);
    };
  }, [open, onClose]);

  const contactIndex = primary.length + secondary.length;

  return (
    <div
      ref={overlayRef}
      className={cx(styles.overlay, closing && styles.overlayClosing)}
      style={OVERLAY_STYLE}
    >
      <button
        type="button"
        className={styles.backdrop}
        data-menu-backdrop=""
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
      />
      <div className={cx(styles.panelClip, closing && styles.panelClosing)}>
        <div
          id={id}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          tabIndex={-1}
          className={styles.panel}
        >
          <div className={styles.panelInner}>
            <button type="button" className={styles.close} onClick={onClose}>
              <WipeLabel hiding={closing}>Close</WipeLabel>
            </button>
            <nav aria-label="Menu" className={styles.panelBody}>
              <ul className={styles.primary}>
                {primary.map((link, row) => (
                  <Reveal
                    key={link.href}
                    as="li"
                    effect="fade-up"
                    step="fine"
                    index={row}
                    className={styles.staggerItem}
                    {...primaryRows.handlers(row)}
                  >
                    <WipeRule active={primaryRows.isActive(row)} />
                    <TransitionLink
                      href={link.href}
                      className={cx(styles.primaryLink, "t-headline-large")}
                      aria-current={current === link.href ? "page" : undefined}
                      onClick={onClose}
                    >
                      {link.label}
                    </TransitionLink>
                    {row === primary.length - 1 && (
                      <WipeRule active={primaryRows.isActive(row + 1)} />
                    )}
                  </Reveal>
                ))}
              </ul>
              <ul className={styles.secondary}>
                {secondary.map((link, row) => (
                  <Reveal
                    key={link.href}
                    as="li"
                    effect="fade-up"
                    step="fine"
                    index={primary.length + row}
                    className={styles.staggerItem}
                  >
                    <WipeLink
                      href={link.href}
                      variant="underline"
                      aria-current={current === link.href ? "page" : undefined}
                      onClick={onClose}
                    >
                      {link.label}
                    </WipeLink>
                  </Reveal>
                ))}
              </ul>
              <ul className={styles.contacts}>
                <Reveal
                  as="li"
                  effect="fade-up"
                  step="fine"
                  index={contactIndex}
                  className={styles.staggerItem}
                  {...contactRows.handlers(0)}
                >
                  <WipeRule active={contactRows.isActive(0)} />
                  <a className={styles.contact} href={`mailto:${contact.email}`} onClick={onClose}>
                    <span className={styles.contactText}>
                      <span className="t-body-large">{contact.email}</span>
                      <span className="t-label-medium c-fg-50">{contact.caption}</span>
                    </span>
                    <ArrowIcon />
                  </a>
                  <WipeRule active={contactRows.isActive(1)} />
                </Reveal>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The "Menu" button and the curtain menu it opens, on every viewport.
 *
 * Opening turns the page dark and drops a panel from the top edge whose "Close" label lands exactly
 * on the "Menu" text. The menu closes on Close, Escape, a click outside the panel, any link in it and
 * any route change; focus is kept inside while it is open and returns to the button when it closes.
 *
 * State: `openAt` is the pathname the menu was opened on, so a route change that did not go through
 * `close()` (browser Back) closes it by derivation. `closing` covers the 500ms of the closing curtain.
 */
export function Menu({ primary, secondary, contact }: MenuProps) {
  const pathname = usePathname();
  const id = useId();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef({ id: 0 });

  // The page changed under an open menu without a close(): drop it at once (previous value in
  // state, so no effect is needed and no stale `openAt` survives).
  if (openAt !== null && openAt !== pathname && !closing) setOpenAt(null);

  const here = openAt !== null && openAt === pathname;
  const open = here && !closing;
  const shown = here || closing;

  /** Starts the closing curtain. Does nothing while one is already running. */
  const close = useCallback(() => {
    const timer = closeTimer.current;
    if (timer.id !== 0) return;
    setClosing(true);
    timer.id = window.setTimeout(() => {
      timer.id = 0;
      setOpenAt(null);
      setClosing(false);
    }, OVERLAY_MS);
    toggleRef.current?.focus();
  }, []);

  const handleToggle = () => {
    if (open) {
      close();
      return;
    }
    // Also reached while a closing curtain is still running: cancel it and open again.
    const timer = closeTimer.current;
    window.clearTimeout(timer.id);
    timer.id = 0;
    setClosing(false);
    setOpenAt(pathname);
  };

  useEffect(() => {
    const timer = closeTimer.current;
    return () => {
      window.clearTimeout(timer.id);
      timer.id = 0;
    };
  }, []);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className={styles.toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={handleToggle}
      >
        <span ref={labelRef} className={styles.toggleLabel} data-menu-label="">
          Menu
        </span>
      </button>
      {shown && (
        <MenuOverlay
          id={id}
          open={open}
          closing={closing}
          anchorRef={labelRef}
          current={pathname}
          primary={primary}
          secondary={secondary}
          contact={contact}
          onClose={close}
        />
      )}
    </>
  );
}
