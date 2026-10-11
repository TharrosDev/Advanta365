import { describe, expect, test } from "vitest";
import { APPS, AUDIENCES, DELIVERABLE_TYPES, FORMATS } from "@/content/taxonomy";
import { bundleSavingsCents, bundleValueCents } from "@/lib/catalog/pricing";
import { DEFAULT_CRITERIA, queryTemplates } from "@/lib/catalog/query";
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

/** The rollout lifecycle: every phase in order, with its steps in order. */
const LIFECYCLE = [
  ["make-the-case", ["build-the-business-case", "secure-sponsorship"]],
  ["plan", ["assess-impact-and-readiness", "set-the-change-strategy"]],
  ["design", ["design-governance", "design-the-adoption-approach"]],
  ["prepare", ["build-the-champion-network", "train-each-audience"]],
  ["communicate", ["announce-the-change", "equip-sponsors-and-managers"]],
  ["execute", ["go-live", "run-hypercare"]],
  ["sustain", ["measure-adoption", "reinforce-and-hand-over"]],
];

const SMALL = [
  ..."zero one two three four five six seven eight nine ten".split(" "),
  ..."eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" "),
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** 0 to 99 in words, the way a bundle summary writes its template count. */
function inWords(n: number): string {
  if (n < 20) return SMALL[n]!;
  const tens = TENS[Math.floor(n / 10)]!;
  return n % 10 === 0 ? tens : `${tens}-${SMALL[n % 10]}`;
}

describe("sample catalog", () => {
  test("has the seven phases in order, each with two steps", async () => {
    const phases = await getPhases();
    expect(phases.map((p) => [p.slug, p.steps.map((s) => s.slug)])).toEqual(LIFECYCLE);
    expect(phases.map((p) => p.name)).toEqual([
      "Make the case",
      "Plan",
      "Design",
      "Prepare",
      "Communicate",
      "Execute",
      "Sustain",
    ]);
    expect(phases.map((p) => p.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(phases.every((p) => p.steps.length === 2)).toBe(true);
    expect((await getPhase("execute"))?.steps.map((s) => s.name)).toEqual([
      "Go live",
      "Run hypercare",
    ]);
  });

  test("has at least 60 templates, at least 3 in every step and 6 in every phase", async () => {
    const templates = await getTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(60);
    for (const phase of await getPhases()) {
      const inPhase = templates.filter((t) => t.phase === phase.slug);
      expect(inPhase.length, phase.slug).toBeGreaterThanOrEqual(6);
      for (const step of phase.steps) {
        const count = inPhase.filter((t) => t.step === step.slug).length;
        expect(count, `${phase.slug}/${step.slug}`).toBeGreaterThanOrEqual(3);
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

  test("lists the pieces the pitch names", async () => {
    for (const slug of [
      "copilot-readiness-assessment",
      "copilot-change-impact-assessment",
      "copilot-rollout-playbook",
      "sharepoint-cutover-playbook",
      "go-live-readiness-checklist",
      "meridian-group-worked-example",
      "im-representative-training-kit",
      "champion-network-playbook",
    ]) {
      expect(await getTemplate(slug), slug).toBeDefined();
    }
    expect((await getTemplate("go-live-readiness-checklist"))?.title).toBe(
      "Go/No-Go Decision Checklist",
    );
    expect((await getTemplate("im-representative-training-kit"))?.audiences).toEqual(["im-rep"]);
    expect((await getTemplate("site-owner-training-curriculum"))?.audiences).toEqual([
      "site-owner",
    ]);
  });

  test("features at least six templates, at least one in every phase", async () => {
    const featured = (await getTemplates()).filter((t) => t.featured);
    expect(featured.length).toBeGreaterThanOrEqual(6);
    for (const phase of await getPhases()) {
      expect(
        featured.some((t) => t.phase === phase.slug),
        phase.slug,
      ).toBe(true);
    }
  });

  test("the first six featured templates come from six different phases", async () => {
    // The home page shows the first six featured templates in catalog order.
    const shown = (await getTemplates()).filter((t) => t.featured).slice(0, 6);
    expect(new Set(shown.map((t) => t.phase)).size).toBe(6);
  });

  test("visible copy names no methodology or client, and follows the house typography", async () => {
    const [phases, templates, bundles] = await Promise.all([
      getPhases(),
      getTemplates(),
      getBundles(),
    ]);
    const copy = [
      ...phases.flatMap((p) => [p.name, p.summary, ...p.steps.flatMap((s) => [s.name, s.summary])]),
      ...templates.flatMap((t) => [t.title, t.summary, t.description, ...t.includes]),
      ...bundles.flatMap((b) => [b.title, b.summary, b.description]),
    ];
    const banned =
      /prosci|adkar|\bssc\b|\bdnd\b|gcdocs|docuverse|engage ?365|impact ?365|\b30 years|thirty years|bilingual|french/i;
    for (const text of copy) {
      expect(text, text).not.toMatch(banned);
      // Typographic apostrophes and quotes only, and no exclamation marks.
      expect(text, text).not.toMatch(/['"!]/);
    }
  });

  test("searching for “kickoff deck” finds only the sponsor kickoff deck", async () => {
    const result = queryTemplates(await getTemplates(), { ...DEFAULT_CRITERIA, q: "kickoff deck" });
    expect(result.items.map((t) => t.slug)).toEqual(["executive-sponsor-kickoff-deck"]);
    expect(result.items[0]?.priceCents).toBe(5900);
  });

  test("has five bundles, each 30–40% below the value of its contents", async () => {
    const bundles = await getBundles();
    expect(bundles.map((b) => b.slug).sort()).toEqual([
      "case-and-plan-kit",
      "design-and-prepare-kit",
      "launch-and-sustain-kit",
      "sharepoint-rollout-complete",
      "sponsor-essentials",
    ]);
    for (const bundle of bundles) {
      const templates = await getBundleTemplates(bundle);
      expect(templates).toHaveLength(bundle.templateSlugs.length);
      const discount = bundleSavingsCents(bundle, templates) / bundleValueCents(templates);
      expect(discount, bundle.slug).toBeGreaterThanOrEqual(0.3);
      expect(discount, bundle.slug).toBeLessThanOrEqual(0.4);
    }
  });

  test("every bundle summary states how many templates it holds", async () => {
    for (const bundle of await getBundles()) {
      const count = new Set(bundle.templateSlugs).size;
      expect(count, bundle.slug).toBe(bundle.templateSlugs.length);
      expect(bundle.summary.toLowerCase(), bundle.slug).toMatch(
        new RegExp(`^${inWords(count)} templates `),
      );
    }
  });

  test("the complete bundle spans the whole lifecycle and the sponsor set is unchanged", async () => {
    const complete = (await getBundle("sharepoint-rollout-complete"))!;
    const covered = new Set((await getBundleTemplates(complete)).map((t) => t.phase));
    expect([...covered].sort()).toEqual(LIFECYCLE.map(([slug]) => slug).sort());

    const sponsor = (await getBundle("sponsor-essentials"))!;
    expect(sponsor.priceCents).toBe(13900);
    expect(sponsor.templateSlugs).toEqual([
      "executive-sponsor-kickoff-deck",
      "sponsor-roles-brief",
      "sponsorship-roadmap",
      "sponsor-message-scripts",
      "sponsor-adoption-status-report",
      "change-closeout-report",
    ]);
  });
});

describe("repository lookups", () => {
  test("unknown slugs return undefined", async () => {
    expect(await getTemplate("does-not-exist")).toBeUndefined();
    expect(await getBundle("does-not-exist")).toBeUndefined();
    expect(await getPhase("does-not-exist")).toBeUndefined();
    expect(await getPhase("manage")).toBeUndefined();
    expect(await getTemplate("toString")).toBeUndefined();
  });

  test("finds a template and a bundle by slug", async () => {
    const kickoff = await getTemplate("executive-sponsor-kickoff-deck");
    expect(kickoff?.phase).toBe("make-the-case");
    expect(kickoff?.step).toBe("secure-sponsorship");
    expect((await getBundle("sponsor-essentials"))?.templateSlugs).toContain(
      "executive-sponsor-kickoff-deck",
    );
  });

  test("related templates exclude the template itself and list same-step ones first", async () => {
    const source = (await getTemplate("sharepoint-migration-impact-assessment"))!;
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

  test("related templates fall back to the rest of the phase when the step is small", async () => {
    const source = (await getTemplate("executive-sponsor-kickoff-deck"))!;
    const related = await getRelatedTemplates(source.slug);
    expect(related).toHaveLength(4);
    expect(related.some((t) => t.slug === source.slug)).toBe(false);
    expect(related.every((t) => t.phase === source.phase)).toBe(true);
    expect(related.slice(0, 2).every((t) => t.step === source.step)).toBe(true);
    expect(related.slice(2).every((t) => t.step !== source.step)).toBe(true);
  });

  test("related templates of an unknown slug is empty", async () => {
    expect(await getRelatedTemplates("does-not-exist")).toEqual([]);
  });

  test("finds the bundles that contain a template", async () => {
    const slugs = (await getBundlesContaining("executive-sponsor-kickoff-deck")).map((b) => b.slug);
    expect(slugs).toContain("sponsor-essentials");
    expect(slugs).toContain("case-and-plan-kit");
    expect(await getBundlesContaining("does-not-exist")).toEqual([]);
  });
});
