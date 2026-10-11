/**
 * CPU pre-pass for the hero ribbons. The fragment shader never evaluates a curve: it samples three
 * data textures that this module rasterises from `BRANCHES`.
 *
 *   base   RGBA8  W x H    R = feathered union coverage, G = crisp union coverage,
 *                          B = branch tone premultiplied by the feathered coverage, A = 255
 *   meta   RGBA8  W x H    R = branch id byte, G:B = 16-bit arc length along that branch, A = 255
 *   field  float  W/2      "edge field": 0 on a ribbon's ridge rising to 1 at its rims, 1 outside
 *
 * Row 0 is the top of the artwork. The builder is a pure function with an injected rasteriser, so the
 * same code runs in the module worker (OffscreenCanvas) and, cooperatively, on the main thread.
 * Worker-safe: relative imports only, no `window` / `document`.
 *
 * Typed-array reads below carry `!` because `noUncheckedIndexedAccess` types them `number | undefined`;
 * every index is bounded by the loop that produces it.
 */

import {
  BRANCHES,
  REGION,
  STROKE_WIDTH,
  branchTone,
  flattenBranch,
  type Branch,
  type FlatBranch,
} from "./geometry";

export type LiquidMask = {
  base: Uint8Array<ArrayBuffer>;
  meta: Uint8Array<ArrayBuffer>;
  width: number;
  height: number;
  field: Float32Array<ArrayBuffer>;
  fieldWidth: number;
  fieldHeight: number;
};

export type LiquidMaskRequest = { width: number; shadeFloor: number };

export type LiquidMaskOptions = LiquidMaskRequest & {
  /**
   * Cooperative yield for the main-thread build: awaited between the stages of every branch and after
   * every 8 relaxation sweeps. The worker passes nothing and runs straight through.
   */
  pause?: () => Promise<void>;
};

/** Strokes one branch into a `width x height` canvas and returns its alpha channel (0-255 per pixel). */
export type Rasterize = (branch: Branch, width: number, height: number) => Uint8Array;

/** What the worker posts back, exactly once. */
export type MaskWorkerReply =
  { type: "mask"; mask: LiquidMask } | { type: "error"; message: string };

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** Extra pixels around the stroke that still get an arc-length value. */
const ARC_MARGIN = 8;
/** Feather: separable box blur, radius 2 (a 5 x 5 mean). */
const BLUR_RADIUS = 2;
const BLUR_TAPS = (BLUR_RADIUS * 2 + 1) ** 2;
/** Poisson "dome" across each ribbon: red-black successive over-relaxation. */
const SOR_SWEEPS = 40;
const SOR_OMEGA = 1.9;
const SOR_SOURCE = 0.01;
const SOR_SWEEPS_PER_PAUSE = 8;

/** Texture height for a given width (the textures keep REGION's aspect). */
export function maskHeightFor(width: number): number {
  return Math.round((width * REGION.height) / REGION.width);
}

/**
 * Builds a rasteriser on top of a 2-D canvas factory. One context is kept per width (full resolution
 * and half resolution). `release()` frees the backing stores.
 */
export function createRasterizer(
  createContext: (width: number, height: number) => Context2D | null,
): {
  rasterize: Rasterize;
  release: () => void;
} {
  const contexts = new Map<number, Context2D>();

  const rasterize: Rasterize = (branch, width, height) => {
    let context = contexts.get(width);
    if (!context) {
      const created = createContext(width, height);
      if (!created) throw new Error("hero-liquid: no 2D canvas context for the mask");
      contexts.set(width, created);
      context = created;
    }

    const scale = width / REGION.width;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.setTransform(scale, 0, 0, scale, -REGION.x * scale, -REGION.y * scale);
    context.strokeStyle = "#fff";
    context.lineWidth = STROKE_WIDTH;
    context.lineCap = "butt";
    context.beginPath();
    context.moveTo(branch.start[0], branch.start[1]);
    for (const curve of branch.curves) {
      context.bezierCurveTo(
        curve.c1[0],
        curve.c1[1],
        curve.c2[0],
        curve.c2[1],
        curve.end[0],
        curve.end[1],
      );
    }
    context.stroke();

    const pixels = context.getImageData(0, 0, width, height).data;
    const alpha = new Uint8Array(width * height);
    for (let i = 0, source = 3; i < alpha.length; i += 1, source += 4) alpha[i] = pixels[source]!;
    return alpha;
  };

  const release = () => {
    for (const context of contexts.values()) {
      context.canvas.width = 0;
      context.canvas.height = 0;
    }
    contexts.clear();
  };

  return { rasterize, release };
}

