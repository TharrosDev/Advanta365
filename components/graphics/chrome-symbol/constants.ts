import { MARK_HALF_WIDTH_NORMALIZED } from "@/lib/brand/mark";

/**
 * Parameters of the chrome symbol. Lengths are in glyph heights (the mark is exactly 1 unit tall,
 * centred on the origin, y up); angles are in degrees.
 */
export type ChromeSymbolParams = {
  /** Half thickness of the extrusion along Z. */
  depth: number;
  /** Edge rounding radius (clamped to 0.98 * depth when drawn). */
  bevel: number;
  /** Widens the light bands and highlights of the studio environment. */
  roughness: number;
  /** Rotation about the vertical axis. Positive turns the front face to the viewer's right. */
  yaw: number;
  /** Rotation about the horizontal axis. */
  pitch: number;
  /** Idle wobble amplitude. */
  sway: number;
  /** Idle clock rate. 0 freezes the wobble and lets the renderer go idle after the intro. */
  speed: number;
  /** Zoom: the solid is drawn `fit` times larger than the DOM glyph box. */
  fit: number;
  /** How much the surface position bends the reflection vector. */
  parallax: number;
  /** Gain applied before tone mapping. 0 gives a black silhouette, large values a white one. */
  exposure: number;
  keyAzimuth: number;
  keyElevation: number;
  fillAzimuth: number;
  fillElevation: number;
  /** Base reflectance tint of the metal. */
  tintR: number;
  tintG: number;
  tintB: number;
};

/** The resting look: front-facing, slightly cool chrome. */
export const CHROME_SYMBOL_DEFAULTS: ChromeSymbolParams = {
  depth: 0.09,
  bevel: 0.032,
  roughness: 0.265,
  yaw: 0,
  pitch: 0,
  sway: 4.5,
  speed: 0,
  fit: 1.125,
  parallax: 1.25,
  exposure: 1.05,
  keyAzimuth: 0,
  keyElevation: 34,
  fillAzimuth: 118,
  fillElevation: 8,
  tintR: 0.95,
  tintG: 0.955,
  tintB: 0.97,
};

/**
 * The intro: the symbol starts edge-on with zero thickness (a hairline), swells into a bar, then
 * turns to face the viewer while every parameter blends to its resting value. With `spin` it keeps
 * turning at one revolution per `spinPeriod` until it is asked to land.
 *
 * The entry overlay copies these timings into CSS custom properties, which is what keeps the two
 * words of the wordmark in step with the WebGL symbol.
 */
export const CHROME_SYMBOL_INTRO: {
  from: Pick<ChromeSymbolParams, "depth" | "bevel" | "roughness" | "yaw">;
  initialDelay: 0.12;
  depthDuration: 0.8;
  depthEase: readonly [0, 0, 0, 1];
  blendDuration: 1.5;
  blendEase: readonly [0.5, 0, 0, 1];
  spinPeriod: 2;
  landMinDuration: 0.6;
} = {
  from: { depth: 0.112, bevel: 0.044, roughness: 0.43, yaw: -90 },
  initialDelay: 0.12,
  depthDuration: 0.8,
  depthEase: [0, 0, 0, 1],
  blendDuration: 1.5,
  blendEase: [0.5, 0, 0, 1],
  spinPeriod: 2,
  landMinDuration: 0.6,
};

/*
 * Field geometry. The mark's distance field is analytic (three capsules), so there is no texture;
 * these numbers only describe the box the canvas covers around the glyph.
 */

/** Free space kept around the glyph box on every side, so the turning solid is never clipped. */
export const FIELD_PADDING = 0.28;

/** Resolution the normal epsilon is derived from (texels per glyph height of the reference field). */
export const FIELD_PIXELS_PER_UNIT = 384;

export const GLYPH_HALF_WIDTH = MARK_HALF_WIDTH_NORMALIZED;
export const GLYPH_HALF_HEIGHT = 0.5;

/** Half extents of the area the canvas covers, in glyph units (0.9467 x 0.78). */
export const FIELD_HALF_WIDTH = GLYPH_HALF_WIDTH + FIELD_PADDING;
export const FIELD_HALF_HEIGHT = GLYPH_HALF_HEIGHT + FIELD_PADDING;

/** Step of the central differences that give the surface normal. */
export const NORMAL_EPSILON = 1.25 / FIELD_PIXELS_PER_UNIT;

/**
 * How far the canvas overhangs the glyph box on each side, as a fraction of the box's own width
 * and height (0.21 and 0.28). Written to `--chrome-symbol-pad-x` / `--chrome-symbol-pad-y`.
 */
export const CHROME_SYMBOL_PAD_X = Number((FIELD_PADDING / (2 * GLYPH_HALF_WIDTH)).toFixed(4));
export const CHROME_SYMBOL_PAD_Y = Number((FIELD_PADDING / (2 * GLYPH_HALF_HEIGHT)).toFixed(4));
