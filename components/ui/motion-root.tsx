"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";
import { MOVED, WATCHED, watchSeen } from "@/lib/scroll/observe";
import { trackLight } from "@/lib/scroll/pointer";

// The server has no layout to measure; there the effect is the ordinary one and never runs.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The script half of the motion system (app/motion.css is the other). It renders nothing and
 * does nothing unless the boot script has set `data-motion="on"` on the root element, so under
 * reduced motion it is inert.
 *
 * On mount and on every change of pathname, before the browser paints, it marks what is already
 * in view as `data-seen` and only then sets `data-io="armed"` on the root element. The hidden
 * starting states of the observer path need that attribute, so nothing in view ever flashes and
 * a script that never runs hides nothing. Where view timelines exist CSS moves the entrances by
 * itself and the observer only serves `[data-watch]` (a tally that fills when it is seen); where
 * they are missing it serves `[data-move]` and `[data-ninety]` as well.
 *
 * It also owns the light on `[data-lit]` sheets (lib/scroll/pointer.ts).
 */
export function MotionRoot() {
  const pathname = usePathname();

  useBeforePaint(() => {
    const root = document.documentElement;
    if (root.getAttribute("data-motion") !== "on") return;
    const selector = root.getAttribute("data-timeline") === "on" ? WATCHED : `${WATCHED}, ${MOVED}`;
    // Disarmed while the new page is measured: nothing is in its starting state then, so marking
    // what is in view starts no transition.
    root.removeAttribute("data-io");
    const stop = watchSeen(selector);
    root.setAttribute("data-io", "armed");
    return stop;
  }, [pathname]);

  useEffect(() => {
    if (document.documentElement.getAttribute("data-motion") !== "on") return;
    return trackLight();
  }, []);

  return null;
}
