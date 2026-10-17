/**
 * The Advanta365 mark: an "A" made of one strip folded at its peak, in two halves that meet on a
 * vertical seam. The left half is the arm that climbs, the right half the leg that comes down.
 *
 * Pure data and the single source of truth for the mark. `LogoMark` fills it either as one shape or
 * as two (the right half in a second ink), `scripts/gen-icon.mjs` writes `app/icon.svg` from it,
 * and `IntroCover` draws the two halves one after the other.
 *
 * One form on one grid (`MARK_VIEWBOX`, 48 by 44): both legs lean at 11 across for 40 down, the
 * peak is a flat top 10 wide, and the ink is centred in its box, 2 units clear of every side.
 */

export const MARK_VIEWBOX = { width: 48, height: 44 } as const;

/** Width over height of the view box. */
export const MARK_ASPECT = 48 / 44;

/** Where the two halves meet: the centre line of the peak. */
export const MARK_SEAM_X = 24;

/**
 * The left half, the arm: its foot, up the outside to the peak, down the seam to the inside corner
 * where the two legs part, and back to the foot. Filled, with no stroke.
 */
export const MARK_INK_D = "M2 42H13L24 14.5V2H19Z";

/**
 * The right half, the leg that drops: from the seam down the outside of the right leg to its foot.
 * Its left edge runs half a unit under the arm, so that no hairline shows on the seam where two
 * shapes of the same colour would meet; the arm is drawn over it.
 */
export const MARK_HUE_D = "M23.5 2H29L46 42H35L23.5 13.25Z";

/** The whole "A" as one shape, for one ink. */
export const MARK_PATH_D = "M2 42H13L24 14.5L35 42H46L29 2H19Z";
