/**
 * The Advanta365 mark: a rounded monoline "A" whose crossbar runs on past the right leg as a tail,
 * with a "365" standing on the tail.
 *
 * Pure data and the single source of truth for the mark. `LogoMark` strokes it either as one path
 * or as two (the body, and the tail of the crossbar in a second ink), `scripts/gen-icon.mjs` writes
 * `app/icon.svg` from it, and `IntroCover` writes it as three: the tail and the two strokes of the
 * body. The "365" is a fourth part, in a finer pen, for the sizes that can carry it.
 *
 * It comes in two forms on one grid (24 units high, every stroke a capsule of radius 1.9):
 *
 * - full (`MARK_VIEWBOX`, 36 wide): the long tail, with the digits on it, flush with its end.
 * - compact (`MARK_VIEWBOX_COMPACT`, 30 wide): the same "A" and a shorter tail, no digits. It is
 *   the form for a mark under 28px high, where the digits would be a smudge, and for the icon.
 *
 * The ink of either form is centred in its box, 1.7 units clear of the sides and 1.1 of the top
 * and bottom.
 */

export type MarkSegment = {
  readonly a: readonly [number, number];
  readonly b: readonly [number, number];
};

export const MARK_VIEWBOX = { width: 36, height: 24 } as const;
export const MARK_VIEWBOX_COMPACT = { width: 30, height: 24 } as const;

/** Width over height of the full form (3:2) and of the compact form (5:4). */
export const MARK_ASPECT = 36 / 24;
export const MARK_ASPECT_COMPACT = 30 / 24;

/** Stroke width in viewBox units; every stroke is a capsule of radius 1.9. */
export const MARK_STROKE_WIDTH = 3.8;

/**
 * Left leg, right leg, crossbar of the full form, in viewBox units (origin top-left, y down). Both
 * legs lean at 1 across for 2 down, and the crossbar sits just past the middle of their height.
 */
export const MARK_SEGMENTS: readonly [MarkSegment, MarkSegment, MarkSegment] = [
  { a: [3.6, 21], b: [12.6, 3] },
  { a: [12.6, 3], b: [21.6, 21] },
  { a: [7.8, 12.6], b: [32.4, 12.6] },
];

/** Where the crossbar of the compact form ends, in place of 32.4. */
export const MARK_COMPACT_END = 26.4;

/** The compact form as one SVG path (draw with round caps and joins). */
export const MARK_PATH_D = "M3.6 21L12.6 3L21.6 21M7.8 12.6H26.4";

/**
 * The two pen strokes of the "A", in the order a hand writes them: both legs in one stroke, then
 * the crossbar up to the centre line of the right leg. A dash pattern starts again on every
 * subpath, so a drawing that writes the mark stroke by stroke needs them as separate paths.
 */
export const MARK_LEGS_D = "M3.6 21L12.6 3L21.6 21";
export const MARK_BAR_D = "M7.8 12.6H17.4";

/** The "A" alone: both legs and the crossbar up to the centre line of the right leg. */
export const MARK_BODY_D = `${MARK_LEGS_D}${MARK_BAR_D}`;

/**
 * The crossbar's overshoot past the right leg, full and compact. Drawn under the body, so its round
 * start cap is hidden by the leg and the two paths together cover exactly what the whole crossbar
 * covers.
 */
export const MARK_TAIL_D = "M17.4 12.6H32.4";
export const MARK_TAIL_COMPACT_D = "M17.4 12.6H26.4";

/**
 * The "365" that stands on the tail, as the three strokes of a finer pen (round caps and joins, like
 * the "A"): a 3 in two bowls, a 6 that ends where its bowl began, and a 5 with a flat top. Each
 * digit is one open stroke, drawn in the order a hand writes it, in lines and curves only.
 *
 * They are drawn in the ink of the tail and they are for the eye alone: the name beside the mark
 * says "Advanta365". The compact form does without them.
 */
export const MARK_DIGITS: readonly [string, string, string] = [
  "M20.29 4.91C20.51 4.39 21.17 4.09 21.82 4.21C22.47 4.35 22.9 4.86 22.83 5.42C22.75 5.98 22.19 6.4 21.52 6.4C22.29 6.4 22.94 6.88 23.01 7.49C23.08 8.11 22.54 8.67 21.78 8.78C21.02 8.88 20.27 8.51 20.07 7.91",
  "M27.58 4.19C26.09 4.74 25.32 6.22 25.32 7.44C25.32 8.19 25.99 8.8 26.81 8.8C27.63 8.8 28.31 8.19 28.31 7.44C28.31 6.69 27.63 6.08 26.81 6.08C25.99 6.08 25.32 6.69 25.32 7.44",
  "M33.35 4.19H31.13L30.95 6.33C31.41 5.84 32.14 5.71 32.75 6.01C33.36 6.29 33.7 6.95 33.57 7.6C33.44 8.25 32.88 8.73 32.2 8.8C31.52 8.85 30.88 8.45 30.65 7.82",
];

/** The three digits as one SVG path. */
export const MARK_DIGITS_D = MARK_DIGITS.join("");

/** The digits' stroke width in viewBox units: well over a third of the stroke of the "A". */
export const MARK_DIGITS_STROKE_WIDTH = 1.4;

/**
 * The box the inked digits fill, in viewBox units. They start 1.4 clear of the right leg, end where
 * the tail ends (34.3, its centre line 32.4 and its radius 1.9) and stand 1.2 above its top edge
 * (10.7). At 6 high they are a quarter of the mark's height: a mark has to be 28px high for them to
 * be 7px.
 */
export const MARK_DIGITS_BOX = { left: 19.37, right: 34.3, top: 3.48, bottom: 9.5 } as const;
