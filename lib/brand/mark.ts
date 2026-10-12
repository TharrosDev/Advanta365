/**
 * The Advanta365 mark: a rounded monoline "A" whose crossbar runs on past the right leg.
 *
 * Pure data and the single source of truth for the mark. `LogoMark` strokes it either as one path
 * or as two (the body, and the tail of the crossbar in a second ink), and `app/icon.svg` repeats the
 * two-path form. `IntroCover` writes it as three: the tail and the two strokes of the body. The
 * "365" on the arm is a fourth part, in a finer pen, for the sizes that can carry it.
 */

export type MarkSegment = {
  readonly a: readonly [number, number];
  readonly b: readonly [number, number];
};

export const MARK_VIEWBOX = { width: 32, height: 24 } as const;

/** Width over height of the viewBox (4:3). */
export const MARK_ASPECT = 32 / 24;

/** Stroke width in viewBox units; every stroke is a capsule of radius 2.1. */
export const MARK_STROKE_WIDTH = 4.2;

/** Left leg, right leg, crossbar, in viewBox units (origin top-left, y down). */
export const MARK_SEGMENTS: readonly [MarkSegment, MarkSegment, MarkSegment] = [
  { a: [4, 20.5], b: [12.5, 3.5] },
  { a: [12.5, 3.5], b: [21, 20.5] },
  { a: [8.5, 13.5], b: [28.5, 13.5] },
];

/** The same three strokes as one SVG path (draw with round caps and joins). */
export const MARK_PATH_D = "M4 20.5L12.5 3.5L21 20.5M8.5 13.5H28.5";

/**
 * The two pen strokes of the "A", in the order a hand writes them: both legs in one stroke, then
 * the crossbar up to the centre line of the right leg. A dash pattern starts again on every
 * subpath, so a drawing that writes the mark stroke by stroke needs them as separate paths.
 */
export const MARK_LEGS_D = "M4 20.5L12.5 3.5L21 20.5";
export const MARK_BAR_D = "M8.5 13.5H17.5";

/** The "A" alone: both legs and the crossbar up to the centre line of the right leg. */
export const MARK_BODY_D = `${MARK_LEGS_D}${MARK_BAR_D}`;

/**
 * The crossbar's overshoot past the right leg. Drawn under the body, so its round start cap is
 * hidden by the leg and the two paths together cover exactly what `MARK_PATH_D` covers.
 */
export const MARK_TAIL_D = "M17.5 13.5H28.5";

/**
 * The "365" that stands on the arm, as the three strokes of a finer pen (round caps and joins, like
 * the "A"): a 3 in two bowls, a 6 that ends where its bowl began, and a 5 with a flat top. Each
 * digit is one open stroke, drawn in the order a hand writes it, in lines and curves only.
 *
 * They are drawn in the ink of the tail and they are for the eye alone: the name beside the mark
 * says "Advanta365". `app/icon.svg` does without them, since a favicon is too small to carry them.
 */
export const MARK_DIGITS: readonly [string, string, string] = [
  "M19.56 6.93C19.74 6.51 20.27 6.27 20.79 6.37C21.31 6.48 21.66 6.89 21.6 7.34C21.54 7.79 21.09 8.13 20.55 8.13C21.17 8.13 21.69 8.51 21.75 9C21.8 9.5 21.37 9.95 20.76 10.04C20.15 10.12 19.55 9.82 19.39 9.34",
  "M25.42 6.35C24.22 6.79 23.6 7.98 23.6 8.96C23.6 9.56 24.14 10.05 24.8 10.05C25.46 10.05 26 9.56 26 8.96C26 8.36 25.46 7.87 24.8 7.87C24.14 7.87 23.6 8.36 23.6 8.96",
  "M30.05 6.35H28.27L28.12 8.07C28.49 7.68 29.08 7.57 29.57 7.81C30.06 8.04 30.33 8.57 30.23 9.09C30.12 9.61 29.67 10 29.13 10.05C28.58 10.09 28.07 9.77 27.88 9.27",
];

/** The three digits as one SVG path. */
export const MARK_DIGITS_D = MARK_DIGITS.join("");

/** The digits' stroke width in viewBox units: about a quarter of the stroke of the "A". */
export const MARK_DIGITS_STROKE_WIDTH = 1.1;

/**
 * The box the inked digits fill, in viewBox units. They start clear of the right leg, end where the
 * arm ends (30.6) and stand 0.8 above its top edge (11.4). At 4.8 high they are a fifth of the
 * mark's height: a mark has to be 35px high for them to be 7px.
 */
export const MARK_DIGITS_BOX = { left: 18.8, right: 30.8, top: 5.8, bottom: 10.6 } as const;
