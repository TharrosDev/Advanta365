import { describe, expect, test } from "vitest";
import {
  DEFAULT_CRITERIA,
  PAGE_SIZE,
  queryTemplates,
  type CatalogCriteria,
} from "@/lib/catalog/query";
import type { Template } from "@/lib/catalog/schema";
import { makeTemplate } from "./fixtures/catalog";

const TYPES = ["training", "communication", "plan"] as const;
const APPS = ["sharepoint", "teams", "onedrive"] as const;
const AUDIENCES = ["sponsor", "manager", "end-user"] as const;
const FORMATS = ["docx", "pptx"] as const;
const PHASES = ["prepare", "execute", "sustain"] as const;

// Six of the thirty are free.
const FREE_INDEXES = [5, 9, 12, 17, 20, 27];

// 30 templates: t00..t29, attributes cycle so every combination is predictable.
const templates: Template[] = Array.from({ length: 30 }, (_, i) => {
  const n = String(i).padStart(2, "0");
  return makeTemplate({
    slug: `t${n}`,
    title: `Template ${n}`,
    summary: `Summary ${n}`,
    description: `Description ${n}`,
    phase: PHASES[i % 3]!,
    deliverableType: TYPES[i % 3]!,
    apps: [APPS[i % 3]!],
    audiences: [AUDIENCES[(i + 1) % 3]!],
    format: FORMATS[i % 2]!,
    free: FREE_INDEXES.includes(i),
  });
});
templates[4] = { ...templates[4]!, title: "Sponsor Kickoff Deck" };

const query = (overrides: Partial<CatalogCriteria> = {}) =>
  queryTemplates(templates, { ...DEFAULT_CRITERIA, ...overrides });

describe("queryTemplates", () => {
  test("default criteria returns the first page of everything", () => {
    const result = query();
    expect(PAGE_SIZE).toBe(24);
    expect(result.total).toBe(30);
    expect(result.items).toHaveLength(24);
    expect(result.pageCount).toBe(2);
    expect(result.page).toBe(1);
  });

  test("filters by phase", () => {
    const result = query({ phase: ["execute"] });
    expect(result.total).toBe(10);
    expect(result.items.every((t) => t.phase === "execute")).toBe(true);
  });

  test("filters by deliverable type", () => {
    const result = query({ type: ["training"] });
    expect(result.total).toBe(10);
    expect(result.items.every((t) => t.deliverableType === "training")).toBe(true);
  });

  test("filters by app", () => {
    const result = query({ app: ["teams"] });
    expect(result.total).toBe(10);
    expect(result.items.every((t) => t.apps.includes("teams"))).toBe(true);
  });

  test("filters by audience", () => {
    const result = query({ audience: ["sponsor"] });
    expect(result.total).toBe(10);
    expect(result.items.every((t) => t.audiences.includes("sponsor"))).toBe(true);
  });

  test("filters by format", () => {
    const result = query({ format: ["pptx"] });
    expect(result.total).toBe(15);
    expect(result.items.every((t) => t.format === "pptx")).toBe(true);
  });

  test("values within one facet are OR", () => {
    expect(query({ app: ["sharepoint", "teams"] }).total).toBe(20);
  });

  test("different facets are AND", () => {
    const result = query({ phase: ["prepare"], format: ["docx"] });
    expect(result.total).toBe(5);
    expect(result.items.every((t) => t.phase === "prepare" && t.format === "docx")).toBe(true);
  });

  test("search matches every term, case-insensitively", () => {
    expect(query({ q: "kickoff DECK" }).items.map((t) => t.slug)).toEqual(["t04"]);
    expect(query({ q: "kickoff zzz" }).total).toBe(0);
  });

  test("search also looks in summary and description", () => {
    expect(query({ q: "summary 07" }).items.map((t) => t.slug)).toEqual(["t07"]);
    expect(query({ q: "description 09" }).items.map((t) => t.slug)).toEqual(["t09"]);
  });

  test("search treats straight and typographic apostrophes and quotes alike", () => {
    const marked = [
      ...templates,
      makeTemplate({
        slug: "marks",
        title: "What’s Changing for Me",
        summary: "The “launch day” note.",
      }),
    ];
    const find = (q: string) =>
      queryTemplates(marked, { ...DEFAULT_CRITERIA, q }).items.map((t) => t.slug);

    expect(find("what's changing")).toEqual(["marks"]);
    expect(find("What’s changing")).toEqual(["marks"]);
    expect(find('"launch')).toEqual(["marks"]);
    expect(find("“launch")).toEqual(["marks"]);
  });

  test("search treats regex characters and very long text literally", () => {
    expect(query({ q: "(a*\\" }).total).toBe(0);
    expect(query({ q: "x".repeat(600) }).total).toBe(0);
  });

  test("sorts the free samples first, then by title", () => {
    expect(DEFAULT_CRITERIA.sort).toBe("samples");
    const slugs = query().items.map((t) => t.slug);
    expect(slugs.slice(0, 6)).toEqual(["t05", "t09", "t12", "t17", "t20", "t27"]);
    expect(slugs.slice(6, 8)).toEqual(["t04", "t00"]);
  });

  test("free: true keeps only the free templates", () => {
    expect(DEFAULT_CRITERIA.free).toBe(false);
    const result = query({ free: true });
    expect(result.total).toBe(6);
    expect(result.items.every((t) => t.free)).toBe(true);
  });

  test("the free filter combines with the facets and the search", () => {
    expect(query({ free: true, phase: ["sustain"] }).items.map((t) => t.slug)).toEqual(
      ["t05", "t17", "t20"].filter(
        (slug) => templates.find((t) => t.slug === slug)?.phase === "sustain",
      ),
    );
    expect(query({ free: true, q: "template 09" }).items.map((t) => t.slug)).toEqual(["t09"]);
    expect(query({ free: true, q: "kickoff" }).total).toBe(0);
  });

  test("the facet counts respect the free filter", () => {
    const counts = query({ free: true }).facets.phase;
    expect(Object.values(counts).reduce((sum, n) => sum + n, 0)).toBe(6);
  });

  test("sorts by title", () => {
    expect(
      query({ sort: "title" })
        .items.slice(0, 3)
        .map((t) => t.slug),
    ).toEqual(["t04", "t00", "t01"]);
  });

  test("second page holds the remainder", () => {
    const result = query({ page: 2 });
    expect(result.items).toHaveLength(6);
    expect(result.page).toBe(2);
  });

  test("out-of-range pages are clamped", () => {
    expect(query({ page: 0 }).page).toBe(1);
    expect(query({ page: -3 }).page).toBe(1);
    expect(query({ page: 9999 }).page).toBe(2);
    expect(query({ page: 9999 }).items).toHaveLength(6);
  });

  test("zero results still returns a page and all facet keys", () => {
    const result = query({ q: "zzzz" });
    expect(result).toMatchObject({ items: [], total: 0, page: 1, pageCount: 1 });
    expect(Object.keys(result.facets).sort()).toEqual([
      "app",
      "audience",
      "format",
      "phase",
      "type",
    ]);
  });

  test("a facet's counts ignore its own selection but respect the others", () => {
    const result = query({ type: ["training"] });
    expect(result.facets.type).toMatchObject({ training: 10, communication: 10, plan: 10 });
    expect(result.facets.phase).toEqual({ prepare: 10 });
    expect(result.facets.format).toEqual({ docx: 5, pptx: 5 });
  });

  test("does not mutate its input", () => {
    const before = templates.map((t) => t.slug);
    query({ sort: "title" });
    expect(templates.map((t) => t.slug)).toEqual(before);
  });
});
