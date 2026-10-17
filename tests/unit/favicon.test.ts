import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The raster icons `scripts/gen-favicon.mjs` writes: each is a PNG of the size it is named for, and
 * the favicon holds the three sizes search engines and browsers ask for.
 */

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)));

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The width and height in a PNG's header. */
function pngSize(png: Buffer): [number, number] {
  expect(png.subarray(0, 8).equals(PNG)).toBe(true);
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

describe("the raster icons", () => {
  it("app/favicon.ico holds 16, 32 and 48 pixel PNGs", () => {
    const ico = read("app/favicon.ico");
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, index) => {
      const entry = 6 + 16 * index;
      const length = ico.readUInt32LE(entry + 8);
      const offset = ico.readUInt32LE(entry + 12);
      const [width, height] = pngSize(ico.subarray(offset, offset + length));
      expect([ico.readUInt8(entry), ico.readUInt8(entry + 1)]).toEqual([width, height]);
      return width;
    });
    expect(sizes).toEqual([16, 32, 48]);
  });

  it.each([
    ["app/apple-icon.png", 180],
    ["public/icons/icon-192.png", 192],
    ["public/icons/icon-512.png", 512],
    ["public/icons/maskable-512.png", 512],
  ])("%s is %i pixels square", (path, size) => {
    expect(pngSize(read(path))).toEqual([size, size]);
  });
});
