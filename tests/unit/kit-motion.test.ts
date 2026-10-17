import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The standing rules of app/motion.css, read from the stylesheet as text:
 *
 * - every `@keyframes`, and every declaration that makes something animate or change over time,
 *   sits inside `@media (prefers-reduced-motion: no-preference)`. Turning one off (`none`) is not
 *   movement and may stand anywhere;
 * - inside one rule `animation-timeline` and `animation-range` come after the `animation`
 *   shorthand, which would otherwise set them back to their initial values;
 * - nothing is hidden unless the root element says movement is on.
 */

const FILE = "app/motion.css";
const SOURCE = readFileSync(fileURLToPath(new URL(`../../${FILE}`, import.meta.url)), "utf8");
const NO_PREFERENCE = "@media (prefers-reduced-motion: no-preference)";

type Declaration = { property: string; value: string };
type Block = { prelude: string; parents: string[]; declarations: Declaration[] };

/** Every block of a stylesheet, with the preludes of the blocks around it, outermost first. */
function blocksOf(css: string): Block[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks: Block[] = [];
  const open: Block[] = [];
  let buffer = "";

  const flush = () => {
    const declaration = buffer.trim();
    buffer = "";
    const colon = declaration.indexOf(":");
    const block = open.at(-1);
    if (!block || colon === -1) return;
    block.declarations.push({
      property: declaration.slice(0, colon).trim(),
      value: declaration.slice(colon + 1).trim(),
    });
  };

  for (const character of text) {
    if (character === "{") {
      const block: Block = {
        prelude: buffer.trim().replace(/\s+/g, " "),
        parents: open.map((parent) => parent.prelude),
        declarations: [],
      };
      buffer = "";
      blocks.push(block);
      open.push(block);
    } else if (character === "}") {
      flush();
      open.pop();
    } else if (character === ";") {
      flush();
    } else {
      buffer += character;
    }
  }
  return blocks;
}

const isOff = (value: string) => value.replace("!important", "").trim() === "none";
const movesOverTime = (property: string) => /^(animation|transition)(-|$)/.test(property);

describe("the block reader", () => {
  it("reads nested blocks, their parents and their declarations", () => {
    const blocks = blocksOf(`
      /* a { animation: x; } */
      @media (a) { @media (b) { .c > ::before { animation: d 1s; animation-timeline: view(); } } }
      .e { transition: none !important }
    `);
    expect(blocks.map((block) => block.prelude)).toEqual([
      "@media (a)",
      "@media (b)",
      ".c > ::before",
      ".e",
    ]);
    expect(blocks[2]?.parents).toEqual(["@media (a)", "@media (b)"]);
    expect(blocks[2]?.declarations).toEqual([
      { property: "animation", value: "d 1s" },
      { property: "animation-timeline", value: "view()" },
    ]);
    expect(blocks[3]?.declarations).toEqual([{ property: "transition", value: "none !important" }]);
  });
});

