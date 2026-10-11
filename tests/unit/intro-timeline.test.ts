import { describe, expect, it, vi } from "vitest";
import {
  CHROME_SYMBOL_DEFAULTS,
  CHROME_SYMBOL_INTRO,
  type ChromeSymbolParams,
} from "@/components/graphics/chrome-symbol/constants";
import { cubicBezier } from "@/components/graphics/chrome-symbol/cubic-bezier";
import { createIntroTimeline } from "@/components/graphics/chrome-symbol/intro-timeline";

const rest = (): ChromeSymbolParams => ({ ...CHROME_SYMBOL_DEFAULTS });

/** Seconds on the timeline's own clock (after the initial delay) -> seconds since the first frame. */
const at = (local: number) => CHROME_SYMBOL_INTRO.initialDelay + local;

/** End of the grow phase and of the whole intro, in seconds since the first frame. */
const GROWN = at(0.8);
const TURNED = at(2.3);

describe("cubicBezier", () => {
  it("is pinned to 0 and 1 outside the unit interval", () => {
    const ease = cubicBezier(0.5, 0, 0, 1);
    expect(ease(-1)).toBe(0);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(2)).toBe(1);
  });

  it("is the identity for a linear curve", () => {
    const linear = cubicBezier(0, 0, 1, 1);
    for (const x of [0.1, 0.25, 0.5, 0.75, 0.9]) expect(linear(x)).toBeCloseTo(x, 5);
  });

  it("matches the CSS ease curve", () => {
    // cubic-bezier(0.25, 0.1, 0.25, 1) at half time.
    expect(cubicBezier(0.25, 0.1, 0.25, 1)(0.5)).toBeCloseTo(0.8024, 3);
  });

  it("solves the two intro curves, including their flat starts", () => {
    const depthEase = cubicBezier(...CHROME_SYMBOL_INTRO.depthEase);
    const blendEase = cubicBezier(...CHROME_SYMBOL_INTRO.blendEase);
    for (const ease of [depthEase, blendEase]) {
      let previous = 0;
      for (let i = 1; i <= 100; i += 1) {
        const value = ease(i / 100);
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(previous - 1e-6);
        expect(value).toBeLessThanOrEqual(1 + 1e-6);
        previous = value;
      }
    }
    // (0, 0, 0, 1): x = s^3, y = 3s^2 - 2s^3. At x = 1/8, s = 1/2 and y = 1/2.
    expect(depthEase(0.125)).toBeCloseTo(0.5, 4);
    expect(depthEase(1e-9)).toBeGreaterThanOrEqual(0);
  });
});

describe("constants", () => {
  it("keeps the reference timings", () => {
    expect(CHROME_SYMBOL_INTRO.from).toEqual({
      depth: 0.112,
      bevel: 0.044,
      roughness: 0.43,
      yaw: -90,
    });
    expect(CHROME_SYMBOL_INTRO.initialDelay).toBe(0.12);
    expect(CHROME_SYMBOL_INTRO.depthDuration).toBe(0.8);
    expect(CHROME_SYMBOL_INTRO.blendDuration).toBe(1.5);
    expect(CHROME_SYMBOL_INTRO.spinPeriod).toBe(2);
    expect(CHROME_SYMBOL_INTRO.landMinDuration).toBe(0.6);
    expect(CHROME_SYMBOL_DEFAULTS.fit).toBe(1.125);
    expect(CHROME_SYMBOL_DEFAULTS.exposure).toBe(1.05);
    expect(TURNED).toBeCloseTo(2.42, 10);
  });
});

