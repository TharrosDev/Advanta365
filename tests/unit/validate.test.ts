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
  test("returns the sections sorted by order", () => {
    const catalog = validateCatalog(rawCatalog());
    expect(catalog.phases.map((p) => p.slug)).toEqual([
      "start-here",
      "define-the-change",
      "build-the-training",
    ]);
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

  test("rejects step numbers that do not run 1, 2, 3 in order", () => {
    const skipped = rawCatalog();
    skipped.phases = skipped.phases.map((phase) =>
      phase.number === 2 ? { ...phase, number: 3 } : phase,
    );
    expect(() => validateCatalog(skipped)).toThrow(/run 1 to 2 in order, found 1, 3/);

    const swapped = rawCatalog();
    swapped.phases = swapped.phases.map((phase) =>
      phase.number === undefined ? phase : { ...phase, number: 3 - phase.number },
    );
    expect(() => validateCatalog(swapped)).toThrow(CatalogError);
  });

  test("rejects a section without a short label", () => {
    const catalog = rawCatalog();
    catalog.phases = catalog.phases.map((phase) => ({ ...phase, label: undefined })) as never;
    expect(() => validateCatalog(catalog)).toThrow(/label/);
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

describe("file records", () => {
  const sha = "a".repeat(64);
  const file = (overrides: Record<string, unknown> = {}) => ({
    id: "deck",
    name: "Sponsor Kickoff Deck.pptx",
    key: "make-the-case/kickoff-deck/kickoff-deck.pptx",
    bytes: 1024,
    sha256: sha,
    ...overrides,
  });

  test("defaults files to an empty list when the field is absent", () => {
    const catalog = validateCatalog(rawCatalog());
    expect(catalog.templates[0]?.files).toEqual([]);
  });

  test("accepts a sample record with no files", () => {
    expect(() => validateCatalog(withTemplate({ files: [] }))).not.toThrow();
  });

  test("accepts a record with a well-formed file", () => {
    const catalog = validateCatalog(withTemplate({ files: [file()] }));
    expect(catalog.templates[0]?.files).toEqual([file()]);
  });

  test("rejects a file key with ..", () => {
    expect(() =>
      validateCatalog(withTemplate({ files: [file({ key: "plan/../x.docx" })] })),
    ).toThrow(/files\.0\.key/);
  });

  test.each(["/plan/x.docx", "plan\\x.docx", "plan//x.docx", "Plan/x.docx"])(
    "rejects the key %s",
    (key) => {
      expect(() => validateCatalog(withTemplate({ files: [file({ key })] }))).toThrow(
        /files\.0\.key/,
      );
    },
  );

  test.each(["Plan.exe", "Plan", ".pptx", "../Plan.pptx", 'Plan".pptx'])(
    "rejects the file name %s",
    (name) => {
      expect(() => validateCatalog(withTemplate({ files: [file({ name })] }))).toThrow(
        /files\.0\.name/,
      );
    },
  );

  test.each(["a".repeat(63), "A".repeat(64), "g".repeat(64)])("rejects the sha256 %s", (sha256) => {
    expect(() => validateCatalog(withTemplate({ files: [file({ sha256 })] }))).toThrow(
      /files\.0\.sha256/,
    );
  });

  test.each([0, -1, 1.5])("rejects a size of %s bytes", (bytes) => {
    expect(() => validateCatalog(withTemplate({ files: [file({ bytes })] }))).toThrow(
      /files\.0\.bytes/,
    );
  });

  test("rejects two files sharing a key across templates", () => {
    const catalog = rawCatalog();
    catalog.templates[0] = rawTemplate({ files: [file()] });
    (catalog.templates as Record<string, unknown>[])[1] = {
      ...catalog.templates[1],
      files: [file({ id: "other" })],
    };
    expect(() => validateCatalog(catalog)).toThrow(
      'Duplicate file key "make-the-case/kickoff-deck/kickoff-deck.pptx"',
    );
  });

  test("rejects two files sharing an id in one template", () => {
    const files = [file(), file({ key: "make-the-case/kickoff-deck/other.pptx" })];
    expect(() => validateCatalog(withTemplate({ files }))).toThrow(
      'Duplicate file id "deck" in template "kickoff-deck"',
    );
  });

  test("rejects a real record with no files", () => {
    expect(() => validateCatalog(withTemplate({ isSample: false, files: [] }))).toThrow(
      'Template "kickoff-deck" is not a sample and has no files',
    );
  });

  test("accepts a real record with a file", () => {
    expect(() => validateCatalog(withTemplate({ isSample: false, files: [file()] }))).not.toThrow();
  });
});