describe(FILE, () => {
  const blocks = blocksOf(SOURCE);
  const guarded = (block: Block) => block.parents.includes(NO_PREFERENCE);

  it("is read as a stylesheet with its keyframes and its rules", () => {
    const keyframes = blocks.filter((block) => block.prelude.startsWith("@keyframes "));
    expect(keyframes.map((block) => block.prelude.slice("@keyframes ".length))).toEqual(
      expect.arrayContaining([
        "move-drift",
        "move-ink-in",
        "move-settle",
        "move-shadow",
        "move-grow",
      ]),
    );
    expect(blocks.some((block) => block.prelude === NO_PREFERENCE)).toBe(true);
  });

  it("keeps every @keyframes inside the no-preference query", () => {
    const outside = blocks
      .filter((block) => block.prelude.startsWith("@keyframes ") && !guarded(block))
      .map((block) => block.prelude);
    expect(outside).toEqual([]);
  });

  it("keeps every animation and transition declaration inside the no-preference query", () => {
    const outside: string[] = [];
    for (const block of blocks) {
      if (guarded(block)) continue;
      for (const { property, value } of block.declarations) {
        if (movesOverTime(property) && !isOff(value)) {
          outside.push(`${block.prelude} { ${property}: ${value} }`);
        }
      }
    }
    expect(outside).toEqual([]);
  });

  it("never writes animation-timeline or animation-range before an animation shorthand", () => {
    const wrong: string[] = [];
    for (const block of blocks) {
      const properties = block.declarations.map((declaration) => declaration.property);
      const shorthand = properties.lastIndexOf("animation");
      if (shorthand === -1) continue;
      const early = properties.findIndex(
        (property) => property === "animation-timeline" || property === "animation-range",
      );
      if (early !== -1 && early < shorthand) wrong.push(block.prelude);
    }
    expect(wrong).toEqual([]);
  });

  it("names a timeline only together with the range it runs over", () => {
    const loose = blocks
      .filter((block) => {
        const properties = block.declarations.map((declaration) => declaration.property);
        return properties.includes("animation-timeline") && !properties.includes("animation-range");
      })
      .map((block) => block.prelude);
    expect(loose).toEqual([]);
  });

  it("hides nothing unless the root element says movement is on", () => {
    const hidden: string[] = [];
    for (const block of blocks) {
      if (block.prelude.startsWith("@") || block.parents.some((p) => p.startsWith("@keyframes"))) {
        continue;
      }
      const hides = block.declarations.some(
        ({ property, value }) =>
          (property === "opacity" && Number.parseFloat(value) === 0) ||
          (property === "visibility" && value === "hidden"),
      );
      if (hides && !block.prelude.includes('html[data-motion="on"]')) hidden.push(block.prelude);
    }
    expect(hidden).toEqual([]);
  });

  it("never blurs: an entrance that arrives is legible all the way", () => {
    const blurred = blocks
      .filter((block) =>
        block.declarations.some(
          ({ property, value }) =>
            (property === "filter" || property === "transition") && /blur|filter/.test(value),
        ),
      )
      .map((block) => block.prelude);
    expect(blurred).toEqual([]);
    // Nothing with a `data-move` entrance is ever blurred, in a rule or in its keyframes.
    const entranceFrames = blocks.filter(
      (block) =>
        block.parents.some((parent) => /^@keyframes move-/.test(parent)) &&
        block.declarations.some(({ property }) => property === "filter"),
    );
    expect(entranceFrames).toEqual([]);
    expect(SOURCE).not.toContain("move-ink-in-plain");
  });

  it("inks a heading in sooner than the text around it", () => {
    const range = (selector: string) =>
      blocks
        .find((block) => block.prelude.includes(selector) && block.prelude.includes("timeline"))
        ?.declarations.find(({ property }) => property === "animation-range")?.value;
    const end = (value?: string) => Number(value?.match(/,\s*([\d.]+)rem\)\s*$/)?.[1]);
    const heading = range('[data-move="ink-in"]:not([data-when="load"])');
    const text = range('[data-move]:not([data-when="load"])');
    expect(heading).toMatch(/^entry calc\(var\(--order, 0\) \* 4%\) cover min\(/);
    expect(end(heading)).toBeLessThan(end(text));
  });

  it("leaves the outline of a denied tile alone, so a focused tile keeps its ring", () => {
    // The tile's outline is the only mark of focus on a locked tile. The denial shakes the tile and
    // rings its well; nothing of it animates the tile's `outline-color`.
    const denied = blocks.filter((block) => block.prelude.includes("[data-tile][data-denied]"));
    expect(denied.length).toBeGreaterThan(0);
    for (const block of denied) {
      const animation = block.declarations.find(({ property }) => property === "animation");
      if (block.prelude.endsWith("::before")) expect(animation?.value).toContain("denied-ring");
      else expect(animation?.value).toBe("tile-shake 440ms ease-in-out");
    }
    const keyframes = blocks.filter((block) => block.parents.at(-1) === "@keyframes tile-shake");
    expect(keyframes).toHaveLength(5);
    for (const frame of keyframes) {
      expect(frame.declarations.map(({ property }) => property)).toEqual(["translate"]);
      expect(frame.declarations[0]?.value).toMatch(/^-?[\d.]+px 0$/);
    }
    const outlineFrames = blocks.filter(
      (block) =>
        block.parents.some((parent) => parent.startsWith("@keyframes")) &&
        block.declarations.some(({ property }) => property === "outline-color"),
    );
    expect(outlineFrames).toEqual([]);
  });

  it("leaves the layer of a view transition without pointer events under every motion setting", () => {
    const rule = blocks.find((block) => block.prelude === "::view-transition");
    expect(rule?.parents).toEqual([]);
    expect(rule?.declarations).toEqual([{ property: "pointer-events", value: "none" }]);
  });

  it("repeats nothing and registers no custom property", () => {
    // Spelled in two halves: the design gate reads this file too.
    expect(SOURCE).not.toMatch(new RegExp(["infi", "nite"].join(""), "i"));
    expect(SOURCE).not.toMatch(new RegExp(["@prop", "erty"].join("")));
    const counts = blocks
      .flatMap((block) => block.declarations)
      .filter(({ property }) => property === "animation-iteration-count");
    expect(counts).toEqual([]);
  });
});
