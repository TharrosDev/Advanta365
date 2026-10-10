import type { Template } from "@/lib/catalog/schema";

export const rawPhases = [
  {
    slug: "manage",
    name: "Manage",
    prosciPhase: "Manage Change",
    summary: "Run the change.",
    order: 2,
    steps: [
      { slug: "train", name: "Train", summary: "Train people.", order: 2 },
      { slug: "plan", name: "Plan", summary: "Plan the work.", order: 1 },
    ],
  },
  {
    slug: "prepare",
    name: "Prepare",
    prosciPhase: "Prepare Approach",
    summary: "Get ready.",
    order: 1,
    steps: [{ slug: "define", name: "Define", summary: "Define success.", order: 1 }],
  },
];

export function rawTemplate(overrides: Record<string, unknown> = {}) {
  return {
    slug: "kickoff-deck",
    title: "Sponsor Kickoff Deck",
    summary: "A deck for the kickoff.",
    description: "Slides an executive sponsor presents at project kickoff.",
    phase: "prepare",
    step: "define",
    deliverableType: "sponsor",
    apps: ["sharepoint"],
    audiences: ["sponsor"],
    format: "pptx",
    adkar: ["awareness"],
    priceCents: 4900,
    includes: ["12 slides"],
    featured: false,
    isSample: true,
    ...overrides,
  };
}

export function rawBundle(overrides: Record<string, unknown> = {}) {
  return {
    slug: "starter-kit",
    title: "Starter Kit",
    summary: "Two templates.",
    description: "A small kit.",
    templateSlugs: ["kickoff-deck", "training-plan"],
    priceCents: 6900,
    featured: false,
    isSample: true,
    ...overrides,
  };
}

export function rawCatalog() {
  return {
    phases: rawPhases,
    templates: [
      rawTemplate(),
      rawTemplate({
        slug: "training-plan",
        title: "Training Plan",
        phase: "manage",
        step: "train",
        deliverableType: "training",
        format: "docx",
      }),
    ],
    bundles: [rawBundle()],
  };
}

export function makeTemplate(overrides: Partial<Template> = {}): Template {
  return rawTemplate(overrides) as Template;
}
