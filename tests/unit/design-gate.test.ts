import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The design gate. The site's look is its own: this file fails the build when a name, value or
 * technique that the design retired comes back into the source, or when one of the standing rules
 * of the design system is broken. It reads files as text, so a match in a comment counts too.
 *
 * It is the one file allowed to contain the strings it looks for, and leaves itself out of the scan.
 */

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SELF = "tests/unit/design-gate.test.ts";

/** Every file under a folder of the repository, as paths relative to the root with "/" separators. */
function filesUnder(folder: string): string[] {
  const start = join(ROOT, folder);
  if (!existsSync(start)) return [];

  const found: string[] = [];
  const visit = (directory: string) => {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      if (statSync(path).isDirectory()) visit(path);
      else found.push(relative(ROOT, path).replaceAll("\\", "/"));
    }
  };
  visit(start);
  return found.sort();
}

const read = (file: string) => readFileSync(join(ROOT, file), "utf8");

type Rule = { name: string; pattern: RegExp };

/** A plain string as a rule; `i` makes it case-insensitive (used for the words). */
function literal(text: string, flags = ""): Rule {
  return { name: text, pattern: new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags) };
}

/** Each line of each file that matches a rule, as "file:line: rule". */
function scan(files: readonly string[], rules: readonly Rule[]): string[] {
  const hits: string[] = [];
  for (const file of files) {
    read(file)
      .split("\n")
      .forEach((line, index) => {
        for (const rule of rules) {
          if (rule.pattern.test(line)) hits.push(`${file}:${index + 1}: ${rule.name}`);
        }
      });
  }
  return hits;
}

const SOURCE = ["app", "components", "lib", "tests"]
  .flatMap(filesUnder)
  .filter((file) => file !== SELF);

// What the design retired. The words are matched whatever their case; the rest as written.
const RETIRED: Rule[] = [
  // The typeface and the base colour.
  literal("#181818", "i"),
  literal("Instrument", "i"),
  // Effects and graphics.
  literal("wipe", "i"),
  literal("reveal", "i"),
  literal("sheen", "i"),
  literal("swirl", "i"),
  literal("liquid", "i"),
  literal("chrome", "i"),
  literal("wordmark", "i"),
  literal("mix-blend-mode"),
  literal("<canvas"),
  literal("getContext("),
  literal("new Worker"),
  // Attributes on the root element and hooks of the first-load sequence.
  literal("data-entry"),
  literal("data-theme"),
  literal("data-site-symbol"),
  // The token table and the utility classes.
  literal("--color-foreground"),
  literal("--color-background"),
  literal("--base-color"),
  literal("--spacing-"),
  literal("--measure-"),
  literal("--container-"),
  literal("--duration-"),
  literal("--easing-"),
  literal("--viewport-height"),
  literal("--site-header-height"),
  literal("@property"),
  literal(".t-display"),
  literal("c-fg-"),
  // Measures and breakpoints. The lookbehind keeps a longer number that ends in the same digits
  // (the 1232px grid) from counting.
  { name: "(502|938|620|366|232)px", pattern: /(?<![\d.])(502|938|620|366|232)px/ },
  {
    name: "(min|max)-width: (768|1024|2000)px",
    pattern: /(min|max)-width:\s*(768|1024|2000)px/,
  },
  { name: "letter-spacing: -", pattern: /letter-spacing:\s*-/ },
  // Wording.
  literal("the reference", "i"),
  literal("REFERENCE_"),
  literal("For general questions", "i"),
  literal("Error 404", "i"),
];

describe("design gate: retired vocabulary", () => {
  it("scans the source", () => {
    // A scan of nothing would pass: make sure the walk found the tree.
    expect(SOURCE.length).toBeGreaterThan(100);
    expect(SOURCE).toContain("app/globals.css");
    expect(SOURCE).toContain("components/ui/button.tsx");
    expect(SOURCE).toContain("lib/site.ts");
    expect(SOURCE).toContain("tests/e2e/identity.spec.ts");
    expect(SOURCE).not.toContain(SELF);
  });

  it("finds none of it under app/, components/, lib/ or tests/", () => {
    expect(scan(SOURCE, RETIRED)).toEqual([]);
  });

  it("finds none of it in the README or the documents", () => {
    const documents = ["README.md", ...filesUnder("docs")];
    expect(documents.length).toBeGreaterThan(1);
    expect(
      scan(documents, [
        literal("Instrument", "i"),
        literal("#181818", "i"),
        literal("For general questions", "i"),
      ]),
    ).toEqual([]);
  });

  it("the retired folders are gone", () => {
    for (const folder of [
      "components/graphics",
      "components/entry",
      "components/motion",
      "lib/motion",
      "lib/gl",
    ]) {
      expect(existsSync(join(ROOT, folder)), folder).toBe(false);
    }
  });
});

describe("design gate: standing rules", () => {
  const STYLES_AND_MARKUP = SOURCE.filter(
    (file) => /^(app|components|lib)\//.test(file) && /\.(css|tsx?|svg)$/.test(file),
  );
  const STYLESHEETS = STYLES_AND_MARKUP.filter((file) => file.endsWith(".css"));

  it("raw colour values live only in app/globals.css and app/icon.svg", () => {
    const elsewhere = STYLES_AND_MARKUP.filter(
      (file) => file !== "app/globals.css" && file !== "app/icon.svg",
    );
    expect(
      scan(elsewhere, [
        // A hex colour: "#" and 3, 4, 6 or 8 hex digits that end the word (so "#featured" passes).
        {
          name: "hex colour",
          pattern: /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![0-9a-z_-])/i,
        },
        {
          name: "colour function",
          pattern: /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i,
        },
      ]),
    ).toEqual([]);
  });

  it("there is one theme: no stylesheet asks for the colour scheme", () => {
    expect(scan(STYLESHEETS, [literal("prefers-color-scheme")])).toEqual([]);
  });

  it("the only media queries are the two breakpoints and the three preference queries", () => {
    const allowed = new Set([
      "(min-width: 40em)",
      "(min-width: 68em)",
      "(hover: hover)",
      "(prefers-reduced-motion: reduce)",
      "(forced-colors: active)",
    ]);
    const others: string[] = [];
    for (const file of STYLESHEETS) {
      for (const match of read(file).matchAll(/@media\s+([^{]+?)\s*\{/g)) {
        const query = match[1] ?? "";
        if (!allowed.has(query)) others.push(`${file}: @media ${query}`);
      }
    }
    expect(others).toEqual([]);
  });

  it("container queries stay in the bar and the drawer, where a row has to fit", () => {
    const users = STYLESHEETS.filter((file) => /@container\b/.test(read(file)));
    expect(users).toEqual([
      "components/layout/header.module.css",
      "components/layout/nav-drawer.module.css",
    ]);
  });

  it("only components/ui/transition-link.tsx imports next/link", () => {
    const importers = STYLES_AND_MARKUP.filter((file) =>
      /from\s+["']next\/link["']/.test(read(file)),
    );
    expect(importers).toEqual(["components/ui/transition-link.tsx"]);
  });
});
