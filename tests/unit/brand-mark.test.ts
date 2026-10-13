import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LogoMark } from "@/components/ui/logo-mark";
// @ts-expect-error: a plain script, written in JavaScript, with no types of its own.
import { renderIcon } from "../../scripts/gen-icon.mjs";
import {
  MARK_ASPECT,
  MARK_ASPECT_COMPACT,
  MARK_BAR_D,
  MARK_BODY_D,
  MARK_COMPACT_END,
  MARK_DIGITS,
  MARK_DIGITS_BOX,
  MARK_DIGITS_D,
  MARK_DIGITS_STROKE_WIDTH,
  MARK_LEGS_D,
  MARK_PATH_D,
  MARK_SEGMENTS,
  MARK_STROKE_WIDTH,
  MARK_TAIL_COMPACT_D,
  MARK_TAIL_D,
  MARK_VIEWBOX,
  MARK_VIEWBOX_COMPACT,
} from "@/lib/brand/mark";

/** Formats a coordinate the way the path data writes it ("20.5", "4"). */
const n = (value: number) => String(value);

/** Where the centre line of a stroke crosses a given height. */
function xAt(stroke: (typeof MARK_SEGMENTS)[number], y: number): number {
  const t = (y - stroke.a[1]) / (stroke.b[1] - stroke.a[1]);
  return stroke.a[0] + t * (stroke.b[0] - stroke.a[0]);
}

type Point = readonly [number, number];

/**
 * The centre line of a path as points: `M`, `L`, `H` and `C` with absolute coordinates, which is
 * all the mark is written in. A curve is walked in 48 steps.
 */
function trace(d: string): Point[] {
  const points: Point[] = [];
  let at: Point = [0, 0];
  for (const [, command = "", rest = ""] of d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    const v = rest.trim()
      ? rest
          .trim()
          .split(/[\s,]+/)
          .map(Number)
      : [];
    const [a = NaN, b = NaN, c = NaN, e = NaN, f = NaN, g = NaN] = v;
    if (v.some(Number.isNaN)) throw new Error(`not a number in "${command}${rest}"`);
    if ((command === "M" || command === "L") && v.length === 2) {
      at = [a, b];
      points.push(at);
    } else if (command === "H" && v.length === 1) {
      at = [a, at[1]];
      points.push(at);
    } else if (command === "C" && v.length === 6) {
      const from = at;
      for (let step = 1; step <= 48; step++) {
        const t = step / 48;
        const u = 1 - t;
        const mix = (p0: number, p1: number, p2: number, p3: number) =>
          u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
        points.push([mix(from[0], a, c, f), mix(from[1], b, e, g)]);
      }
      at = [f, g];
    } else {
      throw new Error(`cannot read "${command}${rest}"`);
    }
  }
  return points;
}

/** The distance from a point to the centre line of a stroke of the "A". */
function distance(point: Point, stroke: (typeof MARK_SEGMENTS)[number]): number {
  const [ax, ay] = stroke.a;
  const [bx, by] = stroke.b;
  const length = (bx - ax) ** 2 + (by - ay) ** 2;
  const along = ((point[0] - ax) * (bx - ax) + (point[1] - ay) * (by - ay)) / length;
  const t = Math.max(0, Math.min(1, along));
  return Math.hypot(point[0] - (ax + t * (bx - ax)), point[1] - (ay + t * (by - ay)));
}

