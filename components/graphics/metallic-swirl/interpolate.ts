import type { SwirlParams } from "./params";

/**
 * Keyframe interpolation for the swirl's scroll morph. Pure maths, no DOM: imported by the scroll
 * driver, by `keyframes.ts` and by the unit test.
 *
 * `x` is a fractional keyframe index (knots sit at 0, 1, 2, ...):
 * - numbers: monotone cubic Hermite (Fritsch-Carlson), so a value never overshoots its two neighbouring
 *   keyframes and every local extremum is approached with zero velocity;
 * - `zoom` and `repetition`: the same spline over log(value) when every keyframe is positive
 *   (a zoom from 2 to 0.25 passes through 0.71 at the midpoint, not 1.1);
 * - hex colours: one spline per channel, clamped, re-encoded as `#rrggbbaa`;
 * - anything else (`colorMode`): taken from the nearest keyframe.
 */

type Rgba = [number, number, number, number];

type NumericKey = {
  [K in keyof SwirlParams]-?: SwirlParams[K] extends number ? K : never;
}[keyof SwirlParams];

const COLOR_KEYS = ["backgroundColor", "colorA", "colorB", "colorC", "tintColor"] as const;
const GEOMETRIC_KEYS: readonly NumericKey[] = ["zoom", "repetition"];

/** A scalar spline over uniform knots. `raw` keeps the keyframe values so knots are returned exactly. */
type Track = {
  raw: readonly number[];
  values: readonly number[];
  tangents: readonly number[];
  geometric: boolean;
};

function at(list: readonly number[], index: number): number {
  return list[index] ?? 0;
}

/** Tangents of a monotone cubic Hermite spline over uniform knots (endpoints flat, limiter applied). */
function monotoneTangents(values: readonly number[]): number[] {
  const count = values.length;
  const deltas: number[] = [];
  for (let i = 0; i < count - 1; i++) deltas.push(at(values, i + 1) - at(values, i));

  const tangents: number[] = new Array<number>(count).fill(0);
  for (let i = 1; i < count - 1; i++) {
    const before = at(deltas, i - 1);
    const after = at(deltas, i);
    tangents[i] = before * after <= 0 ? 0 : (before + after) / 2;
  }

  for (let i = 0; i < count - 1; i++) {
    const delta = at(deltas, i);
    if (delta === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = at(tangents, i) / delta;
    const b = at(tangents, i + 1) / delta;
    const sum = a * a + b * b;
    if (sum > 9) {
      const scale = 3 / Math.sqrt(sum);
      tangents[i] = scale * a * delta;
      tangents[i + 1] = scale * b * delta;
    }
  }
  return tangents;
}

function createTrack(raw: readonly number[], geometric: boolean): Track {
  const useLog = geometric && raw.every((value) => value > 0);
  const values = useLog ? raw.map((value) => Math.log(value)) : raw;
  return { raw, values, tangents: monotoneTangents(values), geometric: useLog };
}

function evaluate(track: Track, x: number): number {
  const last = track.raw.length - 1;
  if (!(x > 0)) return at(track.raw, 0);
  if (x >= last) return at(track.raw, last);

  const index = Math.min(Math.floor(x), last - 1);
  const t = x - index;
  const from = at(track.values, index);
  const to = at(track.values, index + 1);
  // Knots and flat segments return the keyframe value itself, free of rounding noise.
  if (t === 0 || from === to) return at(track.raw, index);

  const t2 = t * t;
  const t3 = t2 * t;
  const value =
    (2 * t3 - 3 * t2 + 1) * from +
    (t3 - 2 * t2 + t) * at(track.tangents, index) +
    (3 * t2 - 2 * t3) * to +
    (t3 - t2) * at(track.tangents, index + 1);
  return track.geometric ? Math.exp(value) : value;
}

/**
 * Parses `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` into channels in 0..1. Anything else is read as
 * transparent black (a bad keyframe colour must never throw inside a scroll handler).
 */
export function parseHexColor(hex: string): Rgba {
  const digits = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]+$/i.test(digits)) return [0, 0, 0, 0];

  let pairs: string[];
  if (digits.length === 3 || digits.length === 4) {
    pairs = Array.from(digits, (digit) => digit + digit);
  } else if (digits.length === 6 || digits.length === 8) {
    pairs = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6), digits.slice(6, 8)];
  } else {
    return [0, 0, 0, 0];
  }

  const channel = (index: number): number => {
    const pair = pairs[index];
    return pair ? parseInt(pair, 16) / 255 : 1;
  };
  return [channel(0), channel(1), channel(2), channel(3)];
}

/** Encodes channels in 0..1 (clamped) as lower-case `#rrggbbaa`. */
export function formatHexColor(rgba: readonly number[]): string {
  let out = "#";
  for (let i = 0; i < 4; i++) {
    const value = at(rgba, i);
    const clamped = value > 0 ? Math.min(value, 1) : 0;
    out += Math.round(clamped * 255)
      .toString(16)
      .padStart(2, "0");
  }
  return out;
}

/**
 * Scroll position to keyframe index. `stops` are ascending positions (one per keyframe) and `probe` is
 * the position being read, in the same units: the result is `k` exactly on stop `k`, linear between two
 * stops, and clamped to `[0, stops.length - 1]` outside them. Stops that coincide never divide by zero.
 */
export function progressAtStops(stops: readonly number[], probe: number): number {
  const last = stops.length - 1;
  if (last < 1 || !(probe > at(stops, 0))) return 0;
  for (let i = 0; i < last; i++) {
    const from = at(stops, i);
    const to = at(stops, i + 1);
    if (probe < to) return to > from ? i + Math.max(probe - from, 0) / (to - from) : i;
  }
  return last;
}

/**
 * Builds `sample(x)` for any number of keyframes (two or more make a morph; one is a constant).
 * `x` is clamped to `[0, keyframes.length - 1]`; integer `x` returns that keyframe's numbers exactly.
 */
export function createKeyframeSampler(
  keyframes: readonly SwirlParams[],
): (x: number) => SwirlParams {
  const first = keyframes[0];
  if (!first) throw new RangeError("createKeyframeSampler needs at least one keyframe");
  const last = keyframes.length - 1;

  const numericKeys = (Object.keys(first) as Array<keyof SwirlParams>).filter(
    (key): key is NumericKey => typeof first[key] === "number",
  );
  const numericTracks = numericKeys.map((key) => ({
    key,
    track: createTrack(
      keyframes.map((frame) => frame[key]),
      GEOMETRIC_KEYS.includes(key),
    ),
  }));

  const colorTracks = COLOR_KEYS.map((key) => {
    const colors = keyframes.map((frame) => parseHexColor(frame[key]));
    return {
      key,
      channels: [0, 1, 2, 3].map((channel) =>
        createTrack(
          colors.map((color) => at(color, channel)),
          false,
        ),
      ),
    };
  });

  return (x: number): SwirlParams => {
    const position = x > 0 ? Math.min(x, last) : 0;
    const nearest = keyframes[Math.round(position)] ?? first;
    const out: SwirlParams = { ...nearest };
    for (const { key, track } of numericTracks) out[key] = evaluate(track, position);
    for (const { key, channels } of colorTracks) {
      out[key] = formatHexColor(channels.map((track) => evaluate(track, position)));
    }
    return out;
  };
}
