import { describe, expect, test } from "vitest";
import { coarseIndexAfter, countWords, splitWords } from "@/lib/motion/words";

describe("splitWords", () => {
  test("alternates word and space tokens", () => {
    expect(splitWords("Templates for every phase")).toEqual([
      { kind: "word", text: "Templates" },
      { kind: "space", text: " " },
      { kind: "word", text: "for" },
      { kind: "space", text: " " },
      { kind: "word", text: "every" },
      { kind: "space", text: " " },
      { kind: "word", text: "phase" },
    ]);
  });

  test("keeps a run of whitespace as one token, unchanged", () => {
    expect(splitWords("a  b")).toEqual([
      { kind: "word", text: "a" },
      { kind: "space", text: "  " },
      { kind: "word", text: "b" },
    ]);
    expect(splitWords("a\n b")[1]).toEqual({ kind: "space", text: "\n " });
  });

  test("drops the empty tokens that split() leaves at the edges", () => {
    expect(splitWords(" lead and trail ")).toEqual([
      { kind: "space", text: " " },
      { kind: "word", text: "lead" },
      { kind: "space", text: " " },
      { kind: "word", text: "and" },
      { kind: "space", text: " " },
      { kind: "word", text: "trail" },
      { kind: "space", text: " " },
    ]);
    expect(splitWords("")).toEqual([]);
    expect(splitWords("   ")).toEqual([{ kind: "space", text: "   " }]);
  });

  test("joining the tokens gives the sentence back (textContent stays plain)", () => {
    for (const sentence of [
      "Change management templates for Microsoft 365 rollouts",
      "Spend your time on the people, not on the paperwork.",
      "  odd   spacing\tand\nbreaks ",
      "single",
    ]) {
      expect(
        splitWords(sentence)
          .map((token) => token.text)
          .join(""),
      ).toBe(sentence);
    }
  });

  test("punctuation stays attached to its word", () => {
    expect(
      splitWords("practice, ready")
        .filter((token) => token.kind === "word")
        .map((token) => token.text),
    ).toEqual(["practice,", "ready"]);
  });
});

describe("countWords", () => {
  test("counts words, not whitespace", () => {
    expect(countWords("Change management templates for Microsoft 365 rollouts")).toBe(7);
    expect(countWords("Bundles")).toBe(1);
    expect(countWords("a  b")).toBe(2);
    expect(countWords("  padded  words  ")).toBe(2);
  });

  test("is zero for empty and blank strings", () => {
    expect(countWords("")).toBe(0);
    expect(countWords(" \n\t ")).toBe(0);
  });

  test("matches the number of word tokens", () => {
    const sentence = "Proven change content, so your M365 rollout gets used, not just launched.";
    expect(countWords(sentence)).toBe(
      splitWords(sentence).filter((token) => token.kind === "word").length,
    );
  });
});

describe("coarseIndexAfter", () => {
  test("converts the next free fine index into the following coarse index", () => {
    expect(coarseIndexAfter(3)).toBe(3);
    expect(coarseIndexAfter(6)).toBe(4);
    expect(coarseIndexAfter(8)).toBe(5);
  });

  test("handles the edges", () => {
    expect(coarseIndexAfter(0)).toBe(1);
    expect(coarseIndexAfter(1)).toBe(2);
    expect(coarseIndexAfter(2)).toBe(2);
  });

  test("the coarse slot never starts before the last word does", () => {
    // Fine step 50ms, coarse step 100ms: the last word sits at (n - 1) * 50ms.
    for (let next = 1; next <= 24; next += 1) {
      expect(coarseIndexAfter(next) * 100).toBeGreaterThan((next - 1) * 50);
    }
  });

  test("a label at 0 plus a 4-word title puts the body at coarse 4", () => {
    const wordOffset = 1;
    expect(coarseIndexAfter(wordOffset + countWords("Templates for every phase"))).toBe(4);
  });
});