/** First and last texture row a branch's stroke can touch (stroke reach plus the arc margin), clamped. */
function strokeRows(
  flat: FlatBranch,
  scale: number,
  height: number,
): [first: number, last: number] {
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < flat.count; i += 1) {
    const y = flat.points[i * 2 + 1]!;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const reach = (STROKE_WIDTH / 2) * scale + ARC_MARGIN;
  const first = Math.max(0, Math.floor((minY - REGION.y) * scale - reach));
  const last = Math.min(height - 1, Math.ceil((maxY - REGION.y) * scale + reach));
  return [first, last];
}

/**
 * For every covered pixel: how far along the branch it sits, 0 (left start) to 65535 (right end).
 * Each polyline segment claims the pixels of its bounding box grown by half the stroke plus 8 px;
 * a pixel keeps the value of its nearest segment. Pixel coordinates are integers, no half-pixel offset.
 */
function writeArcLengths(
  flat: FlatBranch,
  coverage: Uint8Array,
  arc: Uint16Array,
  nearest: Float32Array,
  width: number,
  height: number,
  scale: number,
): void {
  arc.fill(0);
  nearest.fill(Infinity);
  const reach = (STROKE_WIDTH / 2) * scale + ARC_MARGIN;
  const { points, cumulative } = flat;

  for (let k = 1; k < flat.count; k += 1) {
    const ax = (points[k * 2 - 2]! - REGION.x) * scale;
    const ay = (points[k * 2 - 1]! - REGION.y) * scale;
    const bx = (points[k * 2]! - REGION.x) * scale;
    const by = (points[k * 2 + 1]! - REGION.y) * scale;

    const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - reach));
    const x1 = Math.min(width - 1, Math.ceil(Math.max(ax, bx) + reach));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by) - reach));
    const y1 = Math.min(height - 1, Math.ceil(Math.max(ay, by) + reach));
    if (x0 > x1 || y0 > y1) continue;

    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const from = cumulative[k - 1]!;
    const span = cumulative[k]! - from;

    for (let y = y0; y <= y1; y += 1) {
      const py = y - ay;
      let index = y * width + x0;
      for (let x = x0; x <= x1; x += 1, index += 1) {
        // Only covered pixels are ever written to `meta`, so the rest can be skipped.
        if (coverage[index] === 0) continue;
        const px = x - ax;
        let t = lengthSquared > 0 ? (px * dx + py * dy) / lengthSquared : 0;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
        const ex = px - dx * t;
        const ey = py - dy * t;
        const distance = ex * ex + ey * ey;
        if (distance < nearest[index]!) {
          nearest[index] = distance;
          arc[index] = Math.round(((from + span * t) / flat.length) * 65535);
        }
      }
    }
  }
}

/**
 * Feathered coverage: 5 x 5 box blur with clamped borders, rounded to bytes. Only the rows the stroke
 * can reach are processed; everything else is zero.
 */