describe("createIntroTimeline", () => {
  it("draws nothing during the initial delay", () => {
    const timeline = createIntroTimeline(rest);
    for (const t of [0, 0.05, 0.12]) {
      const sample = timeline.sample(t);
      expect(sample.depth).toBe(0);
      expect(sample.yaw).toBe(-90);
    }
    expect(timeline.isFinished()).toBe(false);
  });

  it("grows edge-on: yaw stays -90 until 0.92s while depth swells to the intro depth", () => {
    const timeline = createIntroTimeline(rest);
    let previous = 0;
    for (let t = 0.13; t < GROWN - 1e-9; t += 0.01) {
      const sample = timeline.sample(t);
      expect(sample.yaw).toBe(-90);
      expect(sample.bevel).toBe(CHROME_SYMBOL_INTRO.from.bevel);
      expect(sample.roughness).toBe(CHROME_SYMBOL_INTRO.from.roughness);
      expect(sample.depth).toBeGreaterThan(previous);
      expect(sample.depth).toBeLessThanOrEqual(CHROME_SYMBOL_INTRO.from.depth);
      previous = sample.depth;
    }
    expect(timeline.sample(GROWN - 1e-6).depth).toBeCloseTo(CHROME_SYMBOL_INTRO.from.depth, 5);
    // Parameters the intro does not touch are the resting ones throughout.
    expect(timeline.sample(0.5).fit).toBe(CHROME_SYMBOL_DEFAULTS.fit);
    expect(timeline.sample(0.5).exposure).toBe(CHROME_SYMBOL_DEFAULTS.exposure);
  });

  it("turns to the resting look between 0.92s and 2.42s", () => {
    const timeline = createIntroTimeline(rest);
    const start = timeline.sample(GROWN);
    expect(start.yaw).toBeCloseTo(-90, 6);
    expect(start.depth).toBeCloseTo(0.112, 6);

    const middle = timeline.sample((GROWN + TURNED) / 2);
    expect(middle.yaw).toBeGreaterThan(-90);
    expect(middle.yaw).toBeLessThan(0);
    expect(middle.depth).toBeLessThan(0.112);
    expect(middle.depth).toBeGreaterThan(CHROME_SYMBOL_DEFAULTS.depth);

    const end = timeline.sample(TURNED - 1e-6);
    expect(end.yaw).toBeCloseTo(0, 3);
    expect(end.depth).toBeCloseTo(CHROME_SYMBOL_DEFAULTS.depth, 5);
    expect(end.bevel).toBeCloseTo(CHROME_SYMBOL_DEFAULTS.bevel, 5);
    expect(end.roughness).toBeCloseTo(CHROME_SYMBOL_DEFAULTS.roughness, 5);
    expect(timeline.isFinished()).toBe(false);
  });

  it("without spin: rests at 2.42s and reports landed exactly once", () => {
    const onLanded = vi.fn();
    const timeline = createIntroTimeline(rest, { onLanded });
    timeline.sample(2.41);
    expect(onLanded).not.toHaveBeenCalled();

    expect(timeline.sample(TURNED + 1e-9)).toEqual(CHROME_SYMBOL_DEFAULTS);
    expect(timeline.isFinished()).toBe(true);
    expect(timeline.sample(3)).toEqual(CHROME_SYMBOL_DEFAULTS);
    timeline.land(3.5);
    timeline.sample(10);
    expect(onLanded).toHaveBeenCalledTimes(1);
  });

  it("with spin: turns at 180 degrees per second after 2.42s until asked to land", () => {
    const onLanded = vi.fn();
    const timeline = createIntroTimeline(rest, { spin: true, onLanded });
    expect(timeline.sample(TURNED + 0.5).yaw).toBeCloseTo(90, 6);
    expect(timeline.sample(TURNED + 1).yaw).toBeCloseTo(180, 6);
    expect(timeline.sample(TURNED + 2).yaw).toBeCloseTo(360, 6);
    expect(timeline.sample(TURNED + 7.25).yaw).toBeCloseTo(1305, 6);
    // Only yaw moves while spinning.
    expect({ ...timeline.sample(TURNED + 1), yaw: 0 }).toEqual(CHROME_SYMBOL_DEFAULTS);
    expect(timeline.isFinished()).toBe(false);
    expect(onLanded).not.toHaveBeenCalled();
  });

  it("with spin: a landing requested during the intro suppresses the spin", () => {
    const onLanded = vi.fn();
    const timeline = createIntroTimeline(rest, { spin: true, onLanded });
    timeline.sample(1);
    timeline.land(1);
    expect(timeline.sample(2.4).yaw).toBeLessThan(0);
    expect(onLanded).not.toHaveBeenCalled();
    expect(timeline.sample(TURNED + 1e-9)).toEqual(CHROME_SYMBOL_DEFAULTS);
    expect(timeline.isFinished()).toBe(true);
    expect(onLanded).toHaveBeenCalledTimes(1);
  });

  it("with spin: landing carries on to the next whole turn, at spin speed first", () => {
    const onLanded = vi.fn();
    const timeline = createIntroTimeline(rest, { spin: true, onLanded });
    const landAt = TURNED + 0.5; // 90 degrees into the turn: 270 left = 1.5s at spin speed
    timeline.land(landAt);
    timeline.land(landAt + 0.4); // ignored: the first call wins

    expect(timeline.sample(landAt).yaw).toBeCloseTo(90, 6);
    // Starts at 180 degrees per second...
    expect((timeline.sample(landAt + 0.001).yaw - 90) / 0.001).toBeCloseTo(180, 0);
    // ...never turns back...
    let previous = 90;
    for (let t = landAt + 0.01; t < landAt + 1.5 - 1e-9; t += 0.01) {
      const yaw = timeline.sample(t).yaw;
      expect(yaw).toBeGreaterThan(previous);
      expect(yaw).toBeLessThanOrEqual(360);
      previous = yaw;
    }
    // ...and arrives on a multiple of 360, at rest.
    const last = timeline.sample(landAt + 1.5 - 0.001).yaw;
    expect(last).toBeCloseTo(360, 2);
    expect(last % 360).toBeGreaterThan(359.9);
    expect(timeline.isFinished()).toBe(false);
    expect(onLanded).not.toHaveBeenCalled();

    expect(timeline.sample(landAt + 1.5 + 1e-9)).toEqual(CHROME_SYMBOL_DEFAULTS);
    expect(timeline.isFinished()).toBe(true);
    timeline.sample(landAt + 5);
    expect(onLanded).toHaveBeenCalledTimes(1);
  });

  it("with spin: a landing lasts between 0.6s and 2.0s wherever in the turn it is requested", () => {
    for (const intoTurn of [0.001, 0.25, 0.9, 1.4, 1.75, 1.95, 1.999, 2, 2.6, 3.99]) {
      const landAt = TURNED + intoTurn;
      /** A fresh timeline that was asked to land at `landAt`, sampled `after` seconds later. */
      const landing = (after: number, onLanded?: () => void) => {
        const timeline = createIntroTimeline(rest, { spin: true, onLanded });
        timeline.land(landAt);
        const sample = timeline.sample(landAt + after);
        return { sample, finished: timeline.isFinished() };
      };

      // Bisect for the moment the landing is over.
      let low = 0;
      let high = 3;
      expect(landing(high).finished).toBe(true);
      for (let i = 0; i < 40; i += 1) {
        const middle = (low + high) / 2;
        if (landing(middle).finished) high = middle;
        else low = middle;
      }
      expect(high).toBeGreaterThanOrEqual(0.6 - 1e-6);
      expect(high).toBeLessThanOrEqual(2 + 1e-4);

      // Just before the end the symbol faces front again (a whole number of turns).
      const turns = landing(high - 1e-4).sample.yaw / 360;
      expect(Math.abs(turns - Math.round(turns))).toBeLessThan(1e-3);
      expect(Math.round(turns)).toBeGreaterThanOrEqual(1);

      const onLanded = vi.fn();
      expect(landing(high + 1e-4, onLanded).sample).toEqual(CHROME_SYMBOL_DEFAULTS);
      expect(onLanded).toHaveBeenCalledTimes(1);
    }
  });

  it("reads the resting parameters on every sample", () => {
    const params = rest();
    const timeline = createIntroTimeline(() => params, { spin: true });
    params.exposure = 0.5;
    expect(timeline.sample(0.5).exposure).toBe(0.5);
    params.yaw = 10;
    expect(timeline.sample(TURNED + 1).yaw).toBeCloseTo(190, 6);
  });
});
