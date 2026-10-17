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

/**
 * The toolkit's folders, in order: slug, short label, plain name and step number. Only 01 to 11 are
 * numbered phases; Start here and Used at every step are not.
 */
const FOLDERS = [
  ["start-here", "Start here", "Start here", undefined],
  ["define-the-change", "Define", "Define the change", 1],
  ["assess-the-impact", "Assess", "Assess the impact", 2],
  ["set-the-strategy", "Strategize", "Set the strategy", 3],
  ["engage-leaders", "Engage", "Engage leaders", 4],
  ["plan-communications", "Communicate", "Plan communications", 5],
  ["design-the-platform", "Design", "Design the platform", 6],
  ["plan-the-training", "Plan training", "Plan the training", 7],
  ["build-the-training", "Build training", "Build the training", 8],
  ["deliver-training", "Train", "Deliver training", 9],
  ["go-live-and-support", "Go live", "Go live and support", 10],
  ["make-it-stick", "Sustain", "Make it stick", 11],
  ["used-at-every-step", "Every step", "Used at every step", undefined],
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
  test("has the toolkit's thirteen folders in order, numbered 1 to 11 between the two others", async () => {
    const phases = await getPhases();
    expect(phases.map((p) => [p.slug, p.label, p.name, p.number])).toEqual(FOLDERS);
    expect(phases.map((p) => p.order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect((await getPhase("go-live-and-support"))?.name).toBe("Go live and support");
  });

  test("has at least 60 templates, and at least one in every section", async () => {
    const templates = await getTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(60);
    for (const phase of await getPhases()) {
      const count = templates.filter((t) => t.phase === phase.slug).length;
      expect(count, phase.slug).toBeGreaterThanOrEqual(1);
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

  test("getFreeTemplates lists the six in folder order, from six different steps", async () => {
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
      ...phases.flatMap((p) => [p.name, p.label, p.summary]),
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

  test("the catalog opens on the six free samples in folder order, then the rest in folder order", async () => {
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
    expect(firstPage[0]?.slug).toBe("change-management-strategy");
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
    expect(kickoff?.phase).toBe("engage-leaders");
  });

  test("related templates exclude the template itself and come from its section", async () => {
    const source = (await getTemplate("sharepoint-migration-impact-assessment"))!;
    const related = await getRelatedTemplates(source.slug);
    expect(related).toHaveLength(4);
    expect(related.some((t) => t.slug === source.slug)).toBe(false);
    expect(related.every((t) => t.phase === source.phase)).toBe(true);

    // The section holds eight, so asking for ten gives the other seven.
    expect(await getRelatedTemplates(source.slug, 10)).toHaveLength(7);
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
