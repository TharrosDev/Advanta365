"use client";

import { useCallback, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, ReactNode } from "react";
import { flushSync } from "react-dom";
import { cx } from "@/lib/cx";
import styles from "./wipe.module.css";

/**
 * The bar engine behind every hover / focus "wipe" on the site.
 *
 * A wipe is one bar that draws in from the left and later leaves to the right. Bars are kept in a list,
 * so a pointer that goes in and out quickly stacks several of them and each finishes its own animation:
 * the new bar chases the old one out instead of a single bar snapping back.
 *
 * The positioned parent of the bars sets the look through three custom properties:
 * `--wipe-bar-height` (default 1px), `--wipe-bar-color` (default the foreground colour) and
 * `--wipe-bar-delay` (default 0s).
 */
export type Wipe = { id: number; exiting: boolean; instant: boolean };

/** Adds a bar. Its id is the highest id in the list plus one, so the list alone decides it. */
export function spawnWipe(wipes: Wipe[], instant = false): Wipe[] {
  let highest = 0;
  for (const wipe of wipes) {
    if (wipe.id > highest) highest = wipe.id;
  }
  return [...wipes, { id: highest + 1, exiting: false, instant }];
}

/** Marks the LAST bar that is not leaving yet as leaving. Returns the same list when there is none. */
export function releaseWipe(wipes: Wipe[]): Wipe[] {
  for (let index = wipes.length - 1; index >= 0; index -= 1) {
    const wipe = wipes[index];
    if (wipe && !wipe.exiting) {
      const next = wipes.slice();
      next[index] = { ...wipe, exiting: true };
      return next;
    }
  }
  return wipes;
}

/** Removes a bar whose exit animation ended. Returns the same list when the id is not in it. */
export function settleWipe(wipes: Wipe[], id: number): Wipe[] {
  const next = wipes.filter((wipe) => wipe.id !== id);
  return next.length === wipes.length ? wipes : next;
}

export function useWipe(): {
  wipes: Wipe[];
  spawn: () => void;
  prefill: () => void;
  release: () => void;
  settle: (id: number) => void;
} {
  const [wipes, setWipes] = useState<Wipe[]>([]);
  const spawn = useCallback(() => setWipes((list) => spawnWipe(list)), []);
  const prefill = useCallback(() => setWipes((list) => spawnWipe(list, true)), []);
  const release = useCallback(() => setWipes((list) => releaseWipe(list)), []);
  const settle = useCallback((id: number) => setWipes((list) => settleWipe(list, id)), []);
  return { wipes, spawn, prefill, release, settle };
}

export function WipeBars({
  wipes,
  settle,
  align = "center",
  children,
}: {
  wipes: Wipe[];
  settle: (id: number) => void;
  align?: "center" | "baseline";
  children?: ReactNode;
}) {
  return (
    <>
      {wipes.map((wipe) => (
        <span
          key={wipe.id}
          aria-hidden="true"
          className={cx(
            styles.bar,
            align === "baseline" ? styles.baseline : styles.center,
            wipe.instant && styles.instant,
            wipe.exiting && styles.exiting,
          )}
          onAnimationEnd={(event) => {
            // Only the bar's own (exit) animation removes it; the fill's enter animation bubbles up
            // with a different target and is ignored.
            if (event.target !== event.currentTarget) return;
            // Committed at once: ids come from the list, so a removal that shared a render with the
            // next spawn would hand the new bar the old bar's id (and with it the old DOM node, which
            // has already played its enter animation).
            flushSync(() => settle(wipe.id));
          }}
        >
          <span className={styles.fill}>{children}</span>
        </span>
      ))}
    </>
  );
}

function matchesFocusVisible(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

export type WipeTriggers = {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: (event: FocusEvent<Element>) => void;
  onBlur: () => void;
  onKeyUp: (event: KeyboardEvent<Element>) => void;
};

/**
 * Pointer and keyboard wiring shared by every wipe consumer in this folder: one bar while the element
 * is hovered OR shows a keyboard focus ring (the same condition as `:hover, :focus-visible` in CSS),
 * released when neither holds any more.
 */
export function useWipeTriggers(spawn: () => void, release: () => void): WipeTriggers {
  const held = useRef({ hover: false, focus: false });

  function set(source: "hover" | "focus", value: boolean) {
    const state = held.current;
    if (state[source] === value) return;
    const wasActive = state.hover || state.focus;
    state[source] = value;
    const isActive = state.hover || state.focus;
    if (isActive && !wasActive) spawn();
    else if (!isActive && wasActive) release();
  }

  return {
    onMouseEnter: () => set("hover", true),
    onMouseLeave: () => set("hover", false),
    onFocus: (event) => {
      if (matchesFocusVisible(event.currentTarget)) set("focus", true);
    },
    onBlur: () => set("focus", false),
    // An element focused with the pointer gets its focus ring on the first key press, with no new
    // focus event: pick that up here.
    onKeyUp: (event) => {
      if (event.target === event.currentTarget && matchesFocusVisible(event.currentTarget)) {
        set("focus", true);
      }
    },
  };
}
