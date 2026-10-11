import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The paper's grain is one small tile (scripts/paper-grain.mjs writes it): 128px square, an
 * indexed image with four palette entries, at most 4KB. `--grain` in app/globals.css names it.
 */

const FILE = fileURLToPath(new URL("../../public/paper/grain.png", import.meta.url));
const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** The chunks of a PNG, by type. */
function chunksOf(png: Buffer): Map<string, Buffer> {
  const chunks = new Map<string, Buffer>();
  let at = SIGNATURE.length;
  while (at + 8 <= png.length) {
    const length = png.readUInt32BE(at);
    const type = png.toString("latin1", at + 4, at + 8);
    chunks.set(type, png.subarray(at + 8, at + 8 + length));
    at += 12 + length;
  }
  return chunks;
}

describe("public/paper/grain.png", () => {
  it("exists", () => {
    expect(existsSync(FILE)).toBe(true);
  });

  it("is a PNG of 128 by 128 pixels", () => {
    const png = readFileSync(FILE);
    expect([...png.subarray(0, SIGNATURE.length)]).toEqual(SIGNATURE);
    const header = chunksOf(png).get("IHDR");
    expect(header?.readUInt32BE(0)).toBe(128);
    expect(header?.readUInt32BE(4)).toBe(128);
  });

  it("weighs at most 4KB", () => {
    expect(readFileSync(FILE).length).toBeLessThanOrEqual(4096);
  });

  it("has a palette of four entries, the first clear and the darkest under a tenth", () => {
    const chunks = chunksOf(readFileSync(FILE));
    expect(chunks.get("IHDR")?.[9]).toBe(3);
    expect(chunks.get("PLTE")?.length).toBe(4 * 3);
    const alphas = [...(chunks.get("tRNS") ?? [])];
    expect(alphas).toHaveLength(4);
    expect(alphas[0]).toBe(0);
    expect(Math.max(...alphas)).toBeLessThanOrEqual(Math.round(0.09 * 255));
  });

  it("is the tile the stylesheet names", () => {
    const css = readFileSync(
      fileURLToPath(new URL("../../app/globals.css", import.meta.url)),
      "utf8",
    );
    expect(css).toContain('--grain: url("/paper/grain.png")');
  });
});
