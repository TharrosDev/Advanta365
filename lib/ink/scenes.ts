import { LOOK_DARK, type Look, type Sim } from "./engine/defaults";
import type { InkDrop, InkStream, Rect, SceneName, Vec2 } from "./types";

/**
 * The seven scenes. Each is a function of the canvas's shape and of the rectangles the page marked
 * for it, and returns the water, the look and a script: what falls into the water, and when.
 *
 * A script only ever calls `drop`, `stream` and `clear` on what it is handed, so the unit tests run
 * it against a recorder. Coordinates are fractions of the canvas (origin top-left, y down); a
 * radius is in canvas heights, a velocity in canvas heights per second, a time in seconds.
 */

/** What a script may do to the water. */
export type SceneInk = {
  drop(d: InkDrop): unknown;
  stream(s: InkStream): unknown;
  clear(o?: { duration?: number }): unknown;
};

export type SceneContext = {
  /** Width over height of the canvas. */
  aspect: number;
  /** A tall canvas: aspect under 0.8. */
  portrait: boolean;
  width: number;
  height: number;
  /** Rectangles the page marked with `data-ink-anchor`, in fractions of the canvas. */
  anchors: Readonly<Record<string, Rect>>;
};

type Run = (ink: SceneInk, rand: () => number) => void;

/** Once, at a time; or again and again, a random interval apart, from a time on. */
export type TimelineEntry = { at: number; run: Run } | { every: Vec2; from: number; run: Run };

export type Scene = {
  /** Seconds after which the scene is over (the engine emits "end"). Absent: it has no end. */
  duration?: number;
  /** Fixed steps that make its settled frame. */
  still: number;
  sim: Partial<Sim>;
  look: Partial<Look>;
  timeline: TimelineEntry[];
  /** Scripts that wait for `fire(name)`; their times count from that moment. */
  triggers?: Record<string, TimelineEntry[]>;
};

/** A small deterministic generator (xorshift, 32 bit), so every run of a scene is the same. */
export function makeRandom(seed: number): () => number {
  let x = seed | 0 || 0x1f2e3d4c;
  const next = () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
  for (let i = 0; i < 8; i++) next();
  return next;
}

/** A script entry with the time it is next due, or null once it has run for good. */
export type Armed = { entry: TimelineEntry; next: number | null };

/** Arms a script: every entry gets its first due time, `offset` seconds from now. */
export function armTimeline(entries: readonly TimelineEntry[], offset = 0): Armed[] {
  return entries.map((entry) => ({
    entry,
    next: offset + ("every" in entry ? entry.from : entry.at),
  }));
}

