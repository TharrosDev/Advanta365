import { describe, expect, test } from "vitest";

import {
  BRANCHES,
  BRANCH_COUNT,
  MAX_GRAY,
  REGION,
  STROKE_WIDTH,
  TRUNK_Y,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  branchPathD,
  branchTone,
  flattenBranch,
  type Branch,
} from "@/components/graphics/hero-liquid/geometry";
import {
  buildLiquidMask,
  maskHeightFor,
  type LiquidMask,
  type Rasterize,
} from "@/components/graphics/hero-liquid/mask";

/** Where the reference artwork leaves its trunk (x) and exits (y). Ours must stay clear of both. */
const REFERENCE_SPLIT_X = [749, 505, 749, 145];
const REFERENCE_EXIT_Y = [693, -52, 260, 924];

const toneByte = (gray: number, shadeFloor: number) =>
  Math.round(255 * branchTone(gray, shadeFloor));

describe("hero ribbon geometry", () => {
  test("the art box, stroke and texture region are the agreed constants", () => {
    expect([VIEWBOX_WIDTH, VIEWBOX_HEIGHT]).toEqual([1440, 810]);
    expect(STROKE_WIDTH).toBe(150);
    expect(REGION).toEqual({ x: -90, y: -90, width: 1620, height: 1192.5 });
    expect(TRUNK_Y / VIEWBOX_HEIGHT).toBeCloseTo(0.62, 2);
    expect(BRANCH_COUNT).toBe(4);
    expect(BRANCHES.map((branch) => Math.round(branch.gray * 255))).toEqual([32, 132, 56, 0]);
    expect(MAX_GRAY).toBe(Math.max(...BRANCHES.map((branch) => branch.gray)));
  });

  test("every branch flattens to 97 points with strictly increasing lengths", () => {
    for (const branch of BRANCHES) {
      const flat = flattenBranch(branch);
      expect(flat.count).toBe(97);
      expect(flat.points).toHaveLength(194);
      expect(flat.cumulative).toHaveLength(97);
      expect(flat.cumulative[0]).toBe(0);
      for (let i = 1; i < flat.count; i += 1) {
        expect(flat.cumulative[i]).toBeGreaterThan(flat.cumulative[i - 1] ?? Infinity);
      }
      expect(flat.cumulative[96]).toBe(flat.length);
      expect(flat.length).toBeGreaterThan(1850);
      expect(flat.length).toBeLessThan(2250);

      expect([flat.points[0], flat.points[1]]).toEqual([...branch.start]);
      expect([flat.points[192], flat.points[193]]).toEqual([...branch.curves[1].end]);
    }
  });

  test("the flattened lengths are the documented ones", () => {
    const lengths = BRANCHES.map((branch) => Math.round(flattenBranch(branch).length));
    expect(lengths).toEqual([1989, 2135, 2007, 2043]);
  });

  test("one trunk fans into four ribbons that leave the right edge", () => {
    const [first] = BRANCHES;
    for (const branch of BRANCHES) {
      // Shared start, off-canvas on the left, on the trunk line.
      expect(branch.start).toEqual(first.start);
      expect(branch.start[0]).toBeLessThan(-STROKE_WIDTH);
      expect(branch.start[1]).toBe(TRUNK_Y);

      // Segment 1 is a straight run along the trunk: every control point sits on the trunk line.
      const [trunk, fan] = branch.curves;
      expect([trunk.c1[1], trunk.c2[1], trunk.end[1], fan.c1[1]]).toEqual([
        TRUNK_Y,
        TRUNK_Y,
        TRUNK_Y,
        TRUNK_Y,
      ]);

      // The exit is off-canvas on the right and arrives horizontally.
      expect(fan.end[0]).toBeGreaterThan(VIEWBOX_WIDTH + STROKE_WIDTH);
      expect(fan.c2[1]).toBe(fan.end[1]);
    }

    // Peel order 3 -> 1 -> 2 / 0, as the composition asks.
    const splits = BRANCHES.map((branch) => branch.curves[0].end[0]);
    expect(splits[3]).toBeLessThan(splits[1] ?? -Infinity);
    expect(splits[1]).toBeLessThan(splits[2] ?? -Infinity);
    expect(splits[2]).toBe(splits[0]);

    // Four distinct exit heights; the lowest one is only visible in the 25% overflow.
    const exits = BRANCHES.map((branch) => branch.curves[1].end[1]);
    expect(new Set(exits).size).toBe(4);
    expect(exits[3]).toBeGreaterThan(VIEWBOX_HEIGHT);
    expect(exits[3]).toBeLessThan(VIEWBOX_HEIGHT * 1.25);
  });

  test("the drawing is our own: split points and exits stay clear of the reference artwork", () => {
    BRANCHES.forEach((branch, index) => {
      const splitX = branch.curves[0].end[0];
      const exitY = branch.curves[1].end[1];
      expect(Math.abs(splitX - (REFERENCE_SPLIT_X[index] ?? NaN))).toBeGreaterThanOrEqual(40);
      expect(Math.abs(exitY - (REFERENCE_EXIT_Y[index] ?? NaN))).toBeGreaterThanOrEqual(40);
    });
  });

  test("branchTone compresses the tone keys toward the shade floor", () => {
    expect(branchTone(132 / 255, 0.6)).toBeCloseTo(132 / 255, 10);
    expect(branchTone(0, 0.6)).toBeCloseTo(0.6, 10);
    // Home page (shadeFloor 0.6): four nearly identical pale tones.
    expect(BRANCHES.map((branch) => toneByte(branch.gray, 0.6))).toEqual([148, 132, 144, 153]);
    // Component default (0.35): more contrast between the ribbons.
    expect(BRANCHES.map((branch) => toneByte(branch.gray, 0.35))).toEqual([100, 132, 107, 89]);
  });

  test("branchPathD writes the two cubics of each branch", () => {
    expect(branchPathD(0)).toBe("M-260 502C-260 502 360 502 840 502C1250 502 1210 745 1680 745");
    expect(branchPathD(3)).toBe("M-260 502C-260 502 -200 502 230 502C840 502 770 965 1680 965");
    for (let index = 0; index < BRANCH_COUNT; index += 1) {
      expect(branchPathD(index)).toMatch(/^M[^MC]+C[^MC]+C[^MC]+$/);
    }
    expect(() => branchPathD(4)).toThrow(RangeError);
  });
});

