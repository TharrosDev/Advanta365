import { describe, expect, test } from "vitest";
import { DEFAULT_CRITERIA, type CatalogCriteria } from "@/lib/catalog/query";
import {
  catalogHref,
  parseCatalogParams,
  parseView,
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

  test("unknown sort falls back to samples", () => {
    expect(parse({ sort: "random" }).sort).toBe("samples");
    expect(parse({ sort: "price-desc" }).sort).toBe("samples");
    expect(parse({ sort: "title" }).sort).toBe("title");
  });

  test("free=1 asks for the free templates only; anything else does not", () => {
    expect(parse({ free: "1" }).free).toBe(true);
    expect(parse({ free: ["1", "0"] }).free).toBe(true);
    for (const free of ["0", "true", "", "2", undefined]) expect(parse({ free }).free).toBe(false);
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
      free: true,
      sort: "title",
      page: 3,
    };
    const params = new URLSearchParams(serializeCatalogParams(criteria));
    expect(parse(Object.fromEntries(params))).toEqual(criteria);
  });
});

describe("serializeCatalogParams and free", () => {
  test("free is written as free=1 after the facets and before the sort", () => {
    expect(
      serializeCatalogParams({ ...DEFAULT_CRITERIA, free: true, sort: "title", page: 2 }),
    ).toBe("free=1&sort=title&page=2");
  });

  test("free: false is left out", () => {
    expect(serializeCatalogParams({ ...DEFAULT_CRITERIA, free: false })).toBe("");
  });
});

describe("parseView", () => {
  test("accepts a template slug", () => {
    expect(parseView({ view: "change-management-strategy" })).toBe("change-management-strategy");
  });

  test.each([[""], ["../x"], ["A"], ["a/b"], ["a b"], ["-a"], ["a-"], ["a--b"]])(
    "rejects %j",
    (view) => {
      expect(parseView({ view })).toBeUndefined();
    },
  );

  test("is undefined when the parameter is absent", () => {
    expect(parseView({})).toBeUndefined();
    expect(parseView({ view: undefined })).toBeUndefined();
  });

  test("takes the first of a repeated parameter, and only if that one is valid", () => {
    expect(parseView({ view: ["go-live-readiness-checklist", "other"] })).toBe(
      "go-live-readiness-checklist",
    );
    expect(parseView({ view: ["../x", "go-live-readiness-checklist"] })).toBeUndefined();
  });
});

describe("catalogHref", () => {
  test("is /catalog alone for the defaults", () => {
    expect(catalogHref(DEFAULT_CRITERIA)).toBe("/catalog");
  });

  test("appends the query, leaving out defaults", () => {
    expect(catalogHref({ ...DEFAULT_CRITERIA, free: true })).toBe("/catalog?free=1");
    expect(catalogHref({ ...DEFAULT_CRITERIA, q: "kick off", page: 2 })).toBe(
      "/catalog?q=kick+off&page=2",
    );
  });

  test("puts view last", () => {
    expect(
      catalogHref({ ...DEFAULT_CRITERIA, free: true, page: 2 }, "go-live-readiness-checklist"),
    ).toBe("/catalog?free=1&page=2&view=go-live-readiness-checklist");
    expect(catalogHref(DEFAULT_CRITERIA, "go-live-readiness-checklist")).toBe(
      "/catalog?view=go-live-readiness-checklist",
    );
  });
});