describe("brand mark geometry", () => {
  it("is three strokes with the designed coordinates", () => {
    expect(MARK_SEGMENTS).toHaveLength(3);
    const [legOne, legTwo, bar] = MARK_SEGMENTS;
    expect(legOne).toEqual({ a: [3.6, 21], b: [12.6, 3] });
    expect(legTwo).toEqual({ a: [12.6, 3], b: [21.6, 21] });
    expect(bar).toEqual({ a: [7.8, 12.6], b: [32.4, 12.6] });
  });

  it("has a 3:2 view box for the full form, a 5:4 one for the compact form, and a 3.8 stroke", () => {
    expect(MARK_VIEWBOX).toEqual({ width: 36, height: 24 });
    expect(MARK_VIEWBOX_COMPACT).toEqual({ width: 30, height: 24 });
    expect(MARK_ASPECT).toBeCloseTo(3 / 2, 10);
    expect(MARK_ASPECT_COMPACT).toBeCloseTo(5 / 4, 10);
    expect(MARK_STROKE_WIDTH).toBe(3.8);
  });

  it("leans both legs at 1 across for 2 down and sets the crossbar a little past their middle", () => {
    const [legOne, legTwo, bar] = MARK_SEGMENTS;
    expect((legOne.b[0] - legOne.a[0]) / (legOne.a[1] - legOne.b[1])).toBeCloseTo(0.5, 10);
    expect((legTwo.b[0] - legTwo.a[0]) / (legTwo.b[1] - legTwo.a[1])).toBeCloseTo(0.5, 10);
    const share = (bar.a[1] - legOne.b[1]) / (legOne.a[1] - legOne.b[1]);
    expect(share).toBeGreaterThan(0.5);
    expect(share).toBeLessThan(0.6);
  });

  it("sits its ink in the middle of both view boxes, clear of every side", () => {
    const [legOne, legTwo, bar] = MARK_SEGMENTS;
    const r = MARK_STROKE_WIDTH / 2;
    const top = legOne.b[1] - r;
    const bottom = legOne.a[1] + r;
    const left = legOne.a[0] - r;
    expect(top).toBeCloseTo(MARK_VIEWBOX.height - bottom, 10);
    expect(left).toBeCloseTo(MARK_VIEWBOX.width - (bar.b[0] + r), 10);
    expect(legTwo.b[0]).toBeLessThan(bar.b[0]);
    expect(left).toBeCloseTo(MARK_VIEWBOX_COMPACT.width - (MARK_COMPACT_END + r), 10);
  });

  it("joins the legs at the apex and runs the bar past the right leg", () => {
    const [legOne, legTwo, bar] = MARK_SEGMENTS;
    expect(legOne.b).toEqual(legTwo.a);
    expect(bar.a[1]).toBe(bar.b[1]);
    // The bar ends to the right of everything else: the "moving forward" overshoot.
    expect(bar.b[0]).toBeGreaterThan(Math.max(legOne.a[0], legOne.b[0], legTwo.a[0], legTwo.b[0]));
  });

  it("writes the compact form as one svg path", () => {
    const [legOne, legTwo, bar] = MARK_SEGMENTS;
    const fromSegments =
      `M${n(legOne.a[0])} ${n(legOne.a[1])}` +
      `L${n(legOne.b[0])} ${n(legOne.b[1])}` +
      `L${n(legTwo.b[0])} ${n(legTwo.b[1])}` +
      `M${n(bar.a[0])} ${n(bar.a[1])}` +
      `H${n(MARK_COMPACT_END)}`;
    expect(MARK_PATH_D).toBe(fromSegments);
    expect(MARK_PATH_D).toBe("M3.6 21L12.6 3L21.6 21M7.8 12.6H26.4");
  });
});

