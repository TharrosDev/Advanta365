import { describe, expect, it } from "vitest";
import {
  anchorRect,
  buildZones,
  calmZone,
  capFor,
  EDGE_FEATHER,
  edgeZone,
  mergeNearest,
  parseEdges,
  relativeRect,
  WIDE_FROM,
  type Measured,
} from "@/lib/ink/zones";

// From rectangles on the page to the zones the engine keeps calm: padding, feather, the cap each
// ground gets, the edges, and the merge when a stage marks more than four rectangles.

const RECT = { x: 100, y: 200, width: 400, height: 120 };
const CANVAS = { width: 1440, height: 900 };

describe("a calm rectangle as a zone", () => {
  it("text: padded 24, feather 120, ink kept out, luminance held at 0.80 on paper", () => {
    expect(calmZone({ kind: "text", rect: RECT }, "paper", true)).toEqual({
      x: 76,
      y: 176,
      width: 448,
      height: 168,
      feather: 120,
      floor: 0.04,
      hold: 1,
      fade: 1,
      cap: 0.8,
    });
  });

  it("text on a narrow window: padded 8, feather 56", () => {
    const zone = calmZone({ kind: "text", rect: RECT }, "paper", false);
    expect([zone.x, zone.y, zone.width, zone.height]).toEqual([92, 192, 416, 136]);
    expect(zone.feather).toBe(56);
    expect(zone.cap).toBe(0.8);
  });

  it("display: padded 26, feather 110, ink passes behind, held at 0.30", () => {
    const zone = calmZone({ kind: "display", rect: RECT }, "paper", true);
    expect([zone.x, zone.y, zone.width, zone.height]).toEqual([74, 174, 452, 172]);
    expect(zone).toMatchObject({ feather: 110, floor: 0.42, hold: 0, fade: 0, cap: 0.3 });
    // A narrow window changes text zones only.
    expect(calmZone({ kind: "display", rect: RECT }, "paper", false)).toEqual(zone);
  });

  it("veil: no padding, feather 40, nothing thinned, held at 0.80", () => {
    const zone = calmZone({ kind: "veil", rect: RECT }, "paper", true);
    expect(zone).toMatchObject({ ...RECT, feather: 40, floor: 1, hold: 0, fade: 0, cap: 0.8 });
  });

  it("on the dark ground the cap is a ceiling: 0.06 for text and veil, 0.14 for display", () => {
    expect(capFor("text", "binder")).toBe(0.06);
    expect(capFor("veil", "binder")).toBe(0.06);
    expect(capFor("display", "binder")).toBe(0.14);
    expect(calmZone({ kind: "text", rect: RECT }, "binder", true).cap).toBe(0.06);
    expect(calmZone({ kind: "display", rect: RECT }, "binder", true).cap).toBe(0.14);
  });
});

describe("an edge as a zone", () => {
  it("is a strip that starts outside the canvas and thins the ink to nothing, with no cap", () => {
    for (const edge of ["top", "right", "bottom", "left"] as const) {
      const zone = edgeZone(edge, CANVAS);
      expect(zone).toMatchObject({ feather: EDGE_FEATHER, floor: 0, hold: 0, fade: 1 });
      expect(zone.cap).toBeUndefined();
    }
  });

  it("covers its whole side and reaches a quarter of the feather into the canvas", () => {
    const bottom = edgeZone("bottom", CANVAS);
    expect(bottom.y).toBe(CANVAS.height - EDGE_FEATHER / 4);
    expect(bottom.y + bottom.height).toBeGreaterThan(CANVAS.height);
    expect(bottom.x).toBeLessThan(0);
    expect(bottom.x + bottom.width).toBeGreaterThan(CANVAS.width);

    const top = edgeZone("top", CANVAS);
    expect(top.y).toBeLessThan(0);
    expect(top.y + top.height).toBe(EDGE_FEATHER / 4);

    const left = edgeZone("left", CANVAS);
    expect(left.x + left.width).toBe(EDGE_FEATHER / 4);
    expect(left.y + left.height).toBeGreaterThan(CANVAS.height);

    const right = edgeZone("right", CANVAS);
    expect(right.x).toBe(CANVAS.width - EDGE_FEATHER / 4);
  });

  it("reads the sides from the attribute, ignoring anything else", () => {
    expect(parseEdges("top bottom")).toEqual(["top", "bottom"]);
    expect(parseEdges("  left   bottom ")).toEqual(["left", "bottom"]);
    expect(parseEdges("middle top")).toEqual(["top"]);
    expect(parseEdges(null)).toEqual([]);
  });
});

