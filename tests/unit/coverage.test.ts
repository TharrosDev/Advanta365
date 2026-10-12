import { describe, expect, test } from "vitest";
import {
  adjacentPhases,
  bundlesForPhase,
  coverageLabel,
  phaseCoverage,
  type PhaseCoverage,
} from "@/lib/catalog/coverage";
import type { Phase } from "@/lib/catalog/schema";
import { makeTemplate, rawPhases } from "./fixtures/catalog";

// The fixture lists "prepare" (order 2) before "make-the-case" (order 1) on purpose.
const phases = rawPhases as Phase[];
const kickoff = makeTemplate();
const training = makeTemplate({ slug: "training-plan", phase: "prepare", step: "train" });

test("there is one entry per phase, in rollout order", () => {
  const coverage = phaseCoverage(phases, []);
  expect(coverage.map((entry) => entry.slug)).toEqual(["make-the-case", "prepare"]);
  expect(coverage.map((entry) => entry.order)).toEqual([1, 2]);
  expect(coverage.map((entry) => entry.name)).toEqual(["Make the case", "Prepare"]);
});

test("a phase is covered when one of the templates belongs to it", () => {
  expect(phaseCoverage(phases, [kickoff])).toEqual([
    { order: 1, slug: "make-the-case", name: "Make the case", covered: true },
    { order: 2, slug: "prepare", name: "Prepare", covered: false },
  ]);
  expect(phaseCoverage(phases, [kickoff, training]).map((entry) => entry.covered)).toEqual([
    true,
    true,
  ]);
});

test("several templates in one phase cover it once", () => {
  const second = makeTemplate({ slug: "sponsor-brief" });
  const coverage = phaseCoverage(phases, [kickoff, second]);
  expect(coverage).toHaveLength(2);
  expect(coverage.filter((entry) => entry.covered).map((entry) => entry.slug)).toEqual([
    "make-the-case",
  ]);
});

test("without templates nothing is covered", () => {
  expect(phaseCoverage(phases, []).every((entry) => !entry.covered)).toBe(true);
});

test("a template of an unknown phase covers nothing and adds no entry", () => {
  const stray = makeTemplate({ slug: "stray", phase: "retired-phase" });
  expect(phaseCoverage(phases, [stray])).toEqual([
    { order: 1, slug: "make-the-case", name: "Make the case", covered: false },
    { order: 2, slug: "prepare", name: "Prepare", covered: false },
  ]);
});

test("the inputs are left as they were given", () => {
  const before = phases.map((phase) => phase.slug);
  phaseCoverage(phases, [kickoff]);
  expect(phases.map((phase) => phase.slug)).toEqual(before);
});

describe("coverageLabel", () => {
  const coverage = (...covered: number[]): PhaseCoverage[] =>
    [1, 2, 3, 4, 5, 6, 7].map((order) => ({
      order,
      slug: `p${order}`,
      name: `Phase ${order}`,
      covered: covered.includes(order),
    }));

  test("one phase is named in the singular", () => {
    expect(coverageLabel(coverage(4))).toBe("Covers phase 4");
  });

  test("neighbouring phases run together with an en dash", () => {
    expect(coverageLabel(coverage(3, 4))).toBe("Covers phases 3–4");
    expect(coverageLabel(coverage(1, 2, 3, 4, 5, 6, 7))).toBe("Covers phases 1–7");
  });

  test("separate runs are listed with commas, in order", () => {
    expect(coverageLabel(coverage(6, 1, 2, 4))).toBe("Covers phases 1–2, 4, 6");
  });

  test("nothing covered gives no words", () => {
    expect(coverageLabel(coverage())).toBe("");
  });
});

describe("bundlesForPhase", () => {
  const templates = [
    { slug: "a1", phase: "a" },
    { slug: "a2", phase: "a" },
    { slug: "a3", phase: "a" },
    { slug: "b1", phase: "b" },
    { slug: "b2", phase: "b" },
    { slug: "c1", phase: "c" },
  ];
  const bundle = (slug: string, templateSlugs: string[], priceCents = 10000) => ({
    slug,
    templateSlugs,
    priceCents,
  });

  test("lists only the bundles that hold a template of the phase", () => {
    const offers = bundlesForPhase(
      "c",
      [bundle("ab", ["a1", "b1"]), bundle("all", ["a1", "c1"])],
      templates,
    );
    expect(offers.map((offer) => offer.bundle.slug)).toEqual(["all"]);
    expect(offers[0]).toMatchObject({ inPhase: 1, total: 2 });
  });

  test("puts the most focused bundle first, then the one holding more, then the cheaper", () => {
    const offers = bundlesForPhase(
      "a",
      [
        bundle("everything", ["a1", "a2", "a3", "b1", "b2", "c1"]),
        bundle("kit", ["a1", "a2", "b1"]),
        bundle("pair", ["a1", "a2"], 9000),
        bundle("pair-dear", ["a2", "a3"], 9900),
        bundle("trio", ["a1", "a2", "a3"]),
      ],
      templates,
    );
    expect(offers.map((offer) => offer.bundle.slug)).toEqual([
      "trio",
      "pair",
      "pair-dear",
      "kit",
      "everything",
    ]);
  });

  test("a phase no bundle reaches has no offers", () => {
    expect(bundlesForPhase("z", [bundle("ab", ["a1", "b1"])], templates)).toEqual([]);
  });
});

describe("adjacentPhases", () => {
  test("names the phases on either side, in rollout order", () => {
    // The fixture lists "prepare" (order 2) before "make-the-case" (order 1).
    expect(adjacentPhases(phases, "make-the-case")).toEqual({
      previous: undefined,
      next: phases[0],
    });
    expect(adjacentPhases(phases, "prepare")).toEqual({ previous: phases[1], next: undefined });
  });

  test("an unknown phase has neither", () => {
    expect(adjacentPhases(phases, "nope")).toEqual({});
  });
});