describe("the mark in two inks", () => {
  const [, legTwo, bar] = MARK_SEGMENTS;
  // The crossbar is cut where it meets the centre line of the right leg.
  const cut = xAt(legTwo, bar.a[1]);

  it("cuts the crossbar on the centre line of the right leg", () => {
    expect(cut).toBeCloseTo(17.4, 10);
    expect(cut).toBeGreaterThan(bar.a[0]);
    expect(cut).toBeLessThan(bar.b[0]);
  });

  it("keeps both legs and the near part of the crossbar in the body", () => {
    expect(MARK_BODY_D).toBe("M3.6 21L12.6 3L21.6 21M7.8 12.6H17.4");
    expect(MARK_BODY_D).toBe(`${MARK_PATH_D.slice(0, MARK_PATH_D.lastIndexOf("H"))}H${n(cut)}`);
  });

  it("splits the body into the two strokes a pen makes: the legs, then the crossbar", () => {
    expect(MARK_LEGS_D).toBe("M3.6 21L12.6 3L21.6 21");
    expect(MARK_BAR_D).toBe("M7.8 12.6H17.4");
    expect(`${MARK_LEGS_D}${MARK_BAR_D}`).toBe(MARK_BODY_D);
    // One stroke each: a path that moves the pen once.
    expect(MARK_LEGS_D.match(/M/g)).toHaveLength(1);
    expect(MARK_BAR_D.match(/M/g)).toHaveLength(1);
    // The crossbar stops where the tail takes over.
    expect(MARK_TAIL_D.startsWith(`M${MARK_BAR_D.split("H")[1]} `)).toBe(true);
  });

  it("makes the tail the overshoot, from the cut to the end of the crossbar", () => {
    expect(MARK_TAIL_D).toBe("M17.4 12.6H32.4");
    expect(MARK_TAIL_D).toBe(`M${n(cut)} ${n(bar.a[1])}H${n(bar.b[0])}`);
    // The compact tail starts in the same place and stops short.
    expect(MARK_TAIL_COMPACT_D).toBe(`M${n(cut)} ${n(bar.a[1])}H${n(MARK_COMPACT_END)}`);
    expect(MARK_COMPACT_END).toBeLessThan(bar.b[0]);
  });
});

