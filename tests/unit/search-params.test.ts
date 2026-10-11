import { describe, expect, test } from "vitest";
import { DEFAULT_CRITERIA, type CatalogCriteria } from "@/lib/catalog/query";
import {
  activeFilters,
  catalogHref,
  clearFiltersHref,
  parseCatalogParams,
  serializeCatalogParams,
} from "@/lib/catalog/search-params";

const PHASES = ["prepare", "execute", "sustain"];
const parse = (sp: Record<string, string | string[] | undefined>) => parseCatalogParams(sp, PHASES);

describe("parseCatalogParams", () => {
  test("empty params give the defaults", () => {
    expect(parse({})).toEqual(DEFAULT_CRITERIA);
  });

  test("reads comma-separated facet values", () => {
    const criteria = parse({ type: "training,plan", app: "teams", phase: "execute" });
    expect(criteria.type).toEqual(["training", "plan"]);
    expect(criteria.app).toEqual(["teams"]);
    expect(criteria.phase).toEqual(["execute"]);
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

describe("catalogHref and clearFiltersHref", () => {
  test("the defaults are the bare catalog", () => {
    expect(catalogHref(DEFAULT_CRITERIA)).toBe("/catalog");
    expect(clearFiltersHref(DEFAULT_CRITERIA)).toBe("/catalog");
  });

  test("clearing the filters keeps only the search term", () => {
    const criteria: CatalogCriteria = {
      ...DEFAULT_CRITERIA,
      q: "kickoff",
      type: ["training"],
      sort: "title",
      page: 2,
    };
    expect(catalogHref(criteria)).toBe("/catalog?q=kickoff&type=training&sort=title&page=2");
    expect(clearFiltersHref(criteria)).toBe("/catalog?q=kickoff");
    expect(clearFiltersHref({ ...criteria, q: "" })).toBe("/catalog");
  });
});

describe("activeFilters", () => {
  const phases = [
    { slug: "prepare", name: "Prepare" },
    { slug: "execute", name: "Execute" },
  ];

  test("no filters gives no chips, whatever the search", () => {
    expect(activeFilters({ ...DEFAULT_CRITERIA, q: "deck" }, phases)).toEqual([]);
  });

  test("lists each value facet by facet with its names", () => {
    const criteria: CatalogCriteria = {
      ...DEFAULT_CRITERIA,
      format: ["docx"],
      phase: ["execute", "prepare"],
      audience: ["im-rep"],
    };
    expect(
      activeFilters(criteria, phases).map(({ key, value, facet, label }) => [
        key,
        value,
        facet,
        label,
      ]),
    ).toEqual([
      ["phase", "execute", "Phase", "Execute"],
      ["phase", "prepare", "Phase", "Prepare"],
      ["audience", "im-rep", "Audience", "IM Representatives"],
      ["format", "docx", "File format", "Word"],
    ]);
  });

  test("each chip removes its own value, keeps the rest and returns to the first page", () => {
    const criteria: CatalogCriteria = {
      ...DEFAULT_CRITERIA,
      q: "plan",
      phase: ["prepare", "execute"],
      type: ["training"],
      sort: "price-asc",
      page: 3,
    };
    const hrefs = activeFilters(criteria, phases).map((filter) => filter.removeHref);
    expect(hrefs).toEqual([
      "/catalog?q=plan&phase=execute&type=training&sort=price-asc",
      "/catalog?q=plan&phase=prepare&type=training&sort=price-asc",
      "/catalog?q=plan&phase=prepare%2Cexecute&sort=price-asc",
    ]);
  });

  test("removing the last filter leaves the bare catalog", () => {
    const [only] = activeFilters({ ...DEFAULT_CRITERIA, app: ["teams"] }, phases);
    expect(only?.label).toBe("Teams");
    expect(only?.removeHref).toBe("/catalog");
  });

  test("a phase the list does not name shows its slug", () => {
    const [only] = activeFilters({ ...DEFAULT_CRITERIA, phase: ["sustain"] }, phases);
    expect(only?.label).toBe("sustain");
  });
});
