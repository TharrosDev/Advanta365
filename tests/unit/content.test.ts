import { describe, expect, test } from "vitest";
import { APPS, AUDIENCES, DELIVERABLE_TYPES, FORMATS } from "@/content/taxonomy";
import { bundleSavingsCents, bundleValueCents } from "@/lib/catalog/pricing";
import {
  getBundle,
  getBundleTemplates,
  getBundles,
  getBundlesContaining,
  getPhase,
  getPhases,
  getRelatedTemplates,
  getTemplate,
  getTemplates,
  hasSampleContent,
} from "@/lib/catalog/repository";

describe("sample catalog", () => {
  test("has three phases in order, each with three steps", async () => {
    const phases = await getPhases();
    expect(phases.map((p) => p.slug)).toEqual(["prepare", "manage", "sustain"]);
    expect(phases.map((p) => p.prosciPhase)).toEqual([
      "Prepare Approach",
      "Manage Change",
      "Sustain Outcomes",
    ]);
    expect(phases.every((p) => p.steps.length === 3)).toBe(true);
    expect((await getPhase("manage"))?.steps.map((s) => s.slug)).toEqual([
      "plan-and-communicate",
      "train-and-enable",
      "launch-and-support",
    ]);
  });

  test("has at least 60 templates, at least 6 in every step", async () => {
    const templates = await getTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(60);
    for (const phase of await getPhases()) {
      for (const step of phase.steps) {
        const count = templates.filter(
          (t) => t.phase === phase.slug && t.step === step.slug,
        ).length;
        expect(count, `${phase.slug}/${step.slug}`).toBeGreaterThanOrEqual(6);
      }
    }
  });

  test("uses every taxonomy value at least once", async () => {
    const templates = await getTemplates();
    for (const type of DELIVERABLE_TYPES)
      expect(
        templates.some((t) => t.deliverableType === type),
        type,
      ).toBe(true);
    for (const app of APPS)
      expect(
        templates.some((t) => t.apps.includes(app)),
        app,
      ).toBe(true);
    for (const audience of AUDIENCES)
      expect(
        templates.some((t) => t.audiences.includes(audience)),
        audience,
      ).toBe(true);
    for (const format of FORMATS)
      expect(
        templates.some((t) => t.format === format),
        format,
      ).toBe(true);
  });

  test("every record is flagged as sample content", async () => {
    expect((await getTemplates()).every((t) => t.isSample)).toBe(true);
    expect((await getBundles()).every((b) => b.isSample)).toBe(true);
    expect(await hasSampleContent()).toBe(true);
  });

  test("template prices run from $19 to $79 in $5 steps", async () => {
    for (const t of await getTemplates()) {
      expect(t.priceCents, t.slug).toBeGreaterThanOrEqual(1900);
      expect(t.priceCents, t.slug).toBeLessThanOrEqual(7900);
      expect((t.priceCents - 1900) % 500, t.slug).toBe(0);
    }
  });

  test("has five bundles, each 30–40% below the value of its contents", async () => {
    const bundles = await getBundles();
    expect(bundles.map((b) => b.slug).sort()).toEqual([
      "manage-phase-kit",
      "prepare-phase-kit",
      "sharepoint-rollout-complete",
      "sponsor-essentials",
      "sustain-phase-kit",
    ]);
    for (const bundle of bundles) {
      const templates = await getBundleTemplates(bundle);
      expect(templates).toHaveLength(bundle.templateSlugs.length);
      const discount = bundleSavingsCents(bundle, templates) / bundleValueCents(templates);
      expect(discount, bundle.slug).toBeGreaterThanOrEqual(0.3);
      expect(discount, bundle.slug).toBeLessThanOrEqual(0.4);
    }
  });
});

describe("repository lookups", () => {
  test("unknown slugs return undefined", async () => {
    expect(await getTemplate("does-not-exist")).toBeUndefined();
    expect(await getBundle("does-not-exist")).toBeUndefined();
    expect(await getPhase("does-not-exist")).toBeUndefined();
    expect(await getTemplate("toString")).toBeUndefined();
  });

  test("finds a template and a bundle by slug", async () => {
    expect((await getTemplate("executive-sponsor-kickoff-deck"))?.phase).toBe("prepare");
    expect((await getBundle("sponsor-essentials"))?.templateSlugs).toContain(
      "executive-sponsor-kickoff-deck",
    );
  });

  test("related templates exclude the template itself and list same-step ones first", async () => {
    const source = (await getTemplate("executive-sponsor-kickoff-deck"))!;
    const related = await getRelatedTemplates(source.slug);
    expect(related).toHaveLength(4);
    expect(related.some((t) => t.slug === source.slug)).toBe(false);
    expect(related.every((t) => t.step === source.step)).toBe(true);

    const wide = await getRelatedTemplates(source.slug, 10);
    expect(wide).toHaveLength(10);
    const firstOtherStep = wide.findIndex((t) => t.step !== source.step);
    expect(firstOtherStep).toBeGreaterThan(0);
    expect(
      wide.slice(firstOtherStep).every((t) => t.step !== source.step && t.phase === source.phase),
    ).toBe(true);
  });

  test("related templates of an unknown slug is empty", async () => {
    expect(await getRelatedTemplates("does-not-exist")).toEqual([]);
  });

  test("finds the bundles that contain a template", async () => {
    const slugs = (await getBundlesContaining("executive-sponsor-kickoff-deck")).map((b) => b.slug);
    expect(slugs).toContain("sponsor-essentials");
    expect(slugs).toContain("prepare-phase-kit");
    expect(await getBundlesContaining("does-not-exist")).toEqual([]);
  });
});