function featherCoverage(
  coverage: Uint8Array,
  soft: Uint8Array,
  rowSums: Uint16Array,
  width: number,
  height: number,
  firstRow: number,
  lastRow: number,
): void {
  soft.fill(0);
  const lastColumn = width - 1;
  const lastImageRow = height - 1;

  // Horizontal sums for every row the vertical pass will read (two rows beyond the rows it writes).
  const sumsFrom = Math.max(0, firstRow - BLUR_RADIUS * 2);
  const sumsTo = Math.min(lastImageRow, lastRow + BLUR_RADIUS * 2);
  for (let y = sumsFrom; y <= sumsTo; y += 1) {
    const row = y * width;
    let sum = 0;
    for (let tap = -BLUR_RADIUS; tap <= BLUR_RADIUS; tap += 1) {
      sum += coverage[row + Math.min(lastColumn, Math.max(0, tap))]!;
    }
    rowSums[row] = sum;
    for (let x = 1; x < width; x += 1) {
      const entering = coverage[row + Math.min(lastColumn, x + BLUR_RADIUS)]!;
      const leaving = coverage[row + Math.max(0, x - BLUR_RADIUS - 1)]!;
      sum += entering - leaving;
      rowSums[row + x] = sum;
    }
  }

  const softFrom = Math.max(0, firstRow - BLUR_RADIUS);
  const softTo = Math.min(lastImageRow, lastRow + BLUR_RADIUS);
  for (let y = softFrom; y <= softTo; y += 1) {
    const r0 = Math.max(0, y - 2) * width;
    const r1 = Math.max(0, y - 1) * width;
    const r2 = y * width;
    const r3 = Math.min(lastImageRow, y + 1) * width;
    const r4 = Math.min(lastImageRow, y + 2) * width;
    for (let x = 0; x < width; x += 1) {
      const total =
        rowSums[r0 + x]! +
        rowSums[r1 + x]! +
        rowSums[r2 + x]! +
        rowSums[r3 + x]! +
        rowSums[r4 + x]!;
      soft[r2 + x] = Math.round(total / BLUR_TAPS);
    }
  }
}

/**
 * Cross-section field of one branch at half resolution, composited into the shared field.
 * A Poisson problem with zero boundary is relaxed over the stroke's interior; normalised and inverted
 * it is a smooth, roughly parabolic bump: 0 along the centre line, 1 at both walls, rounded at bends.
 */
async function compositeEdgeField(
  coverage: Uint8Array,
  field: Float32Array,
  dome: Float32Array,
  width: number,
  height: number,
  pause: (() => Promise<void>) | undefined,
): Promise<void> {
  dome.fill(0);

  // Interior = not on the image border and the whole 3 x 3 neighbourhood is inside the stroke.
  // (The centre is tested first: most of the image is outside the stroke.)
  const isInterior = (index: number) =>
    coverage[index]! > 127 &&
    coverage[index - width - 1]! > 127 &&
    coverage[index - width]! > 127 &&
    coverage[index - width + 1]! > 127 &&
    coverage[index - 1]! > 127 &&
    coverage[index + 1]! > 127 &&
    coverage[index + width - 1]! > 127 &&
    coverage[index + width]! > 127 &&
    coverage[index + width + 1]! > 127;

  let interiorCount = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1, index = y * width + 1; x < width - 1; x += 1, index += 1) {
      if (isInterior(index)) interiorCount += 1;
    }
  }

  // Red cells ((x + y) even) fill the list from the front, black cells from the back.
  const order = new Int32Array(interiorCount);
  let redCount = 0;
  let blackCursor = interiorCount;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1, index = y * width + 1; x < width - 1; x += 1, index += 1) {
      if (!isInterior(index)) continue;
      if (((x + y) & 1) === 0) {
        order[redCount] = index;
        redCount += 1;
      } else {
        blackCursor -= 1;
        order[blackCursor] = index;
      }
    }
  }

  const keep = SOR_OMEGA - 1;
  const relax = (from: number, to: number) => {
    for (let i = from; i < to; i += 1) {
      const index = order[i]!;
      const neighbours =
        dome[index - 1]! + dome[index + 1]! + dome[index - width]! + dome[index + width]!;
      dome[index] = SOR_OMEGA * ((SOR_SOURCE + neighbours) / 4) - keep * dome[index]!;
    }
  };

  for (let sweep = 1; sweep <= SOR_SWEEPS; sweep += 1) {
    relax(0, redCount);
    relax(redCount, interiorCount);
    if (pause && sweep % SOR_SWEEPS_PER_PAUSE === 0) await pause();
  }

  let peak = 0;
  for (let i = 0; i < interiorCount; i += 1) {
    const value = dome[order[i]!]!;
    if (value > peak) peak = value;
  }
  const normalise = peak > 0 ? 1 / peak : 0;

  for (let index = 0; index < coverage.length; index += 1) {
    const amount = coverage[index]!;
    if (amount === 0) continue;
    const alpha = amount / 255;
    const profile = amount > 127 ? 1 - dome[index]! * normalise : 1;
    field[index] = profile * alpha + field[index]! * (1 - alpha);
  }
}

