import { describe, expect, test } from "vitest";
import {
  CART_STORAGE_KEY,
  addLine,
  hasLine,
  parseCart,
  pruneLines,
  removeLine,
  type CartLine,
} from "@/lib/cart/store";

const deck: CartLine = { kind: "template", slug: "kickoff-deck" };
const kit: CartLine = { kind: "bundle", slug: "starter-kit" };

test("storage key is versioned", () => {
  expect(CART_STORAGE_KEY).toBe("advanta365.cart.v1");
});

describe("parseCart", () => {
  test.each([
    [null],
    [""],
    ["not json"],
    ["{}"],
    ["null"],
    ['[{"kind":"x","slug":"a"}]'],
    ['[{"kind":"template"}]'],
    ['[{"kind":"template","slug":5}]'],
    ['["template"]'],
  ])("returns an empty cart for %j", (raw) => {
    expect(parseCart(raw)).toEqual([]);
  });

  test("reads a valid cart", () => {
    expect(parseCart(JSON.stringify([deck, kit]))).toEqual([deck, kit]);
  });

  test("drops duplicate lines and extra fields", () => {
    const raw = JSON.stringify([deck, { ...deck, quantity: 9 }]);
    expect(parseCart(raw)).toEqual([deck]);
  });
});

describe("addLine", () => {
  test("adds a line without mutating the input", () => {
    const lines: CartLine[] = [];
    expect(addLine(lines, deck)).toEqual([deck]);
    expect(lines).toEqual([]);
  });

  test("adding the same line twice keeps one", () => {
    expect(addLine(addLine([], deck), { ...deck })).toEqual([deck]);
  });

  test("a template and a bundle with the same slug are different lines", () => {
    const bundle: CartLine = { kind: "bundle", slug: deck.slug };
    expect(addLine([deck], bundle)).toEqual([deck, bundle]);
  });
});

describe("removeLine and hasLine", () => {
  test("removes only the matching line", () => {
    expect(removeLine([deck, kit], deck)).toEqual([kit]);
  });

  test("removing an absent line changes nothing", () => {
    expect(removeLine([kit], deck)).toEqual([kit]);
  });

  test("hasLine matches on kind and slug", () => {
    expect(hasLine([deck], { ...deck })).toBe(true);
    expect(hasLine([deck], { kind: "bundle", slug: deck.slug })).toBe(false);
  });
});

test("pruneLines drops lines whose item no longer exists", () => {
  const known = { templates: new Set(["kickoff-deck"]), bundles: new Set<string>() };
  expect(pruneLines([deck, kit, { kind: "template", slug: "gone" }], known)).toEqual([deck]);
});
