/**
 * The choreography of each ink plate: the site scene it starts from (`lib/ink/scenes.ts`, with its
 * own drops), anchors for that scene, how far into it the plate starts, and the plate's own events
 * at seconds of plate time. Every drop is fixed here, so a plate renders the same way every time.
 *
 * `plates.mjs` keys each plate's cache on its definition's source text, so changing one plate
 * renders only that plate again.
 */

/** A rectangle of the 1920 by 1080 frame, as fractions. */
const px = (x, y, width, height) => ({
  x: x / 1920,
  y: y / 1080,
  width: width / 1920,
  height: height / 1080,
});

/** A drop at `at`, its data kept beside it so the cache key sees it. */
const drop = (at, d) => ({ at, drop: d, run: (ink) => ink.drop(d) });

export const PLATE_DEFS = {
  // The ink that swallows the generic reply and turns to mist as the tagline arrives. After that
  // it falls only along the right edge and drifts right, clear of the tagline on the left.
  flood: {
    scene: "spill",
    events: [
      drop(0, {
        x: 0.46,
        y: 0.16,
        ink: "black",
        amount: 3.6,
        radius: 0.15,
        velocity: [0.05, 0.95],
        fiber: 0.76,
        turbulence: 0.5,
        swell: 2.0,
        swellTime: 1.0,
      }),
      drop(0.3, {
        x: 0.27,
        y: 0.42,
        ink: "black",
        amount: 3.0,
        radius: 0.11,
        velocity: [0.35, 0.45],
        fiber: 0.76,
        turbulence: 0.45,
        swell: 1.4,
        swellTime: 0.9,
      }),
      drop(0.6, {
        x: 0.64,
        y: 0.7,
        ink: "blue",
        amount: 3.0,
        radius: 0.1,
        velocity: [0.2, -0.35],
        fiber: 0.78,
        turbulence: 0.4,
        swell: 1.3,
        swellTime: 0.9,
      }),
      { at: 2.0, run: (ink) => ink.clear({ duration: 1.1 }) },
      ...[
        [2.9, 0.9, 3.0, 0.09, "black"],
        [3.6, 0.84, 2.7, 0.075, "black"],
        [4.6, 0.95, 2.8, 0.07, "black"],
        [5.0, 0.88, 2.8, 0.08, "blue"],
        [6.1, 0.83, 2.6, 0.07, "black"],
        [6.8, 0.93, 2.6, 0.07, "black"],
      ].map(([at, x, amount, radius, ink]) =>
        drop(at, {
          x,
          y: 0.03,
          ink,
          amount,
          radius,
          velocity: [0.06, 0.9],
          fiber: 0.74,
          turbulence: 0.35,
        }),
      ),
    ],
  },

  // Black ink that builds until it floods the whole frame, on the way to the binder.
  wipe: {
    scene: "spill",
    events: [
      [0.0, 0.5, 0.18, 0.13, [0, 0.9]],
      [0.12, 0.2, 0.3, 0.15, [0.4, 0.7]],
      [0.24, 0.8, 0.26, 0.17, [-0.4, 0.7]],
      [0.36, 0.36, 0.72, 0.2, [0.3, -0.5]],
      [0.48, 0.66, 0.66, 0.24, [-0.3, -0.5]],
      [0.6, 0.5, 0.45, 0.28, [0, 0.2]],
    ].map(([at, x, y, radius, velocity]) =>
      drop(at, {
        x,
        y,
        ink: "black",
        amount: 5.5,
        radius,
        velocity,
        fiber: 0.7,
        turbulence: 0.5,
        swell: 2.6,
        swellTime: 0.7,
      }),
    ),
  },

  // The binder: light-blue ink falls from the last tenth of the bar when it turns blue.
  ninety: {
    scene: "ninety",
    anchors: { tenth: px(1600, 560, 160, 56) },
    events: [
      { at: 2.0, run: (ink) => ink.fire("tenth") },
      drop(3.4, {
        x: 0.9,
        y: 0.56,
        ink: "blue",
        amount: 2.4,
        radius: 0.06,
        velocity: [0.02, 0.5],
        fiber: 0.8,
        turbulence: 0.3,
      }),
    ],
  },

  // The end card: light-blue ink rising from the foot, already under way when the card opens.
  bloom: { scene: "bloom", preroll: 4, events: [] },
};

/** A plate's definition as text, for its cache key. */
export function plateSource(name) {
  const def = PLATE_DEFS[name];
  return JSON.stringify(def, (key, value) =>
    typeof value === "function" ? value.toString() : value,
  );
}
