import { expect, test } from "vitest";
import { FOLDER_SHEETS, coverSpec, folderCovers } from "@/lib/catalog/covers";
import type { Phase } from "@/lib/catalog/schema";
import { makeTemplate, rawPhases } from "./fixtures/catalog";

const phases = rawPhases as Phase[];
const kickoff = makeTemplate();
const training = makeTemplate({
  slug: "training-plan",
  phase: "prepare",
  step: "train",
  deliverableType: "training",
  format: "docx",
});
const scorecard = makeTemplate({
  slug: "scorecard",
  deliverableType: "measurement",
  format: "xlsx",
});
const charter = makeTemplate({ slug: "charter", deliverableType: "governance", format: "pdf" });

test("a cover names the template's kind, format and the order of its phase", () => {
  expect(coverSpec(kickoff, phases)).toEqual({
    slug: "kickoff-deck",
    type: "sponsor",
    format: "pptx",
    phaseOrder: 1,
  });
  expect(coverSpec(training, phases).phaseOrder).toBe(2);
});

test("a cover whose phase is unknown has no numeral", () => {
  const cover = coverSpec(makeTemplate({ phase: "nowhere" }), phases);
  expect(cover).not.toHaveProperty("phaseOrder");
  expect(coverSpec(kickoff, []).phaseOrder).toBeUndefined();
});

test("a folder holds the covers of the first three templates, in the bundle's order", () => {
  expect(FOLDER_SHEETS).toBe(3);
  const covers = folderCovers([training, kickoff, scorecard, charter], phases);
  expect(covers.map((cover) => cover.slug)).toEqual(["training-plan", "kickoff-deck", "scorecard"]);
  expect(covers.map((cover) => cover.format)).toEqual(["docx", "pptx", "xlsx"]);
});

test("a folder with fewer templates holds them all, and a limit can narrow it", () => {
  expect(folderCovers([kickoff, training], phases)).toHaveLength(2);
  expect(folderCovers([kickoff, training, scorecard], phases, 1)).toHaveLength(1);
  expect(folderCovers([kickoff, training], phases, 0)).toEqual([]);
  expect(folderCovers([kickoff, training], phases, -2)).toEqual([]);
  expect(folderCovers([], phases)).toEqual([]);
});
