"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";
import {
  PRIMARY_LINKS,
  currentPhase,
  linkCurrent,
  type PhaseLink,
  type TemplatePhases,
} from "@/components/layout/nav-links";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Icon } from "@/components/ui/icon";
import { TextLink } from "@/components/ui/text-link";
import { TransitionLink } from "@/components/ui/transition-link";
import { cssVars, cx } from "@/lib/cx";
import styles from "./nav-drawer.module.css";

/** From this width the bar shows its links inline and the drawer has no button. */
const INLINE_NAV = "(min-width: 68em)";

/**
 * The site menu below 68em: the "Menu" button of the bar and the panel it opens.
 *
 * The panel is a native modal `<dialog>` on the right edge of the screen, with the page dimmed
 * behind it. Top to bottom: the brand and its own Close button, the five primary links, the seven
 * phases under a visible label, and the contact address at the foot. The dialog itself keeps focus
 * inside, closes on Escape and hands focus back to the button.
 *
 * It enters in 320ms and its links drift in one after another, 40ms apart (the CSS module owns both).
 * It closes on Close, Escape, a click on the dimmed page, any link inside it and any change of
 * page. Closing is instant. `open` only mirrors the dialog for `aria-expanded`; the dialog's own
 * `close` event is what clears it, so every way of closing is covered by one handler.
 */
export function NavDrawer({
  phases,
  templatePhases,
  email,
  toggleClassName,
  wordClassName,
}: {
  phases: readonly PhaseLink[];
  templatePhases: TemplatePhases;
  email: string;
  /** Lands on the "Menu" button; the bar hides it from 68em. */
  toggleClassName?: string;
  /** Lands on the word "Menu"; the bar hides it visually on the narrowest screens. */
  wordClassName?: string;
}) {
  const pathname = usePathname();
  const panelId = useId();
  const phasesLabelId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const openedOn = useRef(pathname);
  const phase = currentPhase(pathname, templatePhases);

  const show = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    openedOn.current = pathname;
    dialog.showModal();
    setOpen(true);
  };

  const close = () => dialogRef.current?.close();

  // The dimmed page is the dialog's own backdrop: a click there has the dialog as its target.
  const closeFromScrim = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) close();
  };

  // A change of page that did not start from a link in the panel (the Back button) closes it too.
  // This effect can run a moment after the new page is on screen (a page change is a view
  // transition), so a menu that was opened on the new page already is left alone.
  useEffect(() => {
    if (openedOn.current !== pathname) dialogRef.current?.close();
  }, [pathname]);

  // A window that grows to the inline navigation loses the button, so the panel goes with it.
  useEffect(() => {
    const inline = window.matchMedia(INLINE_NAV);
    const onChange = () => {
      if (inline.matches) dialogRef.current?.close();
    };
    inline.addEventListener("change", onChange);
    return () => inline.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={toggleClassName}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={show}
      >
        <Icon name="bars" />
        <span className={wordClassName}>Menu</span>
      </Button>
      <dialog
        ref={dialogRef}
        id={panelId}
        aria-label="Site menu"
        data-nav-drawer=""
        className={styles.drawer}
        onClose={() => setOpen(false)}
        onClick={closeFromScrim}
      >
        {/* The panel covers the whole dialog, so only the dimmed page counts as "outside". */}
        <div className={styles.panel}>
          <div className={styles.top}>
            <BrandLockup size="sm" nameClassName={styles.brandName} />
            <Button variant="outline" size="sm" onClick={close}>
              <Icon name="close" />
              Close
            </Button>
          </div>
          <nav aria-label="Menu" className={styles.nav}>
            <ul className={styles.list}>
              {PRIMARY_LINKS.map((link, index) => (
                <li key={link.href} className={styles.item} style={cssVars({ "--order": index })}>
                  <TransitionLink
                    href={link.href}
                    className={cx("type-ui", styles.row, styles.primary)}
                    aria-current={linkCurrent(pathname, link.href)}
                    onClick={close}
                  >
                    {link.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
            <div className={styles.group}>
              <Eyebrow id={phasesLabelId} className={styles.label}>
                Rollout phases
              </Eyebrow>
              <ul aria-labelledby={phasesLabelId} className={styles.list}>
                {phases.map((item, index) => (
                  <li
                    key={item.slug}
                    className={styles.item}
                    style={cssVars({ "--order": PRIMARY_LINKS.length + index })}
                  >
                    <TransitionLink
                      href={`/phases/${item.slug}`}
                      className={cx("type-ui", styles.row, styles.phase)}
                      aria-current={phase?.slug === item.slug ? phase.kind : undefined}
                      onClick={close}
                    >
                      <span className={styles.numeral} aria-hidden="true">
                        {index + 1}
                      </span>
                      {item.name}
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
          <p
            className={cx("type-ui", styles.contact, styles.item)}
            style={cssVars({ "--order": PRIMARY_LINKS.length + phases.length })}
          >
            <TextLink href={`mailto:${email}`} className={styles.email} onClick={close}>
              {email}
            </TextLink>
          </p>
        </div>
      </dialog>
    </>
  );
}
