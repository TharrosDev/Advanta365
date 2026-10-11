const NEWTON_ITERATIONS = 8;
const BISECTION_ITERATIONS = 40;
const TOLERANCE = 1e-6;

/**
 * CSS `cubic-bezier(x1, y1, x2, y2)` as a function of progress: returns the eased value for an
 * input in 0..1 (0 at or below 0, 1 at or above 1).
 *
 * The curve runs from (0, 0) to (1, 1). For a given x the curve parameter is found with Newton's
 * method (8 iterations, tolerance 1e-6) and, if that does not converge or hits a flat spot, by
 * bisection.
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (progress: number) => number {
  // B(s) = ((a * s + b) * s + c) * s for a curve whose end points are 0 and 1.
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const curveX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const curveY = (s: number) => ((ay * s + by) * s + cy) * s;
  const slopeX = (s: number) => (3 * ax * s + 2 * bx) * s + cx;

  function parameterFor(x: number): number {
    let s = x;
    for (let i = 0; i < NEWTON_ITERATIONS; i += 1) {
      const error = curveX(s) - x;
      if (Math.abs(error) < TOLERANCE) return s;
      const slope = slopeX(s);
      if (Math.abs(slope) < TOLERANCE) break;
      s -= error / slope;
    }

    let low = 0;
    let high = 1;
    s = x;
    for (let i = 0; i < BISECTION_ITERATIONS; i += 1) {
      const value = curveX(s);
      if (Math.abs(value - x) < TOLERANCE) return s;
      if (x > value) low = s;
      else high = s;
      s = (low + high) / 2;
    }
    return s;
  }

  return (progress: number) => {
    if (!(progress > 0)) return 0;
    if (progress >= 1) return 1;
    return curveY(parameterFor(progress));
  };
}