/** Runs everything that is due at `clock`. */
export function runTimeline(
  armed: readonly Armed[],
  clock: number,
  ink: SceneInk,
  rand: () => number,
): void {
  for (const item of armed) {
    while (item.next !== null && item.next <= clock + 1e-9) {
      item.entry.run(ink, rand);
      if ("every" in item.entry) {
        const [min, max] = item.entry.every;
        item.next += min + (max - min) * rand();
      } else {
        item.next = null;
      }
    }
  }
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** A point across a lane: 0 is its left end, 1 its right. */
const across = (lane: Vec2) => (k: number) => lane[0] + (lane[1] - lane[0]) * k;

/** The water of the hero, shared by the title scene. */
const heroWater = (portrait: boolean): Partial<Sim> => ({
  speed: 0.6,
  gravity: [0.2, 0.16],
  velocityDamping: 1.2,
  confinement: portrait ? 3.5 : 4.5,
  massBlur: portrait ? 1.8 : 1.0,
  viscosity: 0.06,
  dyeDecay: [0.02, 0.022, 0.04, 0.045],
  dyeFloor: portrait ? 0.026 : 0.014,
  ambient: 0.014,
  ambientScale: 2.0,
});

export const SCENES: Record<SceneName, (ctx: SceneContext) => Scene> = {
  /**
   * The load-in. A white field; one black drop falls and rolls into a plume, a light-blue drop
   * chases it, then the ink turns to mist and the field is clean again. On a tall screen the same
   * picture is drawn smaller, so the plume fits the width.
   */
  intro: (ctx) => {
    const k = ctx.portrait ? 0.72 : 1;
    const r = 0.085 * k;
    const dx = (0.12 * k) / ctx.aspect;
    const base = { y: 0.02, fiber: 0.78, turbulence: 0.35 * k };
    return {
      duration: 2.8,
      still: 96,
      sim: {
        speed: 1.0,
        substeps: 2,
        gravity: [0.2 * k, 0.16 * k],
        velocityDamping: 1.25,
        confinement: 4.5,
        massBlur: 1.0,
        viscosity: 0.06,
        dyeDecay: [0.01, 0.01, 0.03, 0.03],
        dyeFloor: 0.004,
        ambient: 0.01,
      },
      look: { farDensity: 0.3 },
      timeline: [
        {
          at: 0.0,
          run: (ink) =>
            ink.drop({
              ...base,
              x: 0.5 - dx * 0.4,
              ink: "black",
              amount: 2.9,
              radius: r,
              velocity: [0.0, 0.68 * k],
            }),
        },
        {
          at: 0.6,
          run: (ink) =>
            ink.drop({
              ...base,
              x: 0.5 + dx,
              ink: "blue",
              amount: 2.75,
              radius: r * 0.8,
              velocity: [-0.04 * k, 0.68 * k],
            }),
        },
        { at: 1.75, run: (ink) => ink.clear({ duration: 1.05 }) },
      ],
    };
  },

  /**
   * The tank beside the headline. Ink arrives from above, over the open water the page marked
   * (`open`), and keeps arriving, slowly, for as long as the scene runs. On a tall canvas the drops
   * start under the text, so ink never falls through it.
   */
  hero: (ctx) => {
    const open = ctx.anchors.open;
    const lane: Vec2 = ctx.portrait
      ? [0.22, 0.8]
      : open
        ? [clamp(open.x, 0.04, 0.9), clamp(open.x + open.width, 0.1, 0.96)]
        : [0.6, 0.9];
    const r = ctx.portrait ? 0.058 : 0.08;
    const at = across(lane);
    const y = ctx.portrait && open ? clamp(open.y + 0.03, 0.03, 0.9) : 0.03;
    const base = { y, fiber: 0.7, turbulence: 0.35 };
    let beat = 0;
    let slot = 1;
    return {
      still: 660,
      sim: heroWater(ctx.portrait),
      look: {},
      timeline: [
        {
          at: 0.0,
          run: (ink) =>
            ink.drop({
              ...base,
              x: at(0.45),
              ink: "black",
              amount: 3.1,
              radius: r,
              velocity: [0.0, 0.85],
            }),
        },
        {
          at: 3.5,
          run: (ink) =>
            ink.drop({
              ...base,
              x: at(0.86),
              ink: "blue",
              amount: 3.0,
              radius: r * 0.85,
              velocity: [-0.03, 0.8],
            }),
        },
        {
          at: 7.5,
          run: (ink) =>
            ink.drop({
              ...base,
              x: at(0.12),
              ink: "black",
              amount: 2.8,
              radius: r * 0.8,
              velocity: [0.03, 0.75],
            }),
        },
        {
          every: ctx.portrait ? [7.5, 11.0] : [5.5, 8.5],
          from: 13.0,
          run: (ink, rand) => {
            // Two black drops to each blue one, never the same quarter of the lane twice running,
            // and every third drop a larger one.
            beat += 1;
            const blue = beat % 3 === 2;
            const large = beat % 3 === 0 ? 1.3 : 1;
            slot = (slot + 1 + Math.floor(rand() * 2)) % 4;
            ink.drop({
              ...base,
              x: at((slot + 0.2 + rand() * 0.6) / 4),
              ink: blue ? "blue" : "black",
              amount: 2.7 + rand() * 0.7,
              radius: r * (0.75 + rand() * 0.35) * large,
              velocity: [(rand() - 0.5) * 0.1, 0.7 + rand() * 0.25],
            });
          },
        },
      ],
    };
  },

  /** The title block of an inner page: the hero's water in a narrow slot, two drops and a slow drip. */
  title: () => {
    const base = { y: 0.03, fiber: 0.72, turbulence: 0.35 };
    let beat = 0;
    return {
      still: 420,
      sim: heroWater(false),
      look: {},
      timeline: [
        {
          at: 0.0,
          run: (ink) =>
            ink.drop({
              ...base,
              x: 0.5,
              ink: "black",
              amount: 2.8,
              radius: 0.1,
              velocity: [0.0, 0.8],
            }),
        },
        {
          at: 1.6,
          run: (ink) =>
            ink.drop({
              ...base,
              x: 0.74,
              ink: "blue",
              amount: 2.8,
              radius: 0.08,
              velocity: [-0.03, 0.75],
            }),
        },
        {
          every: [7, 10],
          from: 9.0,
          run: (ink, rand) => {
            beat += 1;
            ink.drop({
              ...base,
              x: 0.35 + 0.5 * rand(),
              ink: beat % 2 ? "black" : "blue",
              amount: 2.6 + rand() * 0.4,
              radius: 0.07 + rand() * 0.02,
              velocity: [(rand() - 0.5) * 0.06, 0.72 + rand() * 0.1],
            });
          },
        },
      ],
    };
  },

  /**
   * The black band of the home page. The water is empty until the tenth block of the tally turns
   * light blue (`fire("tenth")`); then one drop of light-blue ink falls from it, and a smaller one
   * after it.
   */
  ninety: (ctx) => {
    const tenth = ctx.anchors.tenth;
    const x = tenth ? clamp(tenth.x + tenth.width / 2, 0.05, 0.95) : 0.7;
    const y = tenth ? clamp(tenth.y + tenth.height + 0.02, 0, 0.9) : 0.3;
    return {
      still: 300,
      sim: {
        speed: 0.6,
        gravity: [0.16, 0.16],
        velocityDamping: 1.1,
        confinement: 4.5,
        massBlur: 1.2,
        viscosity: 0.07,
        dyeDecay: [0.02, 0.016, 0.04, 0.03],
        dyeFloor: 0.012,
        ambient: 0.02,
        ambientScale: 1.6,
      },
      look: { ...LOOK_DARK, gamma: 1.4, blueOpacity: 0.34, farLod: 1.4 },
      timeline: [],
      triggers: {
        tenth: [
          {
            at: 0.0,
            run: (ink) =>
              ink.drop({
                x,
                y,
                ink: "blue",
                amount: 3.2,
                radius: 0.09,
                velocity: [0.0, 0.7],
                fiber: 0.8,
                turbulence: 0.3,
              }),
          },
          {
            at: 0.5,
            run: (ink) =>
              ink.drop({
                x: clamp(x - 0.1 / ctx.aspect, 0.02, 0.98),
                y: Math.max(0, y - 0.02),
                ink: "blue",
                amount: 2.2,
                radius: 0.05,
                velocity: [-0.05, 0.55],
                fiber: 0.8,
                turbulence: 0.25,
              }),
          },
        ],
      },
    };
  },

  /**
   * The closing statement: light-blue ink that rises from the foot of the section and opens upward,
   * cap after cap, slowly. The hero's water, turned over and slowed down.
   */
  bloom: (ctx) => {
    const r = ctx.portrait ? 0.062 : 0.1;
    const at = across(ctx.portrait ? [0.2, 0.8] : [0.3, 0.7]);
    const base = { y: 0.985, ink: "blue", fiber: 0.76, turbulence: 0.32 } as const;
    let slot = 0;
    return {
      still: 720,
      sim: {
        speed: 0.5,
        gravity: [-0.2, -0.17],
        velocityDamping: 1.2,
        confinement: ctx.portrait ? 3.5 : 4.5,
        massBlur: ctx.portrait ? 1.8 : 1.1,
        viscosity: 0.06,
        dyeDecay: [0.02, 0.02, 0.035, 0.035],
        dyeFloor: 0.012,
        ambient: 0.016,
        ambientScale: 1.8,
      },
      look: { blueGain: 0.52, farDensity: 0.5, light: [-0.4, 0.92] },
      timeline: [
        {
          at: 0.0,
          run: (ink) =>
            ink.drop({ ...base, x: at(0.5), amount: 3.2, radius: r, velocity: [0.0, -0.95] }),
        },
        {
          at: 2.2,
          run: (ink) =>
            ink.drop({
              ...base,
              x: at(0.1),
              amount: 2.8,
              radius: r * 0.8,
              velocity: [0.03, -0.85],
            }),
        },
        {
          at: 4.0,
          run: (ink) =>
            ink.drop({
              ...base,
              x: at(0.9),
              amount: 2.8,
              radius: r * 0.8,
              velocity: [-0.03, -0.85],
            }),
        },
        {
          every: [6.5, 9.5],
          from: 9.0,
          run: (ink, rand) => {
            slot = (slot + 1 + Math.floor(rand() * 2)) % 4;
            ink.drop({
              ...base,
              x: at((slot + 0.2 + rand() * 0.6) / 4),
              amount: 2.7 + rand() * 0.6,
              radius: r * (0.75 + rand() * 0.3),
              velocity: [(rand() - 0.5) * 0.08, -0.8 - rand() * 0.2],
            });
          },
        },
      ],
    };
  },

  /** The footer: faint light-blue and pale wisps on the near-black ground, where ink scatters light. */
  wisps: (ctx) => {
    const r = ctx.portrait ? 0.045 : 0.065;
    return {
      still: 600,
      sim: {
        speed: 0.5,
        gravity: [-0.06, -0.05],
        velocityDamping: 0.9,
        confinement: 4.5,
        massBlur: 1.4,
        viscosity: 0.08,
        dyeDecay: [0.035, 0.035, 0.05, 0.05],
        dyeFloor: 0.026,
        ambient: 0.045,
        ambientScale: 1.5,
        ambientSpeed: 0.05,
      },
      look: { ...LOOK_DARK },
      timeline: [
        {
          at: 0,
          run: (ink, rand) => {
            for (let i = 0; i < 4; i++) {
              ink.drop({
                x: 0.14 + 0.24 * i + (rand() - 0.5) * 0.1,
                y: 0.55 + 0.4 * rand(),
                ink: i % 2 ? "pale" : "blue",
                amount: 2.2 + rand(),
                radius: r * (0.8 + rand() * 0.4),
                velocity: [(rand() - 0.5) * 0.5, -0.25 - rand() * 0.3],
                fiber: 0.85,
                turbulence: 0.2,
              });
            }
          },
        },
        {
          every: [4.5, 7.5],
          from: 3.0,
          run: (ink, rand) => {
            ink.drop({
              x: 0.06 + 0.88 * rand(),
              y: 0.8 + 0.22 * rand(),
              ink: rand() < 0.6 ? "blue" : "pale",
              amount: 2.0 + rand() * 1.2,
              radius: r * (0.7 + rand() * 0.5),
              velocity: [(rand() - 0.5) * 0.5, -0.35 - rand() * 0.3],
              fiber: 0.85,
              turbulence: 0.2,
            });
          },
        },
      ],
    };
  },

  /**
   * The 404: a bottle knocked over above the page, leaning left. Heavy black drops, one after
   * another, that roll, finger and hang as one arc; then a slow drip while the page stays open.
   *
   * On a tall stage the drops are a little smaller and start a little lower than the specification's
   * figures (0.062 and `open.y + 0.03`): at those the first three merged under the calm zone, which
   * cut the body flat, and the body read as a head in profile at 2s.
   */
  spill: (ctx) => {
    const open = ctx.anchors.open;
    const x0 = ctx.portrait ? 0.56 : 0.74;
    const span = ctx.portrait ? 0.56 : 0.36;
    const r = ctx.portrait ? 0.058 : 0.095;
    const y = ctx.portrait && open ? clamp(open.y + 0.08, 0.03, 0.9) : 0.03;
    const base = { y, ink: "black", fiber: 0.74, turbulence: 0.4 } as const;
    const at = (k: number) => x0 + (k - 0.5) * span;
    const fall = (k: number, amount: number, size: number, velocity: Vec2): Run => {
      return (ink) => ink.drop({ ...base, x: at(k), amount, radius: r * size, velocity });
    };
    return {
      still: 480,
      sim: {
        speed: 0.6,
        gravity: [0.22, 0.18],
        velocityDamping: 1.15,
        confinement: 4.5,
        massBlur: ctx.portrait ? 1.6 : 1.0,
        viscosity: 0.06,
        dyeDecay: [0.014, 0.02, 0.03, 0.04],
        dyeFloor: 0.012,
        ambient: 0.014,
      },
      look: { blackGain: 0.95, blackOpacity: 1.9 },
      timeline: [
        { at: 0.0, run: fall(0.8, 3.4, 1.2, [-0.12, 1.0]) },
        { at: 0.7, run: fall(0.52, 3.0, 0.9, [-0.1, 0.85]) },
        { at: 1.5, run: fall(0.97, 3.2, 0.8, [-0.06, 0.95]) },
        { at: 2.6, run: fall(0.28, 2.8, 0.7, [-0.08, 0.8]) },
        { at: 4.2, run: fall(0.66, 3.0, 0.85, [-0.1, 0.85]) },
        { at: 6.4, run: fall(0.08, 2.6, 0.6, [-0.04, 0.75]) },
        {
          every: [5.0, 7.5],
          from: 10,
          run: (ink, rand) => {
            ink.drop({
              ...base,
              x: at(rand()),
              amount: 2.8 + rand() * 0.7,
              radius: r * (0.7 + rand() * 0.4),
              velocity: [(rand() - 0.5) * 0.12, 0.75 + rand() * 0.25],
            });
          },
        },
      ],
    };
  },
};

export function isSceneName(value: unknown): value is SceneName {
  return typeof value === "string" && Object.hasOwn(SCENES, value);
}
