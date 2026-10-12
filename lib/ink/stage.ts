import type { SceneName } from "./types";

/**
 * What the ink layer needs to know about each scene before the engine has loaded, and the rule by
 * which it picks the one backdrop that gets the canvas. Small and pure: this is first-load code.
 */

export type Ground = "paper" | "binder";

export type Stage = {
  /** How much the scene matters when two backdrops are on screen. */
  weight: number;
  /** How long the scene runs by itself before the water comes to rest, in milliseconds. */
  runMs: number;
  ground: Ground;
  /** A trigger the scene waits for: the loop starts when the layer fires it. */
  trigger?: string;
};

export const STAGES: Record<SceneName, Stage> = {
  intro: { weight: 9, runMs: 3500, ground: "paper" },
  prompt: { weight: 3, runMs: 30000, ground: "paper" },
  title: { weight: 2, runMs: 14000, ground: "paper" },
  ninety: { weight: 3, runMs: 12000, ground: "binder", trigger: "tenth" },
  bloom: { weight: 2, runMs: 24000, ground: "paper" },
  wisps: { weight: 1, runMs: 20000, ground: "binder" },
  spill: { weight: 3, runMs: 24000, ground: "paper" },
};

/** A window that opens after an input, once the first one has closed. */
export const WAKE_MS = 12000;

/** How long the water takes to come to rest, in seconds. */
export const REST_SECONDS = 2.5;

export function isScene(value: unknown): value is SceneName {
  return typeof value === "string" && Object.hasOwn(STAGES, value);
}

/** A backdrop as the choice sees it. */
export type Candidate<T = unknown> = {
  /** Whatever identifies the backdrop to the caller. */
  id: T;
  scene: SceneName;
  /** The backdrop's top edge in the viewport, in pixels. */
  top: number;
  /** Its whole area and the part of it inside the viewport, in square pixels. */
  area: number;
  visible: number;
};

/** The share of a backdrop that must be in view for the topmost one to win outright. */
export const TOPMOST_SHARE = 0.4;

/** A backdrop with this share of itself in view is in view whole. */
export const WHOLE_SHARE = 0.95;

/** A challenger takes the canvas only if it scores this much more than the holder. */
export const CHALLENGE = 1.25;

const score = (candidate: Candidate) => candidate.visible * STAGES[candidate.scene].weight;

/**
 * Which backdrop gets the canvas. Among those on screen the topmost wins if at least 40% of it is
 * in view, except that a backdrop in view whole beats a topmost one that is only partly there (at
 * the foot of a page the footer is what is being looked at, not the tail of the band above it);
 * otherwise the largest visible area times weight wins, and the current holder keeps the canvas
 * unless a challenger beats it by a quarter.
 */
export function chooseStage<T>(candidates: readonly Candidate<T>[], holder?: T | null): T | null {
  const shown = candidates.filter((candidate) => candidate.visible > 0 && candidate.area > 0);
  if (!shown.length) return null;

  const higher = (a: Candidate<T>, b: Candidate<T>) => (b.top < a.top ? b : a);
  const topmost = shown.reduce(higher);
  const topShare = topmost.visible / topmost.area;
  if (topShare >= TOPMOST_SHARE) {
    if (topShare < WHOLE_SHARE) {
      const whole = shown.filter(
        (candidate) => candidate !== topmost && candidate.visible / candidate.area >= WHOLE_SHARE,
      );
      if (whole.length) return whole.reduce(higher).id;
    }
    return topmost.id;
  }

  const best = shown.reduce((a, b) => (score(b) > score(a) ? b : a));
  const held = shown.find((candidate) => candidate.id === holder);
  if (held && held !== best && score(best) < score(held) * CHALLENGE) return held.id;
  return best.id;
}

/** The area of a rectangle that lies inside a viewport of the given size. */
export function visibleArea(
  rect: { left: number; top: number; right: number; bottom: number },
  viewport: { width: number; height: number },
): number {
  const width = Math.min(rect.right, viewport.width) - Math.max(rect.left, 0);
  const height = Math.min(rect.bottom, viewport.height) - Math.max(rect.top, 0);
  return width > 0 && height > 0 ? width * height : 0;
}

/**
 * How far a band has travelled through the viewport: 0 as its top edge meets the bottom of the
 * window, 1 as its bottom edge leaves the top. The same measure as a view timeline's cover range.
 */
export function coverProgress(
  rect: { top: number; height: number },
  viewportHeight: number,
): number {
  return (viewportHeight - rect.top) / (viewportHeight + rect.height);
}

/** The band's progress at which the tenth block has turned, and the one under which it re-arms. */
export const NINETY_FIRE = 0.47;
export const NINETY_REARM = 0.2;
