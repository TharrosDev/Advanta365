import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The turn of a sheet is its own. A wrapper that leans itself (the hero's documents, the folder's
 * covers) sets `--turn` on an element above the sheet; custom properties inherit, so a sheet that
 * read `--turn` would lean a second time by the same angle, and would never straighten with the
 * wrapper. The sheet reads a private `--sheet-turn`, which only its `turn` prop sets.
 */

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), "utf8");

const STYLES = read("components/ui/paper-sheet.module.css").replace(/\/\*[\s\S]*?\*\//g, "");
const SOURCE = read("components/ui/paper-sheet.tsx");

describe("the turn of a PaperSheet", () => {
  it("is read from a private property, which the sheet resets before reading", () => {
    expect(STYLES).toMatch(/rotate:\s*var\(--sheet-turn\)\s*;/);
    expect(STYLES).toMatch(/--sheet-turn:\s*0deg\s*;/);
  });

  it("never reads the --turn of a wrapper", () => {
    expect(STYLES).not.toMatch(/var\(--turn\b/);
  });

  it("is written by the turn prop to the private property", () => {
    expect(SOURCE).toContain('"--sheet-turn"');
    expect(SOURCE).not.toMatch(/"--turn"/);
  });
});
