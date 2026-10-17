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
  MARK_HUE_D,
  MARK_INK_D,
  MARK_PATH_D,
  MARK_SEAM_X,
  MARK_VIEWBOX,
} from "@/lib/brand/mark";

type Point = readonly [number, number];

/**
 * The corners of a closed shape written in `M`, `H`, `V` and `L` with absolute coordinates, which
 * is all the mark is written in.
 */
function corners(d: string): Point[] {
  const points: Point[] = [];
  let at: Point = [0, 0];
  for (const [, command = "", rest = ""] of d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    const v = rest.trim()
      ? rest
          .trim()
          .split(/[\s,]+/)
          .map(Number)
      : [];
    const [a = NaN, b = NaN] = v;
    if (v.some(Number.isNaN)) throw new Error(`not a number in "${command}${rest}"`);
    if ((command === "M" || command === "L") && v.length === 2) at = [a, b];
    else if (command === "H" && v.length === 1) at = [a, at[1]];
    else if (command === "V" && v.length === 1) at = [at[0], a];
    else if (command === "Z" && v.length === 0) continue;
    else throw new Error(`cannot read "${command}${rest}"`);
    points.push(at);
  }
  return points;
}

const bounds = (points: Point[]) => ({
  left: Math.min(...points.map(([x]) => x)),
  right: Math.max(...points.map(([x]) => x)),
  top: Math.min(...points.map(([, y]) => y)),
  bottom: Math.max(...points.map(([, y]) => y)),
});

describe("brand mark geometry", () => {
  it("has a 48 by 44 view box, one form, and its aspect", () => {
    expect(MARK_VIEWBOX).toEqual({ width: 48, height: 44 });
    expect(MARK_ASPECT).toBeCloseTo(12 / 11, 10);
  });

  it("is one closed shape of seven corners with a flat peak", () => {
    const whole = corners(MARK_PATH_D);
    expect(whole).toHaveLength(7);
    expect(MARK_PATH_D.endsWith("Z")).toBe(true);
    const peak = whole.filter(([, y]) => y === bounds(whole).top);
    expect(peak).toHaveLength(2);
    expect(Math.abs((peak[0]?.[0] ?? 0) - (peak[1]?.[0] ?? 0))).toBe(10);
  });

  it("leans both legs at 11 across for 40 down, the outside and the inside alike", () => {
    const [footL, innerL, apexInner, innerR, footR, peakR, peakL] = corners(MARK_PATH_D);
    if (!footL || !innerL || !apexInner || !innerR || !footR || !peakR || !peakL) {
      throw new Error("seven corners");
    }
    const lean = (a: Point, b: Point) => Math.abs(b[0] - a[0]) / Math.abs(b[1] - a[1]);
    expect(lean(footL, peakL)).toBeCloseTo(17 / 40, 10);
    expect(lean(footR, peakR)).toBeCloseTo(17 / 40, 10);
    // The inside edges run at the same slope as the outside ones (11 across for 27.5 down).
    expect(lean(innerL, apexInner)).toBeCloseTo(11 / 27.5, 10);
    expect(lean(innerR, apexInner)).toBeCloseTo(11 / 27.5, 10);
    // Both legs are 11 wide at the foot.
    expect(innerL[0] - footL[0]).toBe(11);
    expect(footR[0] - innerR[0]).toBe(11);
  });

  it("sits its ink in the middle of the view box, 2 units clear of every side", () => {
    const ink = bounds(corners(MARK_PATH_D));
    expect(ink.left).toBe(2);
    expect(MARK_VIEWBOX.width - ink.right).toBe(2);
    expect(ink.top).toBe(2);
    expect(MARK_VIEWBOX.height - ink.bottom).toBe(2);
  });

  it("is symmetric about the seam", () => {
    const whole = corners(MARK_PATH_D);
    const mirrored = whole
      .map(([x, y]): Point => [2 * MARK_SEAM_X - x, y])
      .map(([x, y]) => `${x},${y}`)
      .sort();
    expect(mirrored).toEqual(whole.map(([x, y]) => `${x},${y}`).sort());
  });
});

