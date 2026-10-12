import { describe, expect, test } from "vitest";
import { bundleSavingsCents, bundleValueCents, catalogPriceSpan } from "@/lib/catalog/pricing";
import type { Bundle } from "@/lib/catalog/schema";
import { makeTemplate, rawBundle } from "./fixtures/catalog";

const templates = [
  makeTemplate({ priceCents: 4900 }),
  makeTemplate({ slug: "b", priceCents: 2900 }),
];
const bundle = (priceCents: number) => rawBundle({ priceCents }) as Bundle;

test("bundle value is the sum of its template prices", () => {
  expect(bundleValueCents(templates)).toBe(7800);
  expect(bundleValueCents([])).toBe(0);
});

test("savings is value minus bundle price", () => {
  expect(bundleSavingsCents(bundle(5000), templates)).toBe(2800);
});

test("savings is never negative", () => {
  expect(bundleSavingsCents(bundle(9900), templates)).toBe(0);
});

describe("catalogPriceSpan", () => {
  const phases = ["make-the-case", "prepare"];
  const singles = [
    { slug: "deck", phase: "make-the-case", priceCents: 5900 },
    { slug: "brief", phase: "make-the-case", priceCents: 1900 },
    { slug: "playbook", phase: "prepare", priceCents: 4400 },
  ];

  test("runs from the cheapest template to the bundle that reaches every phase", () => {
    const bundles = [
      { templateSlugs: ["deck", "brief"], priceCents: 6900 },
      { templateSlugs: ["deck", "playbook"], priceCents: 8900 },
    ];
    expect(catalogPriceSpan(singles, bundles, phases)).toEqual({ fromCents: 1900, toCents: 8900 });
  });

  test("ignores a dearer bundle that misses a phase", () => {
    const bundles = [
      { templateSlugs: ["deck", "brief"], priceCents: 99900 },
      { templateSlugs: ["brief", "playbook"], priceCents: 5900 },
    ];
    expect(catalogPriceSpan(singles, bundles, phases)?.toCents).toBe(5900);
  });

  test("takes the dearest of several full-rollout bundles", () => {
    const bundles = [
      { templateSlugs: ["deck", "playbook"], priceCents: 8900 },
      { templateSlugs: ["brief", "deck", "playbook"], priceCents: 9900 },
    ];
    expect(catalogPriceSpan(singles, bundles, phases)?.toCents).toBe(9900);
  });

  test("leaves out the top end when no bundle covers the rollout", () => {
    const bundles = [{ templateSlugs: ["deck", "brief"], priceCents: 6900 }];
    expect(catalogPriceSpan(singles, bundles, phases)).toEqual({ fromCents: 1900 });
    expect(catalogPriceSpan(singles, bundles, [])).toEqual({ fromCents: 1900 });
  });

  test("has no span without templates", () => {
    expect(catalogPriceSpan([], [], phases)).toBeUndefined();
  });
});
