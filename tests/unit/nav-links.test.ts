import { describe, expect, test } from "vitest";
import { currentPhase, singleCatalogPhase } from "@/components/layout/nav-links";

const PHASES = ["make-the-case", "prepare", "execute"];

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
    expect(currentPhase("/phases/prepare")).toEqual({ slug: "prepare", kind: "page" });
  });

  test("no other page belongs to a phase: there are no template pages", () => {
    for (const path of ["/", "/about", "/purchase", "/sample", "/phases", "/phases/prepare/x"]) {
      expect(currentPhase(path), path).toBeUndefined();
    }
    expect(currentPhase("/templates/kickoff-deck")).toBeUndefined();
  });

  test("the catalog belongs to the one phase it is filtered on", () => {
    expect(currentPhase("/catalog", "execute")).toEqual({ slug: "execute", kind: "true" });
    expect(currentPhase("/catalog")).toBeUndefined();
  });

  test("the catalog phase applies to the catalog only", () => {
    expect(currentPhase("/", "execute")).toBeUndefined();
    expect(currentPhase("/purchase", "execute")).toBeUndefined();
    expect(currentPhase("/phases/prepare", "execute")).toEqual({ slug: "prepare", kind: "page" });
  });
});