/**
 * A canvas-free stand-in for the 2-D rasteriser: anti-aliased coverage from the distance between
 * each pixel centre and the flattened centre line.
 */
const softwareRasterize: Rasterize = (branch: Branch, width: number, height: number) => {
  const flat = flattenBranch(branch);
  const scale = width / REGION.width;
  const half = STROKE_WIDTH / 2;
  const alpha = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const vy = (y + 0.5) / scale + REGION.y;
    for (let x = 0; x < width; x += 1) {
      const vx = (x + 0.5) / scale + REGION.x;
      let best = Infinity;
      for (let k = 1; k < flat.count; k += 1) {
        const ax = flat.points[k * 2 - 2] ?? 0;
        const ay = flat.points[k * 2 - 1] ?? 0;
        const dx = (flat.points[k * 2] ?? 0) - ax;
        const dy = (flat.points[k * 2 + 1] ?? 0) - ay;
        const t = Math.min(1, Math.max(0, ((vx - ax) * dx + (vy - ay) * dy) / (dx * dx + dy * dy)));
        const distance = Math.hypot(vx - ax - dx * t, vy - ay - dy * t);
        if (distance < best) best = distance;
      }
      const coverage = Math.min(1, Math.max(0, (half - best) * scale + 0.5));
      alpha[y * width + x] = Math.round(coverage * 255);
    }
  }
  return alpha;
};

