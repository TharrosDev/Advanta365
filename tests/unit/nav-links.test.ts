import { describe, expect, test } from "vitest";
import { currentPhase, singleCatalogPhase } from "@/components/layout/nav-links";

const PHASES = ["make-the-case", "prepare", "execute"];
const TEMPLATE_PHASES = { "kickoff-deck": "make-the-case" };

describe("singleCatalogPhase", () => {
  test("one known phase is the one", () => {
    expect(singleCatalogPhase(["prepare"], PHASES)).toBe("prepare");
  });

  test("repeats of the same phase still count as one", () => {
    expect(singleCatalogPhase(["prepare,prepare", "prepare"], PHASES)).toBe("prepare");
  });

  test("unknown values are ignored, as the catalog ignores them", () => {
    expect(singleCatalogPhase(["nope,prepare", "%00"], PHASES)).toBe("prepare");
  });

  test.each([[[]], [[""]], [["nope"]], [["prepare,execute"]], [["prepare", "execute"]]])(
    "%j names no single phase",
    (values) => {
      expect(singleCatalogPhase(values, PHASES)).toBeUndefined();
    },
  );
});

describe("currentPhase", () => {
  test("a phase page is that phase's own page", () => {
    expect(currentPhase("/phases/prepare", TEMPLATE_PHASES)).toEqual({
      slug: "prepare",
      kind: "page",
    });
  });

  test("a template page belongs to its phase", () => {
    expect(currentPhase("/templates/kickoff-deck", TEMPLATE_PHASES)).toEqual({
      slug: "make-the-case",
      kind: "true",
    });
    expect(currentPhase("/templates/unknown", TEMPLATE_PHASES)).toBeUndefined();
  });

  test("the catalog belongs to the one phase it is filtered on", () => {
    expect(currentPhase("/catalog", TEMPLATE_PHASES, "execute")).toEqual({
      slug: "execute",
      kind: "true",
    });
    expect(currentPhase("/catalog", TEMPLATE_PHASES)).toBeUndefined();
  });

  test("the catalog phase applies to the catalog only", () => {
    expect(currentPhase("/", TEMPLATE_PHASES, "execute")).toBeUndefined();
    expect(currentPhase("/bundles", TEMPLATE_PHASES, "execute")).toBeUndefined();
    expect(currentPhase("/phases/prepare", TEMPLATE_PHASES, "execute")?.slug).toBe("prepare");
  });
});
