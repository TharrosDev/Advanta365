import { describe, expect, test } from "vitest";
import {
  createKeyframeSampler,
  formatHexColor,
  parseHexColor,
  progressAtStops,
} from "@/components/graphics/metallic-swirl/interpolate";
import { HOME_SWIRL_KEYFRAMES } from "@/components/graphics/metallic-swirl/keyframes";
import {
  INNER_SWIRL_PARAMS,
  METALLIC_SWIRL_DEFAULTS,
  type SwirlParams,
} from "@/components/graphics/metallic-swirl/params";

const COLOR_KEYS = ["backgroundColor", "colorA", "colorB", "colorC", "tintColor"] as const;
const HEX8 = /^#[0-9a-f]{8}$/;

function frame(overrides: Partial<SwirlParams>): SwirlParams {
  return { ...METALLIC_SWIRL_DEFAULTS, ...overrides };
}

function keyframeAt(index: number): SwirlParams {
  const keyframe = HOME_SWIRL_KEYFRAMES[index];
  if (!keyframe) throw new Error(`no keyframe ${index}`);
  return keyframe;
}

/** x = 0, 0.01, 0.02, ... up to and including `last`. */
function steps(last: number): number[] {
  return Array.from({ length: last * 100 + 1 }, (_, i) => i / 100);
}

describe("hex colours", () => {
  test("every hex form is parsed to channels in 0..1", () => {
    expect(parseHexColor("#fff")).toEqual([1, 1, 1, 1]);
    expect(parseHexColor("#f000")).toEqual([1, 0, 0, 0]);
    expect(parseHexColor("#a8d2ff")).toEqual([168 / 255, 210 / 255, 1, 1]);
    expect(parseHexColor("#DFEAFF00")).toEqual([223 / 255, 234 / 255, 1, 0]);
  });

  test("a malformed colour is transparent black instead of an error", () => {
    expect(parseHexColor("blue")).toEqual([0, 0, 0, 0]);
    expect(parseHexColor("#12345")).toEqual([0, 0, 0, 0]);
    expect(parseHexColor("")).toEqual([0, 0, 0, 0]);
  });

  test("channels are clamped and written as #rrggbbaa", () => {
    expect(formatHexColor([1.4, -0.2, 0.5, 1])).toBe("#ff0080ff");
    expect(formatHexColor(parseHexColor("#a8d2ff"))).toBe("#a8d2ffff");
  });
});

