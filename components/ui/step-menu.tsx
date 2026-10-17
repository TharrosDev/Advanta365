"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { TransitionLink } from "@/components/ui/transition-link";
import { phaseHref } from "@/lib/catalog/search-params";
import { cx } from "@/lib/cx";
import styles from "./step-menu.module.css";

type MenuPhase = { slug: string; name: string; number?: number };

/**
 * "Jump to a phase": the toolkit's sections as a drop-down, where a strip of tabs does not fit. A
 * native disclosure (`<details>`) whose panel is a list of links to `/phases/{slug}`, each a numeral
 * tile and the plain name, Start here first and Used at every step last, neither numbered. It
 * works without script; with it, the panel also closes on Escape (handing focus back to the
 * button), on a click outside it, on a link inside it and on any change of page.
 *
 * The button names the section being shown (`current`), or says "Jump to a phase" when there is
 * none; with `label` it always says that instead ("Roadmap" in the bar). `currentKind` is the
 * `aria-current` the section's link carries. `variant="bar"` draws the button as a link of the
 * bar's row, the word and its chevron with no box, and drops the panel centred under it.
 */
export function StepMenu({
  phases,
  current,
  currentKind = "page",
  label,
  variant = "field",
  className,
  buttonClassName,
}: {
  phases: ReadonlyArray<MenuPhase>;
  current?: string;
  currentKind?: "page" | "true";
  label?: string;
  variant?: "field" | "bar";
  className?: string;
  buttonClassName?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const shown = phases.find((phase) => phase.slug === current);

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname, current]);

  useEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const onPointer = (event: PointerEvent) => {
      if (menu.open && !menu.contains(event.target as Node)) menu.open = false;
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !menu.open) return;
      menu.open = false;
      menu.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    menu.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      menu.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} data-step-menu="" className={cx(styles.root, styles[variant], className)}>
      <summary className={cx("type-ui", styles.button, buttonClassName)}>
        <span className={styles.words}>
          {label ? (
            label
          ) : shown ? (
            <>
              <span className="visually-hidden">Jump to a phase, now on </span>
              {shown.number === undefined ? null : (
                <span className={styles.buttonNumeral}>Phase {shown.number}</span>
              )}
              <span className={styles.buttonName}>{shown.name}</span>
            </>
          ) : (
            "Jump to a phase"
          )}
        </span>
        <Icon name="chevron" className={styles.chevron} />
      </summary>
      <nav aria-label="Toolkit phases" className={styles.panel}>
        <ul className={styles.list}>
          {phases.map((phase) => (
            <li key={phase.slug} className={cx(phase.number === undefined && styles.apart)}>
              <TransitionLink
                href={phaseHref(phase.slug)}
                className={cx("type-ui", styles.link)}
                aria-current={phase.slug === current ? currentKind : undefined}
                onClick={() => {
                  if (ref.current) ref.current.open = false;
                }}
              >
                <span className={styles.numeral} aria-hidden="true">
                  {phase.number}
                </span>
                {phase.name}
              </TransitionLink>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
