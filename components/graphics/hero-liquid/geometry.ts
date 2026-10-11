/**
 * Geometry of the hero ribbons: one thick trunk that enters from the left edge at 62% of the hero
 * height and fans into four ribbons leaving the right edge.
 *
 * Pure data and maths, no DOM access: this module is shared by the SVG fallback, the CPU mask
 * builder (main thread and worker) and the WebGL renderer. The curves are Advanta365's own drawing;
 * to change the artwork edit `BRANCHES` only, everything downstream follows.
 */

export type Point = readonly [x: number, y: number];

/** One cubic Bezier segment, continuing from the previous end point. */
export type Cubic = { readonly c1: Point; readonly c2: Point; readonly end: Point };

export type Branch = {
  readonly start: Point;
  /** Segment 1 runs along the trunk (it ends where the ribbon leaves it), segment 2 is the fan. */
  readonly curves: readonly [Cubic, Cubic];
  /** Tone key, 0..1 (a 0-255 grey divided by 255). See `branchTone`. */
  readonly gray: number;
};

/** The artwork is authored in this box (SVG user units). */
export const VIEWBOX_WIDTH = 1440;
export const VIEWBOX_HEIGHT = 810;
/** The canvas is this much taller than the hero, so the lowest ribbon can run out under the next section. */
export const OVERFLOW_SCALE = 1.25;
/** Narrowest canvas aspect that still shows the whole width; narrower canvases are centre-cropped. */
export const CROP_ASPECT = 1;
/** Ribbon thickness in viewBox units (butt caps). */
export const STROKE_WIDTH = 150;
/**
 * The viewBox-space rectangle the mask textures cover: the visible 1440 x 1012.5 area plus 90 units
 * on every side, which keeps blur taps, bicubic taps and clamped texture edges out of view.
 */
export const REGION = { x: -90, y: -90, width: 1620, height: 1192.5 } as const;
/** Centre line of the shared trunk: 62% of the hero height. */
export const TRUNK_Y = 502;
/** Uniform-parameter steps per cubic when a branch is flattened into a polyline. */
export const SAMPLES_PER_CUBIC = 48;

const START: Point = [-260, TRUNK_Y];
const EXIT_X = 1680;

/**
 * Index = paint order: later branches composite over earlier ones, so branch 3 owns the trunk.
 * Branch 3 peels off first and sweeps down into the 25% overflow, branch 1 climbs out through the
 * top right, branches 2 and 0 split last (2 rises, 0 dips).
 */
export const BRANCHES: readonly [Branch, Branch, Branch, Branch] = [
  {
    start: START,
    curves: [
      { c1: START, c2: [360, TRUNK_Y], end: [840, TRUNK_Y] },
      { c1: [1250, TRUNK_Y], c2: [1210, 745], end: [EXIT_X, 745] },
    ],
    gray: 32 / 255,
  },
  {
    start: START,
    curves: [
      { c1: START, c2: [140, TRUNK_Y], end: [600, TRUNK_Y] },
      { c1: [1030, TRUNK_Y], c2: [1240, -110], end: [EXIT_X, -110] },
    ],
    gray: 132 / 255,
  },
  {
    start: START,
    curves: [
      { c1: START, c2: [360, TRUNK_Y], end: [840, TRUNK_Y] },
      { c1: [1250, TRUNK_Y], c2: [1210, 215], end: [EXIT_X, 215] },
    ],
    gray: 56 / 255,
  },
  {
    start: START,
    curves: [
      { c1: START, c2: [-200, TRUNK_Y], end: [230, TRUNK_Y] },
      { c1: [840, TRUNK_Y], c2: [770, 965], end: [EXIT_X, 965] },
    ],
    gray: 0,
  },
];

export const BRANCH_COUNT = BRANCHES.length;

/** The largest tone key among the branches. */
export const MAX_GRAY = 132 / 255;

export type FlatBranch = {
  /** Number of polyline points: 2 * SAMPLES_PER_CUBIC + 1 = 97. */
  readonly count: number;
  /** Interleaved x, y in viewBox units; length = 2 * count. */
  readonly points: Float64Array;
  /** Chord length from the start to each point; `cumulative[0]` is 0. */
  readonly cumulative: Float64Array;
  /** Total chord length of the polyline. */
  readonly length: number;
};

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/** Flattens a branch into 97 points (48 uniform-t steps per cubic) with cumulative chord lengths. */
export function flattenBranch(branch: Branch): FlatBranch {
  const count = branch.curves.length * SAMPLES_PER_CUBIC + 1;
  const points = new Float64Array(count * 2);
  const cumulative = new Float64Array(count);

  let fromX = branch.start[0];
  let fromY = branch.start[1];
  let previousX = fromX;
  let previousY = fromY;
  let travelled = 0;
  let index = 0;

  points[0] = fromX;
  points[1] = fromY;

  for (const curve of branch.curves) {
    for (let step = 1; step <= SAMPLES_PER_CUBIC; step += 1) {
      const t = step / SAMPLES_PER_CUBIC;
      const x = cubicAt(fromX, curve.c1[0], curve.c2[0], curve.end[0], t);
      const y = cubicAt(fromY, curve.c1[1], curve.c2[1], curve.end[1], t);
      travelled += Math.hypot(x - previousX, y - previousY);
      index += 1;
      points[index * 2] = x;
      points[index * 2 + 1] = y;
      cumulative[index] = travelled;
      previousX = x;
      previousY = y;
    }
    fromX = curve.end[0];
    fromY = curve.end[1];
  }

  return { count, points, cumulative, length: travelled };
}

/**
 * Compresses a branch's tone key into the range the shader shades from: `gray = MAX_GRAY` always
 * maps to MAX_GRAY, `gray = 0` maps to `shadeFloor`. A higher floor makes the four ribbons more
 * alike (the home page uses 0.6: tones 0.580, 0.518, 0.565, 0.600).
 */
export function branchTone(gray: number, shadeFloor: number): number {
  return shadeFloor + (gray / MAX_GRAY) * (MAX_GRAY - shadeFloor);
}

function formatPoint(point: Point): string {
  return `${point[0]} ${point[1]}`;
}

/** SVG path data (`M P0 C c1 c2 P1 C c3 c4 P2`) of one branch, for the fallback `<path>` and `Path2D`. */
export function branchPathD(index: number): string {
  const branch = BRANCHES[index];
  if (!branch) throw new RangeError(`hero-liquid: no branch ${index}`);
  const curves = branch.curves
    .map((curve) => `C${formatPoint(curve.c1)} ${formatPoint(curve.c2)} ${formatPoint(curve.end)}`)
    .join("");
  return `M${formatPoint(branch.start)}${curves}`;
}