describe("createKeyframeSampler", () => {
  test("is exact at integer positions", () => {
    const sample = createKeyframeSampler(HOME_SWIRL_KEYFRAMES);
    HOME_SWIRL_KEYFRAMES.forEach((keyframe, index) => {
      const sampled = sample(index);
      for (const key of Object.keys(keyframe) as Array<keyof SwirlParams>) {
        const expected = keyframe[key];
        if (typeof expected === "number") {
          expect(sampled[key], `${key} at ${index}`).toBe(expected);
        } else if ((COLOR_KEYS as readonly string[]).includes(key)) {
          expect(sampled[key], `${key} at ${index}`).toBe(formatHexColor(parseHexColor(expected)));
        } else {
          expect(sampled[key], `${key} at ${index}`).toBe(expected);
        }
      }
    });
  });

  test("clamps positions outside the keyframe range", () => {
    const sample = createKeyframeSampler(HOME_SWIRL_KEYFRAMES);
    expect(sample(-3)).toEqual(sample(0));
    expect(sample(99)).toEqual(sample(HOME_SWIRL_KEYFRAMES.length - 1));
    expect(sample(Number.NaN)).toEqual(sample(0));
  });

  test("does not overshoot between a 0 -> 1 -> 1 sequence", () => {
    const sample = createKeyframeSampler([
      frame({ brightness: 0 }),
      frame({ brightness: 1 }),
      frame({ brightness: 1 }),
    ]);
    let previous = 0;
    for (const x of steps(2)) {
      const value = sample(x).brightness;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
      expect(value).toBeGreaterThanOrEqual(previous);
      if (x >= 1) expect(value).toBe(1);
      previous = value;
    }
    // Eases in and out of the flat part: the first segment is a plain smoothstep.
    expect(sample(0.5).brightness).toBeCloseTo(0.5, 12);
    expect(sample(0.25).brightness).toBeCloseTo(0.15625, 12);
  });

  test("stays monotone and inside its neighbours when the steps are very uneven", () => {
    const values = [0, 0.01, 10, 10.02, 30];
    const sample = createKeyframeSampler(values.map((twist) => frame({ twist })));
    let previous = -Infinity;
    for (const x of steps(values.length - 1)) {
      const value = sample(x).twist;
      const lower = values[Math.floor(x)] ?? 0;
      const upper = values[Math.ceil(x)] ?? 0;
      expect(value).toBeGreaterThanOrEqual(lower - 1e-9);
      expect(value).toBeLessThanOrEqual(upper + 1e-9);
      expect(value).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = value;
    }
  });

  test("a local extremum is approached with zero velocity", () => {
    const sample = createKeyframeSampler([
      frame({ hole: 0.16 }),
      frame({ hole: 0 }),
      frame({ hole: 1 }),
    ]);
    const before = (sample(1).hole - sample(1 - 1e-4).hole) / 1e-4;
    const after = (sample(1 + 1e-4).hole - sample(1).hole) / 1e-4;
    expect(Math.abs(before)).toBeLessThan(1e-3);
    expect(Math.abs(after)).toBeLessThan(1e-3);
    for (const x of steps(2)) expect(sample(x).hole).toBeGreaterThanOrEqual(0);
  });

  test("zoom between 2.11 and 0.25 is geometric at the midpoint", () => {
    const geometricMean = Math.sqrt(2.11 * 0.25);

    const pair = createKeyframeSampler([frame({ zoom: 2.11 }), frame({ zoom: 0.25 })]);
    expect(pair(0.5).zoom).toBeCloseTo(geometricMean, 12);

    // The same segment inside the home set (#inside -> #bundles): both ends are local extrema.
    expect(keyframeAt(1).zoom).toBe(2.11);
    expect(keyframeAt(2).zoom).toBe(0.25);
    const home = createKeyframeSampler(HOME_SWIRL_KEYFRAMES);
    expect(home(1.5).zoom).toBeCloseTo(geometricMean, 12);
    expect(home(1.5).zoom).toBeLessThan((2.11 + 0.25) / 2);
  });

  test("repetition is geometric too, and falls back to linear when a value is not positive", () => {
    const geometric = createKeyframeSampler([frame({ repetition: 1 }), frame({ repetition: 4 })]);
    expect(geometric(0.5).repetition).toBeCloseTo(2, 12);

    const linear = createKeyframeSampler([frame({ zoom: -1 }), frame({ zoom: 3 })]);
    expect(linear(0.5).zoom).toBeCloseTo(1, 12);

    const plain = createKeyframeSampler([frame({ twist: 1 }), frame({ twist: 4 })]);
    expect(plain(0.5).twist).toBeCloseTo(2.5, 12);
  });

  test("colours are splined per channel and stay in range", () => {
    const sample = createKeyframeSampler([
      frame({ colorA: "#000", colorB: "#00000000" }),
      frame({ colorA: "#ffffff", colorB: "#ffffffff" }),
      frame({ colorA: "#fff", colorB: "#000000ff" }),
    ]);
    for (const x of steps(2)) {
      const sampled = sample(x);
      for (const key of COLOR_KEYS) expect(sampled[key]).toMatch(HEX8);
      for (const channel of parseHexColor(sampled.colorB)) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(1);
      }
    }
    expect(sample(0.5).colorA).toBe("#808080ff");
    expect(sample(1.5).colorA).toBe("#ffffffff");
    expect(sample(0.5).colorB).toBe("#80808080");
    expect(sample(1.5).colorB).toBe("#808080ff");
  });

  test("strings come from the nearest keyframe", () => {
    const sample = createKeyframeSampler([
      frame({ colorMode: "stripes" }),
      frame({ colorMode: "phase" }),
    ]);
    expect(sample(0.4).colorMode).toBe("stripes");
    expect(sample(0.6).colorMode).toBe("phase");
  });

  test("works for any keyframe count and never hands out a keyframe object", () => {
    const single = createKeyframeSampler([frame({ zoom: 3 })]);
    expect(single(0).zoom).toBe(3);
    expect(single(5).zoom).toBe(3);

    const sample = createKeyframeSampler(HOME_SWIRL_KEYFRAMES);
    expect(sample(0)).not.toBe(keyframeAt(0));
    expect(() => createKeyframeSampler([])).toThrow(RangeError);
  });
});

