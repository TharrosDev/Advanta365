"use client";

import { useEffect, useLayoutEffect } from "react";

// The server has no layout to measure; there the effect is the ordinary one and never runs.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The ink runs: the boot script or the layer says `live`, and the visitor has not paused it. */
const inkRuns = (root: Element) =>
  root.getAttribute("data-ink") === "live" && !root.hasAttribute("data-ink-paused");

/**
 * The script half of the hero's sequence (app/motion.css is the other). It renders nothing. The
 * sequence belongs to the prompt ink scene, and CSS can tell that the ink is live but not that it
 * has just become so: ink that a visitor starts on a page whose documents already stand would set
 * the sequence going late, and take the documents away for the 3.7 seconds before they land. So
 * the stage carries a mark, `data-landed`, that ends the sequence for as long as the stage is in
 * the page.
 *
 * Before the first paint of every mount (a load, or a return to the home page inside the site) it
 * looks at the root element. Ink that is not running then (`data-ink` is `still` or `paused`, or
 * the visitor paused it on another page) gets the mark at once. Ink that is running is watched, and
 * the first time it stops (the engine fails, or the visitor pauses it) the mark is set and the
 * documents are in place from that moment. The mark is never taken off: once the documents stand
 * they stay, whatever the ink does next. A new mount starts without it, so a return to the home
 * page with running ink plays the sequence with the scene again.
 *
 * Without a script the mark is never set and nothing needs it: the sequence asks for
 * `data-motion="on"` and `data-ink="live"`, which only the boot script writes.
 */
export function HeroLanding() {
  useBeforePaint(() => {
    const root = document.documentElement;
    const stage = document.querySelector("[data-hero-stage]");
    if (!stage) return;
    if (!inkRuns(root)) {
      stage.setAttribute("data-landed", "");
      return;
    }
    const watch = new MutationObserver(() => {
      if (inkRuns(root)) return;
      stage.setAttribute("data-landed", "");
      watch.disconnect();
    });
    watch.observe(root, { attributes: true, attributeFilter: ["data-ink", "data-ink-paused"] });
    return () => watch.disconnect();
  }, []);

  return null;
}
