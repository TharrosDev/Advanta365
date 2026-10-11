import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The design gate. The site's look is its own: this file fails the build when a name, value or
 * technique that the design rules out comes back into the source, or when one of the standing rules
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

/** Each line of some text that matches a rule, as "file:line: rule". */
function scanText(file: string, text: string, rules: readonly Rule[]): string[] {
  const hits: string[] = [];
  text.split("\n").forEach((line, index) => {
    for (const rule of rules) {
      if (rule.pattern.test(line)) hits.push(`${file}:${index + 1}: ${rule.name}`);
    }
  });
  return hits;
}

/** Each line of each file that matches a rule, as "file:line: rule". */
function scan(files: readonly string[], rules: readonly Rule[]): string[] {
  return files.flatMap((file) => scanText(file, read(file), rules));
}

const SOURCE = ["app", "components", "lib", "tests"]
  .flatMap(filesUnder)
  .filter((file) => file !== SELF);

// What the design rules out. The words are matched whatever their case; the rest as written.
const RETIRED: Rule[] = [
  // The typeface and the base colour.
  literal("#181818", "i"),
  literal("Instrument", "i"),
  // Effects and graphics. Drawing surfaces and shader contexts are not ruled out: a few folders may
  // hold them, and the scoped rules further down keep them there.
  literal("wipe", "i"),
  literal("reveal", "i"),
  literal("sheen", "i"),
  literal("swirl", "i"),
  literal("liquid", "i"),
  literal("chrome", "i"),
  literal("wordmark", "i"),
  literal("mix-blend-mode"),
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

/**
 * Techniques that are allowed in a few places only: each is a pattern and the folders (ending in
 * "/") or files that may contain it. They apply to app/, components/ and lib/; tests may stub
 * whatever they need.
 */
type ScopedRule = Rule & { allowed: readonly string[] };

const INK_HOMES = ["lib/ink/", "components/ink/", "lib/boot/"] as const;

const SCOPED: ScopedRule[] = [
  { ...literal("<canvas"), allowed: INK_HOMES },
  { ...literal("getContext("), allowed: INK_HOMES },
  { ...literal("webgl", "i"), allowed: INK_HOMES },
  {
    ...literal("requestAnimationFrame"),
    allowed: ["lib/ink/", "components/ink/", "lib/scroll/", "lib/boot/", "components/intro/"],
  },
  {
    name: `"scroll" or 'scroll'`,
    pattern: /["']scroll["']/,
    allowed: ["lib/ink/", "components/ink/", "lib/scroll/"],
  },
];

const TEXT_FILE = /\.(css|tsx?|mjs|js|json|svg|glsl|frag|vert|md)$/;

/** The hits of the scoped rules over some files, each file read through `source`. */
function scopedHits(
  files: readonly string[],
  source: (file: string) => string,
  rules: readonly ScopedRule[] = SCOPED,
): string[] {
  const hits: string[] = [];
  for (const file of files) {
    if (!/^(app|components|lib)\//.test(file) || !TEXT_FILE.test(file)) continue;
    const text = source(file);
    for (const rule of rules) {
      if (
        rule.allowed.some((home) => file === home || (home.endsWith("/") && file.startsWith(home)))
      ) {
        continue;
      }
      hits.push(...scanText(file, text, [rule]));
    }
  }
  return hits;
}

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

describe("design gate: scoped techniques", () => {
  it("canvas, shader contexts, frame loops and scroll listeners stay in their own folders", () => {
    expect(scopedHits(SOURCE, read)).toEqual([]);
  });

  it("a hit outside the allow-list is reported, and one inside it is not", () => {
    const text: Record<string, string> = {
      "components/home/hero.tsx": "const gl = canvas.getContext('webgl2');\n<canvas />",
      "components/layout/footer.tsx": "requestAnimationFrame(tick);",
      "lib/format.ts": "window.addEventListener('scroll', onScroll);",
      "lib/ink/engine/gl.ts": "canvas.getContext('webgl2'); requestAnimationFrame(tick);",
      "components/ink/ink-layer.tsx": "<canvas />; addEventListener('scroll', f);",
      "lib/scroll/observe.ts": 'addEventListener("scroll", f); requestAnimationFrame(f);',
      "components/intro/intro-cover.tsx": "requestAnimationFrame(step);",
      "components/ui/odometer.tsx": "requestAnimationFrame(step);",
      "tests/unit/anything.test.ts": "canvas.getContext('webgl2');",
    };
    const hits = scopedHits(Object.keys(text), (file) => text[file] ?? "");
    expect(hits.sort()).toEqual(
      [
        "components/home/hero.tsx:1: getContext(",
        "components/home/hero.tsx:1: webgl",
        "components/home/hero.tsx:2: <canvas",
        "components/layout/footer.tsx:1: requestAnimationFrame",
        `lib/format.ts:1: "scroll" or 'scroll'`,
        "components/ui/odometer.tsx:1: requestAnimationFrame",
      ].sort(),
    );
  });

  it("the allow-lists name folders and files that exist or are yet to be written, nothing else", () => {
    for (const rule of SCOPED) {
      for (const home of rule.allowed) {
        expect(home, rule.name).toMatch(/^(app|components|lib)\//);
        expect(home.endsWith("/") || TEXT_FILE.test(home), `${rule.name}: ${home}`).toBe(true);
      }
    }
  });
});

describe("design gate: standing rules", () => {
  const STYLES_AND_MARKUP = SOURCE.filter(
    (file) => /^(app|components|lib)\//.test(file) && /\.(css|tsx?|svg|glsl|frag|vert)$/.test(file),
  );
  const STYLESHEETS = STYLES_AND_MARKUP.filter((file) => file.endsWith(".css"));

  it("raw colour values live only in app/globals.css and app/icon.svg", () => {
    // Scripts, stylesheets (app/motion.css among them) and shader files all count.
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

  it("no function is named after a colour model", () => {
    const named = STYLES_AND_MARKUP.filter(
      (file) => !file.endsWith(".css") && !file.endsWith(".svg"),
    );
    expect(
      scan(named, [
        {
          name: "function named after a colour model",
          // `function color(` or `const color = (…) =>`; a plain variable called color is fine.
          pattern:
            /\bfunction\s+(?:rgb|hsl|lab|lch|color)\s*[(<]|\b(?:const|let|var)\s+(?:rgb|hsl|lab|lch|color)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\(|function\b|\w+\s*=>)/,
        },
      ]),
    ).toEqual([]);
  });

  it("there is one theme: no stylesheet asks for the colour scheme", () => {
    expect(scan(STYLESHEETS, [literal("prefers-color-scheme")])).toEqual([]);
  });

  it("no stylesheet repeats an animation without end", () => {
    expect(scan(STYLESHEETS, [literal("infinite", "i")])).toEqual([]);
  });

  it("the only media queries are the two breakpoints and the preference queries", () => {
    const allowed = new Set([
      "(min-width: 40em)",
      "(min-width: 68em)",
      "(hover: hover)",
      "(prefers-reduced-motion: reduce)",
      "(forced-colors: active)",
      "(prefers-reduced-motion: no-preference)",
      "(prefers-contrast: more)",
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

  it("the runtime dependencies are next, react, react-dom and zod, and nothing else", () => {
    const manifest = JSON.parse(read("package.json")) as { dependencies?: Record<string, string> };
    expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual([
      "next",
      "react",
      "react-dom",
      "zod",
    ]);
  });
});
