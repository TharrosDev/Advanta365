import { describe, expect, test } from "vitest";
import { APPS, AUDIENCES, DELIVERABLE_TYPES, FORMATS } from "@/content/taxonomy";
import { DEFAULT_CRITERIA, queryTemplates } from "@/lib/catalog/query";
import {
  getFreeTemplates,
  getPhase,
  getPhases,
  getRelatedTemplates,
  getTemplate,
  getTemplates,
  getWorkedExampleContents,
  hasSampleContent,
} from "@/lib/catalog/repository";
import { FREE_SAMPLE_COUNT } from "@/lib/catalog/validate";

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

/** The six templates given away as samples. */
const FREE_SLUGS = [
  "executive-sponsor-kickoff-deck",
  "change-management-strategy",
  "sharepoint-governance-framework",
  "sharepoint-end-user-training-deck",
  "master-communications-plan",
  "go-live-readiness-checklist",
];

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
    expect(await hasSampleContent()).toBe(true);
  });

  test("no template carries a price or a featured flag", async () => {
    for (const t of await getTemplates()) {
      expect(t, t.slug).not.toHaveProperty("priceCents");
      expect(t, t.slug).not.toHaveProperty("featured");
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

  test("exactly 6 templates are free, and they are the named ones", async () => {
    expect(FREE_SAMPLE_COUNT).toBe(6);
    const free = (await getTemplates()).filter((t) => t.free);
    expect(free).toHaveLength(6);
    expect(free.map((t) => t.slug).sort()).toEqual([...FREE_SLUGS].sort());
    for (const slug of FREE_SLUGS) expect((await getTemplate(slug))?.free, slug).toBe(true);
  });

  test("getFreeTemplates lists the six in phase order, from six different phases", async () => {
    const free = await getFreeTemplates();
    expect(free.map((t) => t.slug).sort()).toEqual([...FREE_SLUGS].sort());
    expect(new Set(free.map((t) => t.phase)).size).toBe(6);
    const order = (await getPhases()).map((p) => p.slug);
    const positions = free.map((t) => order.indexOf(t.phase));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  test("visible copy names no methodology or client, and follows the house typography", async () => {
    const [phases, templates] = await Promise.all([getPhases(), getTemplates()]);
    const copy = [
      ...phases.flatMap((p) => [p.name, p.summary, ...p.steps.flatMap((s) => [s.name, s.summary])]),
      ...templates.flatMap((t) => [t.title, t.summary, t.description, ...t.includes]),
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
    expect(result.items[0]?.free).toBe(true);
  });

  test("the catalog opens on the six free samples in phase order, then the rest in phase order", async () => {
    const [templates, phases] = await Promise.all([getTemplates(), getPhases()]);
    const all = queryTemplates(templates, DEFAULT_CRITERIA, phases);
    const order = phases.map((phase) => phase.slug);
    const firstPage = all.items;
    expect(firstPage.slice(0, FREE_SAMPLE_COUNT).every((t) => t.free)).toBe(true);
    expect(firstPage.slice(FREE_SAMPLE_COUNT).some((t) => t.free)).toBe(false);
    for (const group of [
      firstPage.slice(0, FREE_SAMPLE_COUNT),
      firstPage.slice(FREE_SAMPLE_COUNT),
    ]) {
      const positions = group.map((t) => order.indexOf(t.phase));
      expect(positions).toEqual([...positions].sort((x, y) => x - y));
    }
    expect(firstPage[0]?.slug).toBe("executive-sponsor-kickoff-deck");
  });
});

describe("repository lookups", () => {
  test("unknown slugs return undefined", async () => {
    expect(await getTemplate("does-not-exist")).toBeUndefined();
    expect(await getPhase("does-not-exist")).toBeUndefined();
    expect(await getPhase("manage")).toBeUndefined();
    expect(await getTemplate("toString")).toBeUndefined();
  });

  test("finds a template by slug", async () => {
    const kickoff = await getTemplate("executive-sponsor-kickoff-deck");
    expect(kickoff?.phase).toBe("make-the-case");
    expect(kickoff?.step).toBe("secure-sponsorship");
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
});

describe("the worked example's contents", () => {
  test("every section names a place the catalog holds", async () => {
    const { sections } = await getWorkedExampleContents();
    expect(sections.length).toBeGreaterThan(0);
    for (const section of sections) expect(section.link, section.title).toBeDefined();
  });

  test("only a free sample's section links into the catalog, never to a page of its own", async () => {
    const { sections } = await getWorkedExampleContents();
    const free = new Set((await getFreeTemplates()).map((template) => template.title));
    const links = sections.flatMap((section) => (section.link ? [section.link] : []));
    const templates = links.filter((link) => link.kind === "Template");
    expect(templates.some((link) => link.href)).toBe(true);
    expect(templates.some((link) => !link.href)).toBe(true);
    for (const link of templates) {
      if (free.has(link.label)) expect(link.href).toMatch(/^\/catalog\?view=[a-z0-9-]+$/);
      else expect(link.href, link.label).toBeUndefined();
    }
    for (const link of links) expect(link.href ?? "").not.toMatch(/^\/templates\//);
  });
});
