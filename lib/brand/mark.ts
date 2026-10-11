/**
 * The Advanta365 mark: a rounded monoline "A" whose crossbar runs on past the right leg.
 *
 * Pure data, safe to import from workers. This module is the single source of truth for the mark: the SVG
 * (`LogoMark`, `app/icon.svg`) strokes these three segments, and the WebGL chrome symbol builds its signed
 * distance field from the same capsules (distance to segment minus the stroke radius).
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

/** Stroke radius in glyph units (viewBox height = 1). */
export const MARK_RADIUS_NORMALIZED = 2.1 / 24;

/** Half of the glyph box width in glyph units. */
export const MARK_HALF_WIDTH_NORMALIZED = MARK_ASPECT / 2;

function normalizePoint(point: readonly [number, number]): readonly [number, number] {
  return [
    (point[0] - MARK_VIEWBOX.width / 2) / MARK_VIEWBOX.height,
    (MARK_VIEWBOX.height / 2 - point[1]) / MARK_VIEWBOX.height,
  ];
}

/** Segments in glyph units: viewBox height = 1, origin at the viewBox centre, y up. */
export function normalizedMarkSegments(): MarkSegment[] {
  return MARK_SEGMENTS.map((segment) => ({
    a: normalizePoint(segment.a),
    b: normalizePoint(segment.b),
  }));
}
