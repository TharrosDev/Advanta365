"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";
import { createKeyframeSampler, progressAtStops } from "./interpolate";
import { HOME_SWIRL_KEYFRAMES } from "./keyframes";
import { MetallicSwirl, type MetallicSwirlHandle } from "./metallic-swirl";
import type { SwirlParams } from "./params";

/** Smoothing rate of the morph, per second: it trails the scroll with a time constant of 1/3 s. */
const SMOOTHING = 3;
const MAX_FRAME_SECONDS = 0.1;
const NOMINAL_FRAME_SECONDS = 1 / 60;
const SNAP_DISTANCE = 1e-4;

/**
 * The swirl canvas of a `SwirlBand` plus its scroll driver.
 *
 * Stops, in document space: band top, the vertical centre of every section in `stops`, band bottom.
 * Keyframe `k` is reached exactly when the viewport's centre line is on stop `k`; between two stops the
 * progress is linear, and the swirl follows it with exponential smoothing (it snaps under reduced
 * motion). If an id is missing, or the keyframe count does not match, the driver does nothing and the
 * swirl keeps showing keyframe 0.
 */
export function SwirlBackdrop({
  stops,
  keyframes = HOME_SWIRL_KEYFRAMES,
}: {
  stops: readonly string[];
  keyframes?: readonly SwirlParams[];
}) {
  const swirlRef = useRef<MetallicSwirlHandle>(null);
  // Smoothed progress (fractional keyframe index). Kept across effect re-runs; null until first measured.
  const progressRef = useRef<number | null>(null);
  const reduced = usePrefersReducedMotion();
  // Element ids contain no spaces, so the joined string identifies the list across re-renders.
  const stopIds = stops.join(" ");

  useEffect(() => {
    const swirl = swirlRef.current;
    const ids = stopIds === "" ? [] : stopIds.split(" ");
    if (!swirl || keyframes.length !== ids.length + 2) return;

    const sections: HTMLElement[] = [];
    for (const id of ids) {
      const section = document.getElementById(id);
      if (!section) return;
      sections.push(section);
    }
    const band = (sections[0] ?? document.body).closest<HTMLElement>("[data-swirl-band]");
    const root = band ?? document.querySelector<HTMLElement>("[data-swirl-band]");
    if (!root) return;

    const sample = createKeyframeSampler(keyframes);
    let positions: number[] = [];
    let target = 0;
    let frame = 0;
    let previous: number | null = null;

    const measure = () => {
      const scrollY = window.scrollY;
      const bandTop = root.getBoundingClientRect().top + scrollY;
      positions = [
        bandTop,
        ...sections.map((section) => {
          const rect = section.getBoundingClientRect();
          return rect.top + scrollY + rect.height / 2;
        }),
        bandTop + root.offsetHeight,
      ];
    };

    /** Fractional keyframe index for the viewport's centre line. */
    const readTarget = (): number =>
      progressAtStops(positions, window.scrollY + window.innerHeight / 2);

    const show = (progress: number) => {
      progressRef.current = progress;
      swirl.setParams(sample(progress));
    };

    const step = (now: number) => {
      frame = 0;
      const current = progressRef.current ?? target;
      const seconds =
        previous === null
          ? NOMINAL_FRAME_SECONDS
          : Math.min(Math.max((now - previous) / 1000, 0), MAX_FRAME_SECONDS);
      previous = now;

      const distance = target - current;
      const next =
        Math.abs(distance) < SNAP_DISTANCE
          ? target
          : current + distance * (1 - Math.exp(-seconds * SMOOTHING));
      show(next);
      if (next !== target) frame = requestAnimationFrame(step);
    };

    /** Re-reads the target and either snaps to it or lets the smoothing loop chase it. */
    const follow = () => {
      target = readTarget();
      const current = progressRef.current;
      if (current === target) return;
      if (reduced || current === null) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        show(target);
        return;
      }
      if (!frame) {
        previous = null;
        frame = requestAnimationFrame(step);
      }
    };

    const remeasure = () => {
      measure();
      follow();
    };

    measure();
    target = readTarget();
    // One forced frame at start: on first run the swirl opens on the keyframe for the current scroll
    // position; on a re-run it re-applies where it was and then chases the new target.
    show(progressRef.current ?? target);
    follow();

    window.addEventListener("scroll", follow, { passive: true });
    window.addEventListener("resize", remeasure);
    // The band changes height when its sections reflow; the body changes height when anything above
    // the band moves it. Either way the stops have to be read again.
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(remeasure) : null;
    observer?.observe(root);
    observer?.observe(document.body);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", follow);
      window.removeEventListener("resize", remeasure);
      observer?.disconnect();
    };
  }, [stopIds, keyframes, reduced]);

  // The canvas starts on the first keyframe; the driver takes over as soon as it has measured.
  return <MetallicSwirl ref={swirlRef} params={keyframes[0] ?? HOME_SWIRL_KEYFRAMES[0]} />;
}
