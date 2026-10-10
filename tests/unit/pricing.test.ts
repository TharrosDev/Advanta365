import { expect, test } from "vitest";
import { bundleSavingsCents, bundleValueCents } from "@/lib/catalog/pricing";
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