describe("progressAtStops", () => {
  // Band top, four section centres, band bottom: the home page layout in miniature.
  const stops = [800, 1200, 2000, 2900, 3700, 4100];

  test("keyframe k is reached exactly on stop k", () => {
    stops.forEach((stop, index) => expect(progressAtStops(stops, stop)).toBe(index));
    expect(HOME_SWIRL_KEYFRAMES).toHaveLength(stops.length);
  });

  test("is linear between two stops", () => {
    expect(progressAtStops(stops, 1000)).toBeCloseTo(0.5, 12);
    expect(progressAtStops(stops, 1400)).toBeCloseTo(1.25, 12);
    expect(progressAtStops(stops, 3900)).toBeCloseTo(4.5, 12);
  });

  test("is clamped above the first stop and below the last", () => {
    expect(progressAtStops(stops, 0)).toBe(0);
    expect(progressAtStops(stops, -500)).toBe(0);
    expect(progressAtStops(stops, 4101)).toBe(5);
    expect(progressAtStops(stops, 1e9)).toBe(5);
  });

  test("never decreases as the page scrolls down", () => {
    let previous = 0;
    for (let probe = 0; probe <= 5000; probe += 7) {
      const progress = progressAtStops(stops, probe);
      expect(progress).toBeGreaterThanOrEqual(previous);
      expect(progress).toBeLessThanOrEqual(5);
      previous = progress;
    }
  });

  test("coinciding stops, short lists and bad input give a finite index", () => {
    expect(progressAtStops([100, 100, 100], 100)).toBe(0);
    expect(progressAtStops([100, 100, 300], 200)).toBeCloseTo(1.5, 12);
    expect(progressAtStops([100, 100, 100], 101)).toBe(2);
    expect(progressAtStops([], 50)).toBe(0);
    expect(progressAtStops([10], 50)).toBe(0);
    expect(progressAtStops(stops, Number.NaN)).toBe(0);
  });
});

describe("home keyframes", () => {
  test("there are six: band top, four sections, band bottom", () => {
    expect(HOME_SWIRL_KEYFRAMES).toHaveLength(6);
    for (const keyframe of HOME_SWIRL_KEYFRAMES) {
      expect(Object.keys(keyframe).sort()).toEqual(Object.keys(METALLIC_SWIRL_DEFAULTS).sort());
      expect(keyframe.colorMode).toBe("stripes");
      expect(keyframe.backgroundColor).toBe("#00000000");
      expect(keyframe.fadeTop).toBe(0.5);
      expect(keyframe.fadeBottom).toBe(0.5);
      expect(keyframe.detailFade).toBe(1);
      expect(keyframe.beams).toBe(5);
    }
  });

  test("the reference stops keep their values", () => {
    expect(keyframeAt(0)).toMatchObject({ zoom: 2.1, centerX: 0.17, centerY: 0.95, radialMix: 0 });
    expect(keyframeAt(1)).toMatchObject({ zoom: 2.11, centerY: 0.45, hole: 0, repetition: 1.9 });
    expect(keyframeAt(2)).toMatchObject({ zoom: 0.25, brightness: 0.14, radialMix: 0.39 });
    expect(keyframeAt(4)).toMatchObject({ speed: 0.1, zoom: 2, tangentForce: -1.2, radialMix: 1 });
    expect(keyframeAt(5)).toMatchObject({ speed: 0, centerY: 1, colorA: "#ffffffff" });
  });

  test("the #featured stop is still, dim and pale blue, between the breath and the burst", () => {
    const featured = keyframeAt(3);
    expect(featured.speed).toBe(0);
    expect(featured.brightness).toBe(0.28);
    expect(featured.colorA).toBe("#a8d2ffff");

    const breath = keyframeAt(2);
    const burst = keyframeAt(4);
    for (const key of ["zoom", "radialMix", "iterations", "gradientForce", "softness"] as const) {
      expect(featured[key]).toBeGreaterThan(Math.min(breath[key], burst[key]));
      expect(featured[key]).toBeLessThan(Math.max(breath[key], burst[key]));
    }
  });

  test("only the dark section animates itself", () => {
    const sample = createKeyframeSampler(HOME_SWIRL_KEYFRAMES);
    for (const x of steps(3)) expect(sample(x).speed).toBe(0);
    expect(sample(4).speed).toBe(0.1);
    expect(sample(5).speed).toBe(0);
    for (const x of steps(5)) {
      const speed = sample(x).speed;
      expect(speed).toBeGreaterThanOrEqual(0);
      expect(speed).toBeLessThanOrEqual(0.1);
    }
  });

  test("the line colour stays pale blue until #featured and is white from #practice on", () => {
    const sample = createKeyframeSampler(HOME_SWIRL_KEYFRAMES);
    for (const x of steps(3)) expect(sample(x).colorA).toBe("#a8d2ffff");
    for (const x of [4, 4.5, 5]) expect(sample(x).colorA).toBe("#ffffffff");
  });
});

describe("parameter sets", () => {
  test("the inner-page set only overrides known parameters", () => {
    const known = Object.keys(METALLIC_SWIRL_DEFAULTS);
    for (const key of Object.keys(INNER_SWIRL_PARAMS)) expect(known).toContain(key);
    expect(INNER_SWIRL_PARAMS).toMatchObject({ beams: 2, zoom: 2.53, initialTime: 100 });
  });
});
