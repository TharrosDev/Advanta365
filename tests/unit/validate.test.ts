import { describe, expect, test } from "vitest";
import { CatalogError, validateCatalog } from "@/lib/catalog/validate";
import { rawBundle, rawCatalog, rawTemplate } from "./fixtures/catalog";

function withTemplate(overrides: Record<string, unknown>) {
  const catalog = rawCatalog();
  catalog.templates[0] = rawTemplate(overrides);
  return catalog;
}

describe("validateCatalog", () => {
  test("returns phases and their steps sorted by order", () => {
    const catalog = validateCatalog(rawCatalog());
    expect(catalog.phases.map((p) => p.slug)).toEqual(["prepare", "manage"]);
    expect(catalog.phases[1]?.steps.map((s) => s.slug)).toEqual(["plan", "train"]);
    expect(catalog.templates).toHaveLength(2);
    expect(catalog.bundles).toHaveLength(1);
  });

  test("names the template and field when a price is not positive", () => {
    expect(() => validateCatalog(withTemplate({ priceCents: 0 }))).toThrow(CatalogError);
    expect(() => validateCatalog(withTemplate({ priceCents: 0 }))).toThrow(
      /kickoff-deck.*priceCents/s,
    );
  });

  test("rejects duplicate template slugs", () => {
    const catalog = rawCatalog();
    catalog.templates.push(rawTemplate());
    expect(() => validateCatalog(catalog)).toThrow(/duplicate.*kickoff-deck/is);
  });

  test("allows a bundle and a template to share a slug", () => {
    const catalog = rawCatalog();
    catalog.bundles[0] = rawBundle({ slug: "kickoff-deck" });
    expect(() => validateCatalog(catalog)).not.toThrow();
  });

  test("rejects an unknown phase", () => {
    expect(() => validateCatalog(withTemplate({ phase: "nope" }))).toThrow(/nope/);
  });

  test("rejects a step that belongs to a different phase", () => {
    expect(() => validateCatalog(withTemplate({ phase: "prepare", step: "train" }))).toThrow(
      CatalogError,
    );
  });

  test("rejects a bundle that references a missing template", () => {
    const catalog = rawCatalog();
    catalog.bundles[0] = rawBundle({ templateSlugs: ["kickoff-deck", "missing-template"] });
    expect(() => validateCatalog(catalog)).toThrow(/missing-template/);
  });

  test("rejects an unknown deliverable type", () => {
    expect(() => validateCatalog(withTemplate({ deliverableType: "poster" }))).toThrow(
      CatalogError,
    );
  });

  test("rejects a slug that is not lower-case kebab", () => {
    expect(() => validateCatalog(withTemplate({ slug: "Kickoff Deck" }))).toThrow(CatalogError);
  });
});
