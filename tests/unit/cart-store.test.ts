import { describe, expect, test } from "vitest";
import {
  CART_STORAGE_KEY,
  addLine,
  bundleHolding,
  cartSubtotalCents,
  coveredLines,
  hasLine,
  parseCart,
  pruneLines,
  removeLine,
  type BundleContents,
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

describe("bundle overlap", () => {
  const roadmap: CartLine = { kind: "template", slug: "roadmap" };
  const playbook: CartLine = { kind: "template", slug: "playbook" };
  const full: CartLine = { kind: "bundle", slug: "full-kit" };
  const contents: BundleContents = {
    "starter-kit": ["kickoff-deck", "roadmap"],
    "full-kit": ["kickoff-deck", "roadmap", "playbook"],
  };
  const prices: Record<string, number> = {
    "template:kickoff-deck": 5900,
    "template:roadmap": 4400,
    "template:playbook": 3900,
    "bundle:starter-kit": 9900,
    "bundle:full-kit": 79900,
  };
  const priceOf = (line: CartLine) => prices[`${line.kind}:${line.slug}`];

  test("bundleHolding finds the first bundle in cart order that holds the template", () => {
    expect(bundleHolding([full, kit], "kickoff-deck", contents)).toBe("full-kit");
    expect(bundleHolding([kit, full], "kickoff-deck", contents)).toBe("starter-kit");
    expect(bundleHolding([kit, full], "playbook", contents)).toBe("full-kit");
  });

  test("bundleHolding ignores templates, bundles that do not hold it and unknown bundles", () => {
    expect(bundleHolding([deck], "kickoff-deck", contents)).toBeUndefined();
    expect(bundleHolding([kit], "playbook", contents)).toBeUndefined();
    expect(
      bundleHolding([{ kind: "bundle", slug: "gone" }], "kickoff-deck", contents),
    ).toBeUndefined();
    expect(
      bundleHolding([{ kind: "bundle", slug: "toString" }], "kickoff-deck", contents),
    ).toBeUndefined();
  });

  test("coveredLines maps each held template line to its bundle", () => {
    const covered = coveredLines([deck, playbook, kit], contents);
    expect([...covered]).toEqual([["kickoff-deck", "starter-kit"]]);
  });

  test("coveredLines is empty without bundles", () => {
    expect(coveredLines([deck, roadmap], contents).size).toBe(0);
  });

  test("the subtotal is the plain sum when nothing overlaps", () => {
    expect(cartSubtotalCents([deck, playbook], priceOf, contents)).toBe(5900 + 3900);
    expect(cartSubtotalCents([playbook, kit], priceOf, contents)).toBe(3900 + 9900);
  });

  test("the subtotal leaves out templates a bundle in the cart holds", () => {
    expect(cartSubtotalCents([full, deck, playbook], priceOf, contents)).toBe(79900);
    expect(cartSubtotalCents([deck, roadmap, playbook, kit], priceOf, contents)).toBe(3900 + 9900);
  });

  test("two overlapping bundles are both charged", () => {
    expect(cartSubtotalCents([kit, full], priceOf, contents)).toBe(9900 + 79900);
  });

  test("a line with no known price counts as nothing", () => {
    expect(cartSubtotalCents([deck, { kind: "template", slug: "gone" }], priceOf, contents)).toBe(
      5900,
    );
  });
});
