import type { Ground } from "./stage";
import type { Rect, Zone } from "./types";

/**
 * From rectangles measured on the page to the calm zones and anchors the engine takes. Pure: the
 * layer measures, this file decides.
 *
 * A calm zone keeps ink away from words. Besides thinning and slowing the ink it carries a cap:
 * the relative luminance the canvas may not cross under it, which is what makes the contrast of
 * the text above a guarantee instead of a likelihood.
 */

export type CalmKind = "text" | "display" | "veil";
export type Edge = "top" | "right" | "bottom" | "left";

export function isCalmKind(value: unknown): value is CalmKind {
  return value === "text" || value === "display" || value === "veil";
}

type CalmSpec = {
  pad: number;
  feather: number;
  floor: number;
  hold: number;
  fade: number;
  cap: Record<Ground, number>;
};

/** The breakpoint from which a text zone gets its full padding and feather, in CSS pixels. */
export const WIDE_FROM = 1088;

const CALM: Record<CalmKind, CalmSpec> = {
  // Copy, leads, notes, controls: ink is kept out.
  text: { pad: 24, feather: 120, floor: 0.04, hold: 1, fade: 1, cap: { paper: 0.8, binder: 0.06 } },
  // Headings of 32px and more: ink passes behind.
  display: {
    pad: 26,
    feather: 110,
    floor: 0.42,
    hold: 0,
    fade: 0,
    cap: { paper: 0.3, binder: 0.14 },
  },
  // The footer grid: wisps pass behind, capped.
  veil: { pad: 0, feather: 40, floor: 1, hold: 0, fade: 0, cap: { paper: 0.8, binder: 0.06 } },
};

/** A text zone on a narrow window: there is no room for a wide margin. */
const TEXT_NARROW = { pad: 8, feather: 56 };

/** How strict a kind is: when two zones merge, the stricter one names the result. */
const STRICT: Record<CalmKind, number> = { text: 2, veil: 1, display: 0 };

export const EDGE_FEATHER = 96;
/** How far inside the canvas an edge strip reaches: there the ink is gone altogether. */
const EDGE_INSET = EDGE_FEATHER / 4;
const EDGE_OUTSET = 200;

export const MAX_TEXT_ZONES = 4;
export const MAX_EDGES = 4;

export type Measured = { kind: CalmKind; rect: Rect };

export type ZoneInput = {
  /** The canvas's size in CSS pixels. */
  canvas: { width: number; height: number };
  /** The window's width in CSS pixels: under `WIDE_FROM` text zones are tighter. */
  viewportWidth: number;
  ground: Ground;
  /** The `[data-ink-calm]` rectangles, in CSS pixels from the canvas's top-left corner. */
  calm: readonly Measured[];
  edges: readonly Edge[];
};

/** One calm rectangle as a zone: padded, feathered, capped for its ground. */
export function calmZone(measured: Measured, ground: Ground, wide: boolean): Zone {
  const spec = CALM[measured.kind];
  const tight = measured.kind === "text" && !wide;
  const pad = tight ? TEXT_NARROW.pad : spec.pad;
  const { x, y, width, height } = measured.rect;
  return {
    x: x - pad,
    y: y - pad,
    width: width + 2 * pad,
    height: height + 2 * pad,
    feather: tight ? TEXT_NARROW.feather : spec.feather,
    floor: spec.floor,
    hold: spec.hold,
    fade: spec.fade,
    cap: spec.cap[ground],
  };
}

/**
 * A side of the canvas where ink must thin to nothing before the canvas ends: a strip that starts
 * outside the canvas and reaches a little way in, with a wide feather and no cap.
 */
export function edgeZone(edge: Edge, canvas: { width: number; height: number }): Zone {
  const { width, height } = canvas;
  const span = EDGE_OUTSET + EDGE_INSET;
  const strip: Record<Edge, Rect> = {
    top: { x: -EDGE_OUTSET, y: -EDGE_OUTSET, width: width + 2 * EDGE_OUTSET, height: span },
    bottom: {
      x: -EDGE_OUTSET,
      y: height - EDGE_INSET,
      width: width + 2 * EDGE_OUTSET,
      height: span,
    },
    left: { x: -EDGE_OUTSET, y: -EDGE_OUTSET, width: span, height: height + 2 * EDGE_OUTSET },
    right: {
      x: width - EDGE_INSET,
      y: -EDGE_OUTSET,
      width: span,
      height: height + 2 * EDGE_OUTSET,
    },
  };
  return { ...strip[edge], feather: EDGE_FEATHER, floor: 0, hold: 0, fade: 1 };
}

/** The gap between two rectangles: 0 when they touch or overlap. */
function gap(a: Rect, b: Rect): number {
  const dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width));
  const dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height));
  return Math.hypot(dx, dy);
}

function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

/** Merges the nearest two rectangles, again and again, until no more than `max` are left. */
export function mergeNearest(measured: readonly Measured[], max = MAX_TEXT_ZONES): Measured[] {
  const list = [...measured];
  while (list.length > max) {
    let pair: [number, number] = [0, 1];
    let nearest = Infinity;
    list.forEach((a, i) => {
      list.slice(i + 1).forEach((b, offset) => {
        const distance = gap(a.rect, b.rect);
        if (distance < nearest) {
          nearest = distance;
          pair = [i, i + 1 + offset];
        }
      });
    });
    const a = list[pair[0]];
    const b = list[pair[1]];
    if (!a || !b) break;
    const kind = STRICT[a.kind] >= STRICT[b.kind] ? a.kind : b.kind;
    list.splice(pair[1], 1);
    list[pair[0]] = { kind, rect: union(a.rect, b.rect) };
  }
  return list;
}

/** Every zone of a stage: at most four calm rectangles, then at most four edges. */
export function buildZones(input: ZoneInput): Zone[] {
  const wide = input.viewportWidth >= WIDE_FROM;
  const shown = input.calm.filter(({ rect }) => rect.width > 0 && rect.height > 0);
  const calm = mergeNearest(shown).map((measured) => calmZone(measured, input.ground, wide));
  const edges = [...new Set(input.edges)]
    .slice(0, MAX_EDGES)
    .map((edge) => edgeZone(edge, input.canvas));
  return [...calm, ...edges];
}

/** The sides named in a `data-edges` attribute. */
export function parseEdges(value: string | null | undefined): Edge[] {
  return (value ?? "")
    .split(/\s+/)
    .filter(
      (word): word is Edge =>
        word === "top" || word === "right" || word === "bottom" || word === "left",
    );
}

/** A rectangle in CSS pixels from the canvas's corner, as fractions of the canvas. */
export function anchorRect(rect: Rect, canvas: { width: number; height: number }): Rect {
  const w = canvas.width || 1;
  const h = canvas.height || 1;
  return { x: rect.x / w, y: rect.y / h, width: rect.width / w, height: rect.height / h };
}

/** A viewport rectangle relative to another one's top-left corner. */
export function relativeRect(
  rect: { left: number; top: number; width: number; height: number },
  origin: { left: number; top: number },
): Rect {
  return {
    x: rect.left - origin.left,
    y: rect.top - origin.top,
    width: rect.width,
    height: rect.height,
  };
}

/** The cap a kind of zone promises on a ground. */
export function capFor(kind: CalmKind, ground: Ground): number {
  return CALM[kind].cap[ground];
}