describe("the zones of a stage", () => {
  const measured = (x: number, kind: Measured["kind"] = "text"): Measured => ({
    kind,
    rect: { x, y: 100, width: 100, height: 50 },
  });

  it("puts the calm rectangles first and the edges after them", () => {
    const zones = buildZones({
      canvas: CANVAS,
      viewportWidth: 1440,
      ground: "paper",
      calm: [measured(0), measured(400, "display")],
      edges: ["bottom", "left"],
    });
    expect(zones).toHaveLength(4);
    expect(zones.map((zone) => zone.cap)).toEqual([0.8, 0.3, undefined, undefined]);
  });

  it("uses the tight text zone under the wide breakpoint", () => {
    const at = (viewportWidth: number) =>
      buildZones({
        canvas: CANVAS,
        viewportWidth,
        ground: "paper",
        calm: [measured(0)],
        edges: [],
      });
    expect(at(WIDE_FROM)[0]?.feather).toBe(120);
    expect(at(WIDE_FROM - 1)[0]?.feather).toBe(56);
  });

  it("never passes more than eight: four calm rectangles and four edges", () => {
    const zones = buildZones({
      canvas: CANVAS,
      viewportWidth: 1440,
      ground: "binder",
      calm: [0, 200, 400, 600, 800, 1000].map((x) => measured(x)),
      edges: ["top", "right", "bottom", "left", "top"],
    });
    expect(zones).toHaveLength(8);
    expect(zones.filter((zone) => zone.cap !== undefined)).toHaveLength(4);
  });

  it("leaves out rectangles of no size", () => {
    const zones = buildZones({
      canvas: CANVAS,
      viewportWidth: 1440,
      ground: "paper",
      calm: [measured(0), { kind: "text", rect: { x: 0, y: 0, width: 0, height: 0 } }],
      edges: [],
    });
    expect(zones).toHaveLength(1);
  });
});

describe("the merge above four", () => {
  const at = (x: number, y = 0, kind: Measured["kind"] = "text"): Measured => ({
    kind,
    rect: { x, y, width: 100, height: 40 },
  });

  it("leaves four or fewer alone", () => {
    const list = [at(0), at(200), at(400), at(600)];
    expect(mergeNearest(list)).toEqual(list);
  });

  it("joins the nearest two into the rectangle around both", () => {
    // The second and third are 10px apart; every other gap is 100px or more.
    const merged = mergeNearest([at(0), at(200), at(310), at(600), at(800)]);
    expect(merged).toHaveLength(4);
    expect(merged.map((m) => m.rect)).toEqual([
      { x: 0, y: 0, width: 100, height: 40 },
      { x: 200, y: 0, width: 210, height: 40 },
      { x: 600, y: 0, width: 100, height: 40 },
      { x: 800, y: 0, width: 100, height: 40 },
    ]);
  });

  it("keeps merging until four are left, and never loses ground", () => {
    const list = [at(0), at(110), at(220), at(600), at(710), at(1200), at(0, 400)];
    const merged = mergeNearest(list);
    expect(merged).toHaveLength(4);
    for (const { rect } of list) {
      const covered = merged.some(
        (m) =>
          m.rect.x <= rect.x &&
          m.rect.y <= rect.y &&
          m.rect.x + m.rect.width >= rect.x + rect.width &&
          m.rect.y + m.rect.height >= rect.y + rect.height,
      );
      expect(covered).toBe(true);
    }
  });

  it("gives a merged pair the stricter kind", () => {
    const merged = mergeNearest([
      at(0, 0, "display"),
      at(105, 0, "text"),
      at(400),
      at(600),
      at(800),
    ]);
    expect(merged[0]?.kind).toBe("text");
  });
});

describe("anchors", () => {
  it("are fractions of the canvas, measured from its corner", () => {
    const origin = { left: 40, top: 100 };
    const rect = relativeRect({ left: 760, top: 190, width: 360, height: 450 }, origin);
    expect(rect).toEqual({ x: 720, y: 90, width: 360, height: 450 });
    expect(anchorRect(rect, CANVAS)).toEqual({ x: 0.5, y: 0.1, width: 0.25, height: 0.5 });
  });
});