describe("hero ribbon mask", () => {
  const WIDTH = 192;
  const scale = WIDTH / REGION.width;
  // One straight-through build at the home page's shade floor, shared by the tests below.
  let shared: Promise<LiquidMask> | undefined;
  const homeMask = () =>
    (shared ??= buildLiquidMask({ width: WIDTH, shadeFloor: 0.6 }, softwareRasterize));
  const pixelIndex = (mask: LiquidMask, vx: number, vy: number) =>
    Math.floor((vy - REGION.y) * scale) * mask.width + Math.floor((vx - REGION.x) * scale);
  const fieldAt = (mask: LiquidMask, vx: number, vy: number) => {
    const fieldScale = mask.fieldWidth / REGION.width;
    const index =
      Math.floor((vy - REGION.y) * fieldScale) * mask.fieldWidth +
      Math.floor((vx - REGION.x) * fieldScale);
    return mask.field[index] ?? NaN;
  };
  const arcAt = (mask: LiquidMask, vx: number, vy: number) => {
    const offset = pixelIndex(mask, vx, vy) * 4;
    return ((mask.meta[offset + 1] ?? 0) * 256 + (mask.meta[offset + 2] ?? 0)) / 65535;
  };

  test("builds the three textures at the documented sizes", async () => {
    const mask = await homeMask();
    expect(maskHeightFor(2048)).toBe(1508);
    expect(maskHeightFor(1024)).toBe(754);
    expect([mask.width, mask.height]).toEqual([WIDTH, maskHeightFor(WIDTH)]);
    expect([mask.fieldWidth, mask.fieldHeight]).toEqual([WIDTH / 2, maskHeightFor(WIDTH / 2)]);
    expect(mask.base).toHaveLength(mask.width * mask.height * 4);
    expect(mask.meta).toHaveLength(mask.width * mask.height * 4);
    expect(mask.field).toHaveLength(mask.fieldWidth * mask.fieldHeight);
    for (let alpha = 3; alpha < mask.base.length; alpha += 4) {
      expect(mask.base[alpha]).toBe(255);
      expect(mask.meta[alpha]).toBe(255);
    }
  });

  test("coverage, tone, branch id and arc length follow the compositing rules", async () => {
    const mask = await homeMask();

    // Only the four id bytes (and 0 for "no ribbon") ever appear.
    const ids = new Set<number>();
    for (let offset = 0; offset < mask.meta.length; offset += 4) ids.add(mask.meta[offset] ?? -1);
    expect([...ids].sort((a, b) => a - b)).toEqual([0, 32, 96, 159, 223]);

    // Empty corner: nothing written.
    const empty = pixelIndex(mask, 100, 100) * 4;
    expect([mask.base[empty], mask.base[empty + 1], mask.base[empty + 2]]).toEqual([0, 0, 0]);
    expect(mask.meta[empty]).toBe(0);

    // The trunk belongs to branch 3 (painted last): full coverage, its tone, its id.
    const trunk = pixelIndex(mask, 0, TRUNK_Y) * 4;
    expect([mask.base[trunk], mask.base[trunk + 1]]).toEqual([255, 255]);
    expect(mask.base[trunk + 2]).toBe(toneByte(0, 0.6));
    expect(mask.meta[trunk]).toBe(223);

    // Arc length grows left to right; the visible left edge sits about 13% along branch 3.
    const total = flattenBranch(BRANCHES[3]).length;
    expect(arcAt(mask, 0, TRUNK_Y)).toBeCloseTo(260 / total, 2);
    expect(arcAt(mask, 100, TRUNK_Y)).toBeGreaterThan(arcAt(mask, 0, TRUNK_Y));
    expect(arcAt(mask, 200, TRUNK_Y)).toBeGreaterThan(arcAt(mask, 100, TRUNK_Y));

    // Far along branch 1, where it runs alone: its own id and tone.
    const upper = flattenBranch(BRANCHES[1]);
    const sample = 48 + 34;
    const upperX = upper.points[sample * 2] ?? 0;
    const upperY = upper.points[sample * 2 + 1] ?? 0;
    expect(upperX).toBeGreaterThan(1200);
    const alone = pixelIndex(mask, upperX, upperY) * 4;
    expect(mask.meta[alone]).toBe(96);
    expect(mask.base[alone + 2]).toBe(132);
    expect(arcAt(mask, upperX, upperY)).toBeCloseTo(
      (upper.cumulative[sample] ?? 0) / upper.length,
      2,
    );
  });

  test("the edge field is 0 on a ridge, rises toward the rims and is 1 outside", async () => {
    const mask = await homeMask();
    for (const value of mask.field) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(fieldAt(mask, 100, 100)).toBe(1);
    const ridge = fieldAt(mask, 0, TRUNK_Y);
    const shoulder = fieldAt(mask, 0, TRUNK_Y + STROKE_WIDTH * 0.3);
    // (At this tiny test resolution the ridge is only a few texels wide, hence the loose bound.)
    expect(ridge).toBeLessThan(0.25);
    expect(shoulder).toBeGreaterThan(ridge + 0.1);
    expect(shoulder).toBeLessThan(1);
  });

  test("the cooperative build yields between stages and gives the same result", async () => {
    let pauses = 0;
    const pause = () => {
      pauses += 1;
      return Promise.resolve();
    };
    const cooperative = await buildLiquidMask(
      { width: WIDTH, shadeFloor: 0.6, pause },
      softwareRasterize,
    );
    const straight = await homeMask();

    // Per branch: after coverage, the arc map and the blur, plus once per 8 of the 40 sweeps.
    expect(pauses).toBeGreaterThanOrEqual(BRANCH_COUNT * (3 + 5));
    expect(cooperative.base).toEqual(straight.base);
    expect(cooperative.meta).toEqual(straight.meta);
    expect(cooperative.field).toEqual(straight.field);
  });
});
