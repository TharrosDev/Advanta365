import { describe, expect, test } from "vitest";
import { CatalogError, FREE_SAMPLE_COUNT, validateCatalog } from "@/lib/catalog/validate";
import { rawCatalog, rawTemplate } from "./fixtures/catalog";

function withTemplate(overrides: Record<string, unknown>) {
  const catalog = rawCatalog();
  catalog.templates[0] = rawTemplate(overrides);
  return catalog;
}

/** The fixture catalog with exactly `count` free templates. */
function withFreeCount(count: number) {
  const catalog = rawCatalog();
  catalog.templates = catalog.templates.map((template, index) => ({
    ...template,
    free: index < count,
  }));
  return catalog;
}

describe("validateCatalog", () => {
  test("returns phases and their steps sorted by order", () => {
    const catalog = validateCatalog(rawCatalog());
    expect(catalog.phases.map((p) => p.slug)).toEqual(["make-the-case", "prepare"]);
    expect(catalog.phases[1]?.steps.map((s) => s.slug)).toEqual(["recruit", "train"]);
    expect(catalog.templates).toHaveLength(8);
    expect(catalog).not.toHaveProperty("bundles");
  });

  test("requires six free samples", () => {
    expect(FREE_SAMPLE_COUNT).toBe(6);
    expect(() => validateCatalog(withFreeCount(6))).not.toThrow();
  });

  test.each([0, 5, 7, 8])("rejects a catalog with %i free templates", (count) => {
    expect(() => validateCatalog(withFreeCount(count))).toThrow(CatalogError);
    expect(() => validateCatalog(withFreeCount(count))).toThrow(/exactly 6.*free/is);
  });

  test("names the template and field when free is not a boolean", () => {
    expect(() => validateCatalog(withTemplate({ free: "yes" }))).toThrow(CatalogError);
    expect(() => validateCatalog(withTemplate({ free: "yes" }))).toThrow(/kickoff-deck.*free/s);
  });

  test("rejects duplicate template slugs", () => {
    const catalog = rawCatalog();
    catalog.templates.push(rawTemplate());
    expect(() => validateCatalog(catalog)).toThrow(/duplicate.*kickoff-deck/is);
  });

  test("rejects an unknown phase", () => {
    expect(() => validateCatalog(withTemplate({ phase: "nope" }))).toThrow(/nope/);
  });

  test("rejects a step that belongs to a different phase", () => {
    expect(() => validateCatalog(withTemplate({ phase: "make-the-case", step: "train" }))).toThrow(
      CatalogError,
    );
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
