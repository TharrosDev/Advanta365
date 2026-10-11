import { describe, expect, test } from "vitest";
import {
  DEFAULT_CRITERIA,
  PAGE_SIZE,
  queryTemplates,
  type CatalogCriteria,
} from "@/lib/catalog/query";
import type { Phase, Template } from "@/lib/catalog/schema";
import { makeTemplate, rawPhases } from "./fixtures/catalog";

const TYPES = ["training", "communication", "plan"] as const;
const APPS = ["sharepoint", "teams", "onedrive"] as const;
const AUDIENCES = ["sponsor", "manager", "end-user"] as const;
const FORMATS = ["docx", "pptx"] as const;
const PHASES = ["prepare", "execute", "sustain"] as const;

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
    priceCents: 1000 + ((i * 7) % 30) * 100,
    featured: i === 20 || i === 5,
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

  test("the default order is phase order", () => {
    expect(DEFAULT_CRITERIA.sort).toBe("phase");
  });

  test("sorts by phase, then by step, keeping the given order inside a step", () => {
    // Given out of order: the fixture lists "prepare" (order 2) first, with its steps reversed.
    const phases = rawPhases as Phase[];
    const listed = [
      makeTemplate({ slug: "train-a", phase: "prepare", step: "train" }),
      makeTemplate({ slug: "recruit-a", phase: "prepare", step: "recruit" }),
      makeTemplate({ slug: "sponsor-a", phase: "make-the-case", step: "sponsor" }),
      makeTemplate({ slug: "train-b", phase: "prepare", step: "train" }),
      makeTemplate({ slug: "recruit-b", phase: "prepare", step: "recruit" }),
    ];
    const order = (sort: CatalogCriteria["sort"]) =>
      queryTemplates(listed, { ...DEFAULT_CRITERIA, sort }, phases).items.map((t) => t.slug);

    expect(order("phase")).toEqual(["sponsor-a", "recruit-a", "recruit-b", "train-a", "train-b"]);
    // The other orders do not depend on the phases.
    expect(order("title")).toEqual(
      queryTemplates(listed, { ...DEFAULT_CRITERIA, sort: "title" }).items.map((t) => t.slug),
    );
  });

  test("phase order puts a phase or step it does not know last, and keeps the input without phases", () => {
    const phases = rawPhases as Phase[];
    const listed = [
      makeTemplate({ slug: "stray", phase: "retired", step: "gone" }),
      makeTemplate({ slug: "odd-step", phase: "prepare", step: "gone" }),
      makeTemplate({ slug: "recruit", phase: "prepare", step: "recruit" }),
      makeTemplate({ slug: "sponsor", phase: "make-the-case", step: "sponsor" }),
    ];
    const slugs = (given: Phase[]) =>
      queryTemplates(listed, DEFAULT_CRITERIA, given).items.map((t) => t.slug);

    expect(slugs(phases)).toEqual(["sponsor", "recruit", "odd-step", "stray"]);
    expect(slugs([])).toEqual(["stray", "odd-step", "recruit", "sponsor"]);
  });

  test("sorts featured first, then by title", () => {
    expect(
      query({ sort: "featured" })
        .items.slice(0, 3)
        .map((t) => t.slug),
    ).toEqual(["t05", "t20", "t04"]);
  });

  test("sorts by title", () => {
    expect(
      query({ sort: "title" })
        .items.slice(0, 3)
        .map((t) => t.slug),
    ).toEqual(["t04", "t00", "t01"]);
  });

  test("sorts by price ascending and descending", () => {
    const asc = query({ sort: "price-asc" }).items.map((t) => t.priceCents);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(asc[0]).toBe(1000);
    const desc = query({ sort: "price-desc" }).items.map((t) => t.priceCents);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    expect(desc[0]).toBe(3900);
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
    query({ sort: "price-desc" });
    expect(templates.map((t) => t.slug)).toEqual(before);
  });
});
