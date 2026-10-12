import type { Template } from "@/lib/catalog/schema";

export const rawPhases = [
  {
    slug: "prepare",
    name: "Prepare",
    summary: "Get people ready.",
    order: 2,
    steps: [
      { slug: "train", name: "Train", summary: "Train people.", order: 2 },
      { slug: "recruit", name: "Recruit", summary: "Recruit champions.", order: 1 },
    ],
  },
  {
    slug: "make-the-case",
    name: "Make the case",
    summary: "Explain why.",
    order: 1,
    steps: [{ slug: "sponsor", name: "Sponsor", summary: "Secure a sponsor.", order: 1 }],
  },
];

export function rawTemplate(overrides: Record<string, unknown> = {}) {
  return {
    slug: "kickoff-deck",
    title: "Sponsor Kickoff Deck",
    summary: "A deck for the kickoff.",
    description: "Slides an executive sponsor presents at project kickoff.",
    phase: "make-the-case",
    step: "sponsor",
    deliverableType: "sponsor",
    apps: ["sharepoint"],
    audiences: ["sponsor"],
    format: "pptx",
    adkar: ["awareness"],
    includes: ["12 slides"],
    free: false,
    isSample: true,
    ...overrides,
  };
}

/** Two phases' worth of templates, with exactly six of them free (the number the catalog requires). */
export function rawCatalog() {
  const extras = Array.from({ length: 6 }, (_, i) =>
    rawTemplate({ slug: `free-${i + 1}`, title: `Free ${i + 1}`, free: true }),
  );
  return {
    phases: rawPhases,
    templates: [
      rawTemplate(),
      rawTemplate({
        slug: "training-plan",
        title: "Training Plan",
        phase: "prepare",
        step: "train",
        deliverableType: "training",
        format: "docx",
      }),
      ...extras,
    ],
  };
}

export function makeTemplate(overrides: Partial<Template> = {}): Template {
  return rawTemplate(overrides) as Template;
}