/**
 * Rasterises the four ribbons into the three mask textures. Later branches composite over earlier
 * ones, so branch 3 is on top wherever ribbons overlap, including the shared trunk.
 */
export async function buildLiquidMask(
  { width, shadeFloor, pause }: LiquidMaskOptions,
  rasterize: Rasterize,
): Promise<LiquidMask> {
  const height = maskHeightFor(width);
  const fieldWidth = Math.round(width / 2);
  const fieldHeight = maskHeightFor(fieldWidth);
  const pixelCount = width * height;
  const scale = width / REGION.width;

  const base = new Uint8Array(pixelCount * 4);
  const meta = new Uint8Array(pixelCount * 4);
  for (let alpha = 3; alpha < base.length; alpha += 4) {
    base[alpha] = 255;
    meta[alpha] = 255;
  }
  const field = new Float32Array(fieldWidth * fieldHeight).fill(1);

  // Scratch buffers, reused by every branch.
  const arc = new Uint16Array(pixelCount);
  const nearest = new Float32Array(pixelCount);
  const soft = new Uint8Array(pixelCount);
  const rowSums = new Uint16Array(pixelCount);
  const dome = new Float32Array(fieldWidth * fieldHeight);

  for (let n = 0; n < BRANCHES.length; n += 1) {
    const branch = BRANCHES[n];
    if (!branch) continue;
    const flat = flattenBranch(branch);
    const [firstRow, lastRow] = strokeRows(flat, scale, height);

    const coverage = rasterize(branch, width, height);
    if (pause) await pause();

    writeArcLengths(flat, coverage, arc, nearest, width, height, scale);
    if (pause) await pause();

    featherCoverage(coverage, soft, rowSums, width, height, firstRow, lastRow);
    if (pause) await pause();

    const halfCoverage = rasterize(branch, fieldWidth, fieldHeight);
    await compositeEdgeField(halfCoverage, field, dome, fieldWidth, fieldHeight, pause);

    const id = Math.round(((n + 0.5) * 255) / BRANCHES.length);
    const tone = Math.round(255 * branchTone(branch.gray, shadeFloor));
    const from = Math.max(0, firstRow - BLUR_RADIUS) * width;
    const to = (Math.min(height - 1, lastRow + BLUR_RADIUS) + 1) * width;
    for (let index = from; index < to; index += 1) {
      const crisp = coverage[index]!;
      const feathered = soft[index]!;
      if (crisp === 0 && feathered === 0) continue;
      const alpha = feathered / 255;
      const offset = index * 4;
      base[offset] = Math.round(feathered + base[offset]! * (1 - alpha));
      base[offset + 1] = Math.round(crisp + base[offset + 1]! * (1 - crisp / 255));
      base[offset + 2] = Math.round(tone * alpha + base[offset + 2]! * (1 - alpha));
      if (crisp > 0) {
        const along = arc[index]!;
        meta[offset] = id;
        meta[offset + 1] = along >> 8;
        meta[offset + 2] = along & 255;
      }
    }
    if (pause) await pause();
  }

  return { base, meta, width, height, field, fieldWidth, fieldHeight };
}
