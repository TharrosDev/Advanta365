import type { Template } from "@/lib/catalog/schema";

export const rawPhases = [
  {
    slug: "build-the-training",
    name: "Build the training",
    label: "Build training",
    summary: "Build what each audience needs.",
    order: 2,
    number: 2,
  },
  {
    slug: "start-here",
    name: "Start here",
    label: "Start here",
    summary: "Get your bearings.",
    order: 0,
  },
  {
    slug: "define-the-change",
    name: "Define the change",
    label: "Define",
    summary: "Say what is changing and why.",
    order: 1,
    number: 1,
  },
];

export function rawTemplate(overrides: Record<string, unknown> = {}) {
  return {
    slug: "kickoff-deck",
    title: "Sponsor Kickoff Deck",
    summary: "A deck for the kickoff.",
    description: "Slides an executive sponsor presents at project kickoff.",
    phase: "define-the-change",
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

/** Two sections' worth of templates, with exactly six of them free (the number the catalog requires). */
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
        phase: "build-the-training",
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