describe("the mark in two halves", () => {
  const arm = corners(MARK_INK_D);
  const leg = corners(MARK_HUE_D);

  it("splits the arm from the leg on the vertical seam through the peak", () => {
    expect(bounds(arm).right).toBeLessThanOrEqual(MARK_SEAM_X + 0);
    expect(arm.filter(([x]) => x === MARK_SEAM_X).length).toBe(2);
    expect(bounds(arm).left).toBe(2);
    expect(bounds(leg).right).toBe(46);
    expect(bounds(arm).top).toBe(bounds(leg).top);
    expect(bounds(arm).bottom).toBe(bounds(leg).bottom);
  });

  it("tucks the leg half a unit under the arm, so no hairline shows on the seam", () => {
    expect(bounds(leg).left).toBe(MARK_SEAM_X - 0.5);
  });

  it("covers exactly the whole mark between them", () => {
    const whole = bounds(corners(MARK_PATH_D));
    const both = bounds([...arm, ...leg]);
    expect(both).toEqual(whole);
  });
});

describe("the mark as drawn", () => {
  it("LogoMark fills the shared path in currentColor and is decorative", () => {
    const html = renderToStaticMarkup(createElement(LogoMark));
    expect(html).toContain('viewBox="0 0 48 44"');
    expect(html).toContain(`d="${MARK_PATH_D}"`);
    expect(html).toContain('fill="currentColor"');
    expect(html).not.toContain("stroke");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("height:1.5em");
    expect(html).toContain(`aspect-ratio:${MARK_ASPECT}`);
    expect(html.match(/<path/g)).toHaveLength(1);
  });

  it("LogoMark with a title is an image with that name", () => {
    const html = renderToStaticMarkup(createElement(LogoMark, { title: "Advanta365" }));
    expect(html).toContain('role="img"');
    expect(html).toContain("<title>Advanta365</title>");
    expect(html).not.toContain("aria-hidden");
  });

  it("LogoMark in two inks draws the leg first and the arm over it", () => {
    const html = renderToStaticMarkup(createElement(LogoMark, { tone: "two" }));
    expect(html.match(/<path/g)).toHaveLength(2);
    expect(html).not.toContain(`d="${MARK_PATH_D}"`);
    const leg = html.indexOf(`d="${MARK_HUE_D}"`);
    const arm = html.indexOf(`d="${MARK_INK_D}"`);
    expect(leg).toBeGreaterThan(-1);
    expect(arm).toBeGreaterThan(leg);
    // The leg takes its own ink from a custom property and falls back to the ink of the arm.
    expect(html).toContain('fill="var(--logo-half, currentColor)"');
    expect(html.match(/fill="currentColor"/g)).toHaveLength(1);
    expect(html).toContain('aria-hidden="true"');
  });

  it("the site icon is what scripts/gen-icon.mjs writes: the two-tone mark on an ink tile", () => {
    const icon = readFileSync(
      fileURLToPath(new URL("../../app/icon.svg", import.meta.url)),
      "utf8",
    );
    // Regenerate it with `node scripts/gen-icon.mjs` after any change to the mark.
    expect(icon).toBe(renderIcon());
    expect(icon).toContain('viewBox="0 0 32 32"');
    expect(icon).toContain('rx="7"');
    expect(icon).toContain('fill="#0B0D12"');
    expect(icon).not.toContain("stroke");
    expect(icon.match(/<path/g)).toHaveLength(2);
    expect(icon).not.toContain(`d="${MARK_PATH_D}"`);

    // As in `LogoMark`, the leg is drawn first and the arm over it.
    const leg = icon.indexOf(`<path d="${MARK_HUE_D}" fill="#86C1FF"/>`);
    const arm = icon.indexOf(`<path d="${MARK_INK_D}" fill="#FFFFFF"/>`);
    expect(leg).toBeGreaterThan(-1);
    expect(arm).toBeGreaterThan(leg);
  });
});