describe("the 365 on the arm", () => {
  const half = MARK_DIGITS_STROKE_WIDTH / 2;
  const line = trace(MARK_DIGITS_D);
  // Round caps and joins: the inked outline is the centre line grown by half the stroke all round.
  const inked = {
    left: Math.min(...line.map(([x]) => x)) - half,
    right: Math.max(...line.map(([x]) => x)) + half,
    top: Math.min(...line.map(([, y]) => y)) - half,
    bottom: Math.max(...line.map(([, y]) => y)) + half,
  };

  it("is three digits, each one stroke of a lighter pen, and the three as one path", () => {
    expect(MARK_DIGITS_STROKE_WIDTH).toBe(1.4);
    expect(MARK_DIGITS).toHaveLength(3);
    for (const digit of MARK_DIGITS) {
      expect(digit.match(/M/g)).toHaveLength(1);
      expect(digit.startsWith("M")).toBe(true);
      // Lines and curves only, in absolute coordinates: an open path, never closed or filled.
      expect(digit).toMatch(/^[MLHC\d. ]+$/);
      expect(trace(digit).length).toBeGreaterThan(48);
    }
    expect(MARK_DIGITS_D).toBe(MARK_DIGITS.join(""));
  });

  it("reads from left to right: 3, then 6, then 5, evenly set with air between them", () => {
    const spans = MARK_DIGITS.map((digit) => {
      const xs = trace(digit).map(([x]) => x);
      return [Math.min(...xs) - half, Math.max(...xs) + half] as const;
    });
    const [three, six, five] = spans;
    if (!three || !six || !five) throw new Error("three digits");
    expect(six[0] - three[1]).toBeGreaterThanOrEqual(0.7);
    expect(five[0] - six[1]).toBeGreaterThanOrEqual(0.7);
    expect(Math.abs(six[0] - three[1] - (five[0] - six[1]))).toBeLessThanOrEqual(0.1);
    const widths = spans.map(([from, to]) => to - from);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(0.2);

    // The 6 is the one digit with a closed bowl: its pen ends where the bowl began.
    const bowl = trace(MARK_DIGITS[1]);
    const end = bowl[bowl.length - 1] ?? [0, 0];
    const met = bowl.filter((point) => Math.hypot(point[0] - end[0], point[1] - end[1]) < 0.01);
    expect(met).toHaveLength(2);
    // And its bowl keeps an eye: wider inside than nothing, at the size of the bar.
    const start = bowl.findIndex((point) => point === met[0]);
    const ring = bowl.slice(start);
    const width = Math.max(...ring.map(([x]) => x)) - Math.min(...ring.map(([x]) => x));
    const height = Math.max(...ring.map(([, y]) => y)) - Math.min(...ring.map(([, y]) => y));
    expect(width - MARK_DIGITS_STROKE_WIDTH).toBeGreaterThanOrEqual(1);
    expect(height - MARK_DIGITS_STROKE_WIDTH).toBeGreaterThanOrEqual(1);
  });

  it("fills its box, inside the view box", () => {
    expect(MARK_DIGITS_BOX).toEqual({ left: 19.37, right: 34.3, top: 3.48, bottom: 9.5 });
    for (const side of ["left", "top"] as const) {
      expect(inked[side]).toBeGreaterThanOrEqual(MARK_DIGITS_BOX[side] - 0.005);
      expect(inked[side]).toBeLessThanOrEqual(MARK_DIGITS_BOX[side] + 0.1);
    }
    for (const side of ["right", "bottom"] as const) {
      expect(inked[side]).toBeLessThanOrEqual(MARK_DIGITS_BOX[side] + 0.005);
      expect(inked[side]).toBeGreaterThanOrEqual(MARK_DIGITS_BOX[side] - 0.1);
    }
    expect(inked.left).toBeGreaterThan(0);
    expect(inked.top).toBeGreaterThan(0);
    expect(inked.right).toBeLessThan(MARK_VIEWBOX.width);
    expect(inked.bottom).toBeLessThan(MARK_VIEWBOX.height);
  });

  it("stands clear of the legs and above the arm, with a gap", () => {
    const [legOne, legTwo, bar] = MARK_SEGMENTS;
    const reach = MARK_STROKE_WIDTH / 2 + half;
    for (const point of line) {
      // A unit of ground between the ink of a digit and the ink of the "A".
      expect(distance(point, legOne) - reach).toBeGreaterThanOrEqual(1);
      expect(distance(point, legTwo) - reach).toBeGreaterThanOrEqual(1);
      expect(distance(point, bar) - reach).toBeGreaterThanOrEqual(1);
    }
    // The digits stand on the arm: a little above its top edge, and they end where it ends.
    const top = bar.a[1] - MARK_STROKE_WIDTH / 2;
    expect(top - inked.bottom).toBeGreaterThanOrEqual(1);
    expect(top - inked.bottom).toBeLessThanOrEqual(1.4);
    expect(inked.left).toBeGreaterThan(xAt(legTwo, inked.bottom) + MARK_STROKE_WIDTH / 2);
    expect(Math.abs(inked.right - (bar.b[0] + MARK_STROKE_WIDTH / 2))).toBeLessThanOrEqual(0.05);
  });
});

