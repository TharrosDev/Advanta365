import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LogoMark } from "@/components/ui/logo-mark";
import {
  MARK_ASPECT,
  MARK_BODY_D,
  MARK_PATH_D,
  MARK_SEGMENTS,
  MARK_STROKE_WIDTH,
  MARK_TAIL_D,
  MARK_VIEWBOX,
} from "@/lib/brand/mark";

/** Formats a coordinate the way the path data writes it ("20.5", "4"). */
const n = (value: number) => String(value);

/** Where the centre line of a stroke crosses a given height. */
function xAt(stroke: (typeof MARK_SEGMENTS)[number], y: number): number {
  const t = (y - stroke.a[1]) / (stroke.b[1] - stroke.a[1]);
  return stroke.a[0] + t * (stroke.b[0] - stroke.a[0]);
}

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

describe("the mark in two inks", () => {
  const [, legTwo, bar] = MARK_SEGMENTS;
  // The crossbar is cut where it meets the centre line of the right leg.
  const cut = xAt(legTwo, bar.a[1]);

  it("cuts the crossbar on the centre line of the right leg", () => {
    expect(cut).toBeCloseTo(17.5, 10);
    expect(cut).toBeGreaterThan(bar.a[0]);
    expect(cut).toBeLessThan(bar.b[0]);
  });

  it("keeps both legs and the near part of the crossbar in the body", () => {
    expect(MARK_BODY_D).toBe("M4 20.5L12.5 3.5L21 20.5M8.5 13.5H17.5");
    expect(MARK_BODY_D).toBe(`${MARK_PATH_D.slice(0, MARK_PATH_D.lastIndexOf("H"))}H${n(cut)}`);
  });

  it("makes the tail the overshoot, from the cut to the end of the crossbar", () => {
    expect(MARK_TAIL_D).toBe("M17.5 13.5H28.5");
    expect(MARK_TAIL_D).toBe(`M${n(cut)} ${n(bar.a[1])}H${n(bar.b[0])}`);
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

  it("LogoMark in two inks draws the tail first and the body over it", () => {
    const html = renderToStaticMarkup(createElement(LogoMark, { tone: "two" }));
    expect(html.match(/<path/g)).toHaveLength(2);
    expect(html).not.toContain(`d="${MARK_PATH_D}"`);

    const tail = html.indexOf(`d="${MARK_TAIL_D}"`);
    const body = html.indexOf(`d="${MARK_BODY_D}"`);
    expect(tail).toBeGreaterThan(-1);
    expect(body).toBeGreaterThan(tail);

    // The tail takes its own ink from a custom property and falls back to the ink of the body.
    expect(html).toContain('stroke="var(--logo-tail, currentColor)"');
    expect(html.match(/stroke="currentColor"/g)).toHaveLength(1);
    expect(html.match(/stroke-width="4\.2"/g)).toHaveLength(2);
    expect(html.match(/stroke-linecap="round"/g)).toHaveLength(2);
    expect(html.match(/stroke-linejoin="round"/g)).toHaveLength(2);
    expect(html).toContain('aria-hidden="true"');
  });

  it("the site icon repeats the same path in ink on a highlighter tile", () => {
    const icon = readFileSync(
      fileURLToPath(new URL("../../app/icon.svg", import.meta.url)),
      "utf8",
    );
    expect(icon).toContain('viewBox="0 0 32 32"');
    expect(icon).toContain('rx="7"');
    expect(icon).toContain('fill="#F4EA52"');
    expect(icon).toContain('stroke="#123022"');
    expect(icon).toContain('transform="translate(3.5 6.6) scale(0.78)"');
    expect(icon).toContain(`d="${MARK_PATH_D}"`);
    expect(icon).toContain(`stroke-width="${MARK_STROKE_WIDTH}"`);
  });
});
