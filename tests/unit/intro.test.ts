import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BOOT_SCRIPT } from "@/lib/boot/boot-script";
import { IntroScript } from "@/components/intro/intro-script-tag";

// The cover of a first visit is decided and drawn by `lib/boot` (the inline script and its pure
// twin) and `components/intro/intro-cover`; their tests are `boot-script.test.ts` and
// `boot-cover.test.ts`. The module this file used to pin, `components/intro/intro-script`, is the
// edition's retired one. It is kept on disk only until someone with the right to delete files removes
// it, and this file keeps anything from growing a dependency on it in the meantime.

const ROOT = process.cwd();

function sources(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(path.join(ROOT, directory), { withFileTypes: true })) {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) found.push(...sources(relative));
    else if (/\.(ts|tsx)$/.test(entry.name)) found.push(relative);
  }
  return found;
}

describe("the cover's script", () => {
  it("is the boot script of lib/boot, printed by the tag the root layout renders", () => {
    expect(BOOT_SCRIPT.length).toBeGreaterThan(100);
    expect(typeof IntroScript).toBe("function");
  });

  it("is not read from the retired intro-script module by anything", () => {
    const readers = ["app", "components", "lib", "tests"]
      .flatMap(sources)
      .filter((file) => file !== "tests/unit/intro.test.ts")
      .filter((file) => file !== "components/intro/intro-script.ts")
      .filter((file) =>
        /intro\/intro-script["']/.test(readFileSync(path.join(ROOT, file), "utf8")),
      );
    expect(readers).toEqual([]);
  });
});
