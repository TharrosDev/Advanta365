import { describe, expect, test } from "vitest";
import { DEFAULT_CRITERIA, type CatalogCriteria } from "@/lib/catalog/query";
import { parseCatalogParams, serializeCatalogParams } from "@/lib/catalog/search-params";

const PHASES = ["prepare", "manage", "sustain"];
const parse = (sp: Record<string, string | string[] | undefined>) => parseCatalogParams(sp, PHASES);

describe("parseCatalogParams", () => {
  test("empty params give the defaults", () => {
    expect(parse({})).toEqual(DEFAULT_CRITERIA);
  });

  test("reads comma-separated facet values", () => {
    const criteria = parse({ type: "training,plan", app: "teams", phase: "manage" });
    expect(criteria.type).toEqual(["training", "plan"]);
    expect(criteria.app).toEqual(["teams"]);
    expect(criteria.phase).toEqual(["manage"]);
  });

  test("drops unknown values", () => {
    const criteria = parse({
      type: "training,poster",
      phase: "nope",
      format: "exe",
      audience: "ceo",
    });
    expect(criteria.type).toEqual(["training"]);
    expect(criteria.phase).toEqual([]);
    expect(criteria.format).toEqual([]);
    expect(criteria.audience).toEqual([]);
  });

  test("merges and de-duplicates repeated keys", () => {
    expect(parse({ app: ["teams", "sharepoint,teams"] }).app).toEqual(["teams", "sharepoint"]);
  });

  test.each([["abc"], ["-3"], ["0"], ["2.5"], [""], ["1e9999"]])(
    "page %j falls back to 1",
    (page) => {
      expect(parse({ page }).page).toBe(1);
    },
  );

  test("reads a valid page, taking the first of repeated keys", () => {
    expect(parse({ page: "3" }).page).toBe(3);
    expect(parse({ page: ["4", "abc"] }).page).toBe(4);
  });

  test("unknown sort falls back to featured", () => {
    expect(parse({ sort: "random" }).sort).toBe("featured");
    expect(parse({ sort: "price-desc" }).sort).toBe("price-desc");
  });

  test("trims the search text and caps it at 200 characters", () => {
    expect(parse({ q: "  hi  " }).q).toBe("hi");
    expect(parse({ q: "x".repeat(500) }).q).toHaveLength(200);
  });
});

describe("serializeCatalogParams", () => {
  test("defaults serialize to an empty string", () => {
    expect(serializeCatalogParams(DEFAULT_CRITERIA)).toBe("");
  });

  test("emits keys in a fixed order and omits defaults", () => {
    const criteria: CatalogCriteria = {
      ...DEFAULT_CRITERIA,
      page: 2,
      app: ["teams", "sharepoint"],
      q: "kick off",
    };
    expect(serializeCatalogParams(criteria)).toBe("q=kick+off&app=teams%2Csharepoint&page=2");
  });

  test("round-trips every field", () => {
    const criteria: CatalogCriteria = {
      q: "sponsor & deck",
      phase: ["prepare", "sustain"],
      type: ["training", "plan"],
      app: ["sharepoint"],
      audience: ["manager", "end-user"],
      format: ["pptx"],
      sort: "price-asc",
      page: 3,
    };
    const params = new URLSearchParams(serializeCatalogParams(criteria));
    expect(parse(Object.fromEntries(params))).toEqual(criteria);
  });
});