describe("the mark as drawn", () => {
  it("LogoMark strokes the shared path in currentColor, in the compact form, and is decorative", () => {
    const html = renderToStaticMarkup(createElement(LogoMark));
    expect(html).toContain('viewBox="0 0 30 24"');
    expect(html).toContain(`d="${MARK_PATH_D}"`);
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('stroke-width="3.8"');
    expect(html).toContain('stroke-linecap="round"');
    expect(html).toContain('stroke-linejoin="round"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("height:1.5em");
    expect(html).toContain("aspect-ratio:1.25");
    expect(html.match(/<path/g)).toHaveLength(1);
  });

  it("LogoMark with a title is an image with that name", () => {
    const html = renderToStaticMarkup(createElement(LogoMark, { title: "Advanta365" }));
    expect(html).toContain('role="img"');
    expect(html).toContain("<title>Advanta365</title>");
    expect(html).not.toContain("aria-hidden");
  });

  it("LogoMark in one ink never draws the digits", () => {
    const html = renderToStaticMarkup(createElement(LogoMark, { digits: true }));
    expect(html.match(/<path/g)).toHaveLength(1);
    expect(html).not.toContain("data-mark-digits");
  });

  it("LogoMark in two inks is the full form and draws the 365 last, in the ink of the tail", () => {
    const html = renderToStaticMarkup(createElement(LogoMark, { tone: "two" }));
    expect(html).toContain('viewBox="0 0 36 24"');
    expect(html).toContain("aspect-ratio:1.5");
    expect(html).toContain(`d="${MARK_TAIL_D}"`);
    expect(html.match(/<path/g)).toHaveLength(3);
    expect(html.match(/data-mark-digits=""/g)).toHaveLength(1);
    const digits = html.slice(html.lastIndexOf("<path"));
    expect(digits).toContain('data-mark-digits=""');
    expect(digits).toContain(`d="${MARK_DIGITS_D}"`);
    expect(digits).toContain('stroke="var(--logo-tail, currentColor)"');
    expect(digits).toContain('stroke-width="1.4"');
    expect(digits).toContain('stroke-linecap="round"');
    expect(digits).toContain('stroke-linejoin="round"');
    // Sighted decoration: the digits are strokes, not text, and bring no name of their own.
    expect(html).not.toContain("<title");
    expect(html).not.toContain("<text");
    expect(html).toContain('aria-hidden="true"');
  });

  it("LogoMark in two inks without digits is the compact form: the tail first, the body over it", () => {
    const html = renderToStaticMarkup(createElement(LogoMark, { tone: "two", digits: false }));
    expect(html).toContain('viewBox="0 0 30 24"');
    expect(html).not.toContain("data-mark-digits");
    expect(html.match(/<path/g)).toHaveLength(2);
    expect(html).not.toContain(`d="${MARK_PATH_D}"`);
    expect(html).not.toContain(`d="${MARK_TAIL_D}"`);

    const tail = html.indexOf(`d="${MARK_TAIL_COMPACT_D}"`);
    const body = html.indexOf(`d="${MARK_BODY_D}"`);
    expect(tail).toBeGreaterThan(-1);
    expect(body).toBeGreaterThan(tail);

    // The tail takes its own ink from a custom property and falls back to the ink of the body.
    expect(html).toContain('stroke="var(--logo-tail, currentColor)"');
    expect(html.match(/stroke="currentColor"/g)).toHaveLength(1);
    expect(html.match(/stroke-width="3\.8"/g)).toHaveLength(2);
    expect(html.match(/stroke-linecap="round"/g)).toHaveLength(2);
    expect(html.match(/stroke-linejoin="round"/g)).toHaveLength(2);
    expect(html).toContain('aria-hidden="true"');
  });

  it("the site icon is what scripts/gen-icon.mjs writes: the compact mark on an ink tile", () => {
    const icon = readFileSync(
      fileURLToPath(new URL("../../app/icon.svg", import.meta.url)),
      "utf8",
    );
    // Regenerate it with `node scripts/gen-icon.mjs` after any change to the mark.
    expect(icon).toBe(renderIcon());
    expect(icon).toContain('viewBox="0 0 32 32"');
    expect(icon).toContain('rx="7"');
    expect(icon).toContain('fill="#0B0D12"');
    expect(icon).toContain(`stroke-width="${MARK_STROKE_WIDTH}"`);
    expect(icon).toContain('stroke-linecap="round"');
    expect(icon).toContain('stroke-linejoin="round"');
    expect(icon.match(/<path/g)).toHaveLength(2);
    expect(icon).not.toContain(`d="${MARK_PATH_D}"`);
    expect(icon).not.toContain(`d="${MARK_TAIL_D}"`);

    // As in `LogoMark`, the tail is drawn first and the body over it.
    const tail = icon.indexOf(`<path d="${MARK_TAIL_COMPACT_D}" stroke="#86C1FF"/>`);
    const body = icon.indexOf(`<path d="${MARK_BODY_D}" stroke="#FFFFFF"/>`);
    expect(tail).toBeGreaterThan(-1);
    expect(body).toBeGreaterThan(tail);
  });
});
