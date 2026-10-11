/**
 * The Advanta365 mark: a rounded monoline "A" whose crossbar runs on past the right leg.
 *
 * Pure data and the single source of truth for the mark. `LogoMark` strokes it either as one path
 * or as two (the body, and the tail of the crossbar in a second ink), and `app/icon.svg` repeats the
 * two-path form. `IntroCover` writes it as three: the tail and the two strokes of the body.
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
