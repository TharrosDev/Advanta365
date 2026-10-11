import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LogoMark } from "@/components/ui/logo-mark";
import {
  MARK_ASPECT,
  MARK_HALF_WIDTH_NORMALIZED,
  MARK_PATH_D,
  MARK_RADIUS_NORMALIZED,
  MARK_SEGMENTS,
  MARK_STROKE_WIDTH,
  MARK_VIEWBOX,
  normalizedMarkSegments,
} from "@/lib/brand/mark";

/** Formats a coordinate the way the path data writes it ("20.5", "4"). */
const n = (value: number) => String(value);

describe("brand mark geometry", () => {
  it("is three strokes with the designed coordinates", () => {
    expect(MARK_SEGMENTS).toHaveLength(3);
    const [legOne, legTwo, bar] = MARK_SEGMENTS;
    expect(legOne).toEqual({ a: [4, 20.5], b: [12.5, 3.5] });
    expect(legTwo).toEqual({ a: [12.5, 3.5], b: [21, 20.5] });
    expect(bar).toEqual({ a: [8.5, 13.5], b: [28.5, 13.5] });
  });

  it("has a 4:3 view box and a 4.2 stroke", () => {
    expect(MARK_VIEWBOX).toEqual({ width: 32, height: 24 });
    expect(MARK_ASPECT).toBeCloseTo(4 / 3, 10);
    expect(MARK_STROKE_WIDTH).toBe(4.2);
    expect(MARK_RADIUS_NORMALIZED).toBeCloseTo(MARK_STROKE_WIDTH / 2 / MARK_VIEWBOX.height, 10);
    expect(MARK_RADIUS_NORMALIZED).toBeCloseTo(0.0875, 10);
    expect(MARK_HALF_WIDTH_NORMALIZED).toBeCloseTo(2 / 3, 10);
  });

  it("joins the legs at the apex and runs the bar past the right leg", () => {
    const [legOne, legTwo, bar] = MARK_SEGMENTS;
    expect(legOne.b).toEqual(legTwo.a);
    expect(bar.a[1]).toBe(bar.b[1]);
    // The bar ends to the right of everything else: the "moving forward" overshoot.
    expect(bar.b[0]).toBeGreaterThan(Math.max(legOne.a[0], legOne.b[0], legTwo.a[0], legTwo.b[0]));
  });

  it("writes the same strokes as one svg path", () => {
    const [legOne, legTwo, bar] = MARK_SEGMENTS;
    const fromSegments =
      `M${n(legOne.a[0])} ${n(legOne.a[1])}` +
      `L${n(legOne.b[0])} ${n(legOne.b[1])}` +
      `L${n(legTwo.b[0])} ${n(legTwo.b[1])}` +
      `M${n(bar.a[0])} ${n(bar.a[1])}` +
      `H${n(bar.b[0])}`;
    expect(MARK_PATH_D).toBe(fromSegments);
    expect(MARK_PATH_D).toBe("M4 20.5L12.5 3.5L21 20.5M8.5 13.5H28.5");
  });
});

describe("normalizedMarkSegments", () => {
  const normalized = normalizedMarkSegments();

  it("keeps the three segments in order", () => {
    expect(normalized).toHaveLength(3);
  });

  it("maps the view box centre (16, 12) to the origin, one unit per view box height", () => {
    normalized.forEach((segment, index) => {
      const source = MARK_SEGMENTS[index];
      if (!source) throw new Error(`missing source segment ${index}`);
      for (const end of ["a", "b"] as const) {
        const [x, y] = source[end];
        const [nx, ny] = segment[end];
        // Inverting the mapping must give back the view box point: (16, 12) <-> (0, 0).
        expect(nx * 24 + 16).toBeCloseTo(x, 10);
        expect(12 - ny * 24).toBeCloseTo(y, 10);
      }
    });
  });

  it("points y up", () => {
    const [legOne, , bar] = normalized;
    if (!legOne || !bar) throw new Error("missing segments");
    // Leg 1 runs from the foot (low on screen) to the apex (high on screen).
    expect(legOne.a[1]).toBeCloseTo(-8.5 / 24, 10);
    expect(legOne.b[1]).toBeCloseTo(8.5 / 24, 10);
    expect(legOne.b[1]).toBeGreaterThan(legOne.a[1]);
    // The bar sits 1.5 units below the centre line of the view box.
    expect(bar.a[1]).toBeCloseTo(-1.5 / 24, 10);
    expect(bar.a[0]).toBeCloseTo(-7.5 / 24, 10);
    expect(bar.b[0]).toBeCloseTo(12.5 / 24, 10);
  });

  it("keeps every stroke, radius included, inside the glyph box", () => {
    for (const segment of normalized) {
      for (const [x, y] of [segment.a, segment.b]) {
        expect(Math.abs(x) + MARK_RADIUS_NORMALIZED).toBeLessThanOrEqual(
          MARK_HALF_WIDTH_NORMALIZED,
        );
        expect(Math.abs(y) + MARK_RADIUS_NORMALIZED).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it("returns a fresh array on every call", () => {
    expect(normalizedMarkSegments()).not.toBe(normalized);
    expect(normalizedMarkSegments()).toEqual(normalized);
  });
});

describe("the mark as drawn", () => {
  it("LogoMark strokes the shared path in currentColor and is decorative by default", () => {
    const html = renderToStaticMarkup(createElement(LogoMark));
    expect(html).toContain('viewBox="0 0 32 24"');
    expect(html).toContain(`d="${MARK_PATH_D}"`);
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('stroke-width="4.2"');
    expect(html).toContain('stroke-linecap="round"');
    expect(html).toContain('stroke-linejoin="round"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("height:1.5em");
    expect(html.match(/<path/g)).toHaveLength(1);
  });

  it("LogoMark with a title is an image with that name", () => {
    const html = renderToStaticMarkup(createElement(LogoMark, { title: "Advanta365" }));
    expect(html).toContain('role="img"');
    expect(html).toContain("<title>Advanta365</title>");
    expect(html).not.toContain("aria-hidden");
  });

  it("the site icon repeats the same path in ink on a white rounded square", () => {
    const icon = readFileSync(
      fileURLToPath(new URL("../../app/icon.svg", import.meta.url)),
      "utf8",
    );
    expect(icon).toContain('viewBox="0 0 32 32"');
    expect(icon).toContain(`d="${MARK_PATH_D}"`);
    expect(icon).toContain('stroke="#181818"');
    expect(icon).toContain(`stroke-width="${MARK_STROKE_WIDTH}"`);
    expect(icon).toContain('transform="translate(0 4)"');
    expect(icon).toContain('rx="6"');
  });
});
