import { expect, test } from "vitest";
import { phaseCoverage } from "@/lib/catalog/coverage";
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
