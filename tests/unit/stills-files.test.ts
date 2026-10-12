import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { STILL_MAX_BYTES, STILLS, STILLS_MAX_BYTES } from "@/lib/ink/stills";

// The stills are frames of the real engine, captured by `scripts/ink-stills.mjs` on the built pages
// and committed. This file holds them to the list that names them and to their budgets.

const DIRECTORY = path.join(process.cwd(), "public", "ink");
const files = readdirSync(DIRECTORY).sort();

describe("the stills", () => {
  it("are the eleven the manifest names, and nothing else", () => {
    expect(STILLS).toHaveLength(11);
    expect(files).toEqual(STILLS.map((still) => `${still.name}.webp`).sort());
    // The hero pair went with the scene it was a frame of; the prompt pair stands in its place.
    expect(files.filter((file) => file.startsWith("hero"))).toEqual([]);
    expect(files).toEqual(expect.arrayContaining(["prompt-tall.webp", "prompt-wide.webp"]));
  });

  it("are WebP images", () => {
    for (const file of files) {
      const head = readFileSync(path.join(DIRECTORY, file)).subarray(0, 12);
      expect(head.subarray(0, 4).toString("ascii"), file).toBe("RIFF");
      expect(head.subarray(8, 12).toString("ascii"), file).toBe("WEBP");
    }
  });

  it("are at most 90KB each", () => {
    for (const file of files) {
      expect(statSync(path.join(DIRECTORY, file)).size, file).toBeLessThanOrEqual(STILL_MAX_BYTES);
    }
  });

  it("are at most 600KB together", () => {
    const total = files.reduce((sum, file) => sum + statSync(path.join(DIRECTORY, file)).size, 0);
    expect(total).toBeLessThanOrEqual(STILLS_MAX_BYTES);
  });

  it("are captured in a window the manifest states, with a ratio of 1 to 2", () => {
    for (const still of STILLS) {
      expect(still.viewport[0], still.name).toBeGreaterThanOrEqual(320);
      expect(still.viewport[1], still.name).toBeGreaterThan(0);
      expect(still.ratio, still.name).toBeGreaterThanOrEqual(1);
      expect(still.ratio, still.name).toBeLessThanOrEqual(2);
      expect(still.route.startsWith("/"), still.name).toBe(true);
    }
  });
});
