import { CHROME_SYMBOL_INTRO, type ChromeSymbolParams } from "./constants";
import { cubicBezier } from "./cubic-bezier";

export type IntroTimeline = {
  /** Parameters to draw with, `seconds` after the symbol's first rendered frame. */
  sample(seconds: number): ChromeSymbolParams;
  /** Asks the symbol to stop spinning and settle facing front. Only the first call counts. */
  land(seconds: number): void;
  isFinished(): boolean;
};

const PARAM_KEYS = Object.keys({
  depth: 0,
  bevel: 0,
  roughness: 0,
  yaw: 0,
  pitch: 0,
  sway: 0,
  speed: 0,
  fit: 0,
  parallax: 0,
  exposure: 0,
  keyAzimuth: 0,
  keyElevation: 0,
  fillAzimuth: 0,
  fillElevation: 0,
  tintR: 0,
  tintG: 0,
  tintB: 0,
} satisfies ChromeSymbolParams) as Array<keyof ChromeSymbolParams>;

/** A turn closer than this to a whole revolution is treated as "already there" and gets one more. */
const MIN_REMAINING_TURN = 0.001;

/**
 * The intro state machine of the chrome symbol.
 *
 * Time is measured from the first rendered frame. After `initialDelay`:
 *   1. grow  (0 .. 0.8s)    edge-on (yaw -90), depth swells from 0: a bar that thickens;
 *   2. turn  (0.8 .. 2.3s)  every parameter blends from the intro look to the resting look;
 *   3. then either done (no spin, or landing was requested during 1-2), or spin at one
 *      revolution per `spinPeriod` until `land()`, which carries the current turn on to the next
 *      whole revolution with an ease that starts at spin speed and ends at rest.
 *
 * `getParams` returns the resting parameters and is read on every call, so changes made while
 * the intro runs are picked up. `onLanded` fires exactly once, when the timeline finishes.
 */
export function createIntroTimeline(
  getParams: () => ChromeSymbolParams,
  options: { spin?: boolean; onLanded?: () => void } = {},
): IntroTimeline {
  const { from, initialDelay, depthDuration, blendDuration, spinPeriod, landMinDuration } =
    CHROME_SYMBOL_INTRO;
  const spin = options.spin === true;
  const depthEase = cubicBezier(...CHROME_SYMBOL_INTRO.depthEase);
  const blendEase = cubicBezier(...CHROME_SYMBOL_INTRO.blendEase);
  const introDuration = depthDuration + blendDuration;
  const spinSpeed = 360 / spinPeriod;

  let finished = false;
  let landRequested = false;
  let landing: { start: number; duration: number; yawFrom: number; yawTo: number } | null = null;

  const local = (seconds: number) => Math.max(0, seconds - initialDelay);

  function finish(rest: ChromeSymbolParams): ChromeSymbolParams {
    if (!finished) {
      finished = true;
      options.onLanded?.();
    }
    return rest;
  }

  function sample(seconds: number): ChromeSymbolParams {
    const rest = getParams();
    if (finished) return rest;

    const l = local(seconds);
    const start: ChromeSymbolParams = { ...rest, ...from };

    if (l < depthDuration) {
      return { ...start, depth: from.depth * depthEase(l / depthDuration) };
    }

    if (l < introDuration) {
      const k = blendEase((l - depthDuration) / blendDuration);
      const blended = { ...start };
      for (const key of PARAM_KEYS) {
        blended[key] = start[key] + (rest[key] - start[key]) * k;
      }
      return blended;
    }

    if (landing) {
      const d = (l - landing.start) / landing.duration;
      if (d >= 1) return finish(rest);
      // Slope 1 at d = 0 (continues at spin speed), slope 0 at d = 1 (arrives at rest).
      const eased = d + d * d - d * d * d;
      return { ...rest, yaw: landing.yawFrom + (landing.yawTo - landing.yawFrom) * eased };
    }

    if (!spin || landRequested) return finish(rest);

    return { ...rest, yaw: rest.yaw + spinSpeed * (l - introDuration) };
  }

  function land(seconds: number): void {
    if (landRequested || finished) return;
    landRequested = true;

    const l = local(seconds);
    if (!spin || l <= introDuration) return;

    const rest = getParams();
    const yawFrom = rest.yaw + spinSpeed * (l - introDuration);
    let yawTo = rest.yaw + 360 * Math.ceil((yawFrom - rest.yaw) / 360);
    if (yawTo - yawFrom < MIN_REMAINING_TURN) yawTo += 360;
    landing = {
      start: l,
      duration: Math.max(landMinDuration, (yawTo - yawFrom) / spinSpeed),
      yawFrom,
      yawTo,
    };
  }

  return { sample, land, isFinished: () => finished };
}
