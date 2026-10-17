import { describe, expect, test } from "vitest";
import { adjacentPhases, numberedPhases, phaseCoverage } from "@/lib/catalog/coverage";
import type { Phase } from "@/lib/catalog/schema";
import { makeTemplate, rawPhases } from "./fixtures/catalog";

// The fixture lists "build-the-training" (order 2) first and "start-here" (order 0, no number)
// between the two numbered phases, on purpose.
const phases = rawPhases as Phase[];
const kickoff = makeTemplate();
const training = makeTemplate({ slug: "training-plan", phase: "build-the-training" });
const intro = makeTemplate({ slug: "intro", phase: "start-here" });

test("there is one entry per numbered phase, in rollout order", () => {
  const coverage = phaseCoverage(phases, []);
  expect(coverage.map((entry) => entry.slug)).toEqual(["define-the-change", "build-the-training"]);
  expect(coverage.map((entry) => entry.number)).toEqual([1, 2]);
  expect(coverage.map((entry) => entry.name)).toEqual(["Define the change", "Build the training"]);
});

test("a step is covered when one of the templates belongs to it", () => {
  expect(phaseCoverage(phases, [kickoff])).toEqual([
    { number: 1, slug: "define-the-change", name: "Define the change", covered: true },
    { number: 2, slug: "build-the-training", name: "Build the training", covered: false },
  ]);
  expect(phaseCoverage(phases, [kickoff, training]).map((entry) => entry.covered)).toEqual([
    true,
    true,
  ]);
});

test("several templates in one step cover it once", () => {
  const second = makeTemplate({ slug: "sponsor-brief" });
  const coverage = phaseCoverage(phases, [kickoff, second]);
  expect(coverage).toHaveLength(2);
  expect(coverage.filter((entry) => entry.covered).map((entry) => entry.slug)).toEqual([
    "define-the-change",
  ]);
});

test("without templates nothing is covered", () => {
  expect(phaseCoverage(phases, []).every((entry) => !entry.covered)).toBe(true);
});

test("a template of an unnumbered or unknown section covers nothing and adds no entry", () => {
  const stray = makeTemplate({ slug: "stray", phase: "retired-phase" });
  expect(phaseCoverage(phases, [intro, stray]).map((entry) => entry.covered)).toEqual([
    false,
    false,
  ]);
});

test("the inputs are left as they were given", () => {
  const before = phases.map((phase) => phase.slug);
  phaseCoverage(phases, [kickoff]);
  numberedPhases(phases);
  expect(phases.map((phase) => phase.slug)).toEqual(before);
});

test("numberedPhases keeps the numbered phases, by number", () => {
  expect(numberedPhases(phases).map((phase) => phase.slug)).toEqual([
    "define-the-change",
    "build-the-training",
  ]);
});

describe("adjacentPhases", () => {
  test("names the sections on either side, in folder order, numbered or not", () => {
    const [build, intro, define] = phases;
    expect(adjacentPhases(phases, "start-here")).toEqual({ previous: undefined, next: define });
    expect(adjacentPhases(phases, "define-the-change")).toEqual({ previous: intro, next: build });
    expect(adjacentPhases(phases, "build-the-training")).toEqual({
      previous: define,
      next: undefined,
    });
  });

  test("an unknown section has neither", () => {
    expect(adjacentPhases(phases, "nope")).toEqual({});
  });
});
