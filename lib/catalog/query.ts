import type { App, Audience, DeliverableType, Format, Phase, Template } from "./schema";

export const PAGE_SIZE = 24;

/**
 * "samples" puts the free templates first and then goes in rollout order; "phase" is the rollout
 * order alone; "title" is the alphabet.
 */
export type SortKey = "samples" | "phase" | "title";
export type FacetKey = "phase" | "type" | "app" | "audience" | "format";

export type CatalogCriteria = {
  q: string;
  phase: string[];
  type: DeliverableType[];
  app: App[];
  audience: Audience[];
  format: Format[];
  /** Keep only the free templates. */
  free: boolean;
  sort: SortKey;
  page: number;
};

export const DEFAULT_CRITERIA: CatalogCriteria = {
  q: "",
  phase: [],
  type: [],
  app: [],
  audience: [],
  format: [],
  free: false,
  sort: "samples",
  page: 1,
};

export type CatalogResult = {
  items: Template[];
  total: number;
  page: number;
  pageCount: number;
  facets: Record<FacetKey, Record<string, number>>;
};

/** The facets in the order the filters list them. */
export const FACET_KEYS: readonly FacetKey[] = ["phase", "type", "app", "audience", "format"];

/** The values a template carries for each facet. */
const FACET_VALUES: Record<FacetKey, (t: Template) => readonly string[]> = {
  phase: (t) => [t.phase],
  type: (t) => [t.deliverableType],
  app: (t) => t.apps,
  audience: (t) => t.audiences,
  format: (t) => [t.format],
};

function matchesFacet(template: Template, key: FacetKey, selected: readonly string[]) {
  if (selected.length === 0) return true;
  return FACET_VALUES[key](template).some((value) => selected.includes(value));
}

/**
 * Lower-cases and straightens typographic apostrophes and quotes, so a search typed on a keyboard
 * (what's) finds copy set with typographic marks (What’s), and the other way round.
 */
function fold(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

function matchesSearch(template: Template, terms: string[]) {
  if (terms.length === 0) return true;
  const haystack = fold(`${template.title} ${template.summary} ${template.description}`);
  return terms.every((term) => haystack.includes(term));
}

type Comparator = (a: Template, b: Template) => number;
type PhaseOrder = readonly Pick<Phase, "slug" | "order" | "steps">[];

const byTitle: Comparator = (a, b) => a.title.localeCompare(b.title);

/**
 * The order a rollout moves in: by the phase's order, then by the step's order inside it. Templates
 * of one step keep the order they were given in (the sort is stable). A phase or a step the list
 * does not know goes after every known one.
 */
function byPhase(phases: PhaseOrder): Comparator {
  const phaseRank = new Map(phases.map((phase) => [phase.slug, phase.order]));
  const stepRank = new Map(
    phases.flatMap((phase) =>
      phase.steps.map((step) => [`${phase.slug}/${step.slug}`, step.order]),
    ),
  );
  // Two keys the list does not know are level with each other, so they keep the given order.
  const compare = (ranks: Map<string, number>, a: string, b: string) => {
    const [rankA, rankB] = [ranks.get(a), ranks.get(b)];
    if (rankA === rankB) return 0;
    if (rankA === undefined) return 1;
    if (rankB === undefined) return -1;
    return rankA - rankB;
  };
  return (a, b) =>
    compare(phaseRank, a.phase, b.phase) ||
    compare(stepRank, `${a.phase}/${a.step}`, `${b.phase}/${b.step}`);
}

/** The comparator of a sort key: "samples" is the free templates first, then the rollout order. */
function sorterFor(sort: SortKey, phases: PhaseOrder): Comparator {
  if (sort === "title") return byTitle;
  const rollout = byPhase(phases);
  if (sort === "phase") return rollout;
  return (a, b) => Number(b.free) - Number(a.free) || rollout(a, b);
}

/**
 * Filters, searches, sorts and paginates. Values within a facet are OR; facets are AND; the free
 * filter, when on, narrows everything (the facet counts too). `phases` gives the phase and step
 * order for the "samples" and "phase" sorts; without it those keep the order the templates were
 * given in (under "samples", the free ones still first).
 */
export function queryTemplates(
  templates: Template[],
  criteria: CatalogCriteria,
  phases: PhaseOrder = [],
): CatalogResult {
  const terms = fold(criteria.q).split(/\s+/).filter(Boolean);
  const searched = templates.filter((t) => matchesSearch(t, terms));

  const matchesAllExcept = (template: Template, except?: FacetKey) =>
    (!criteria.free || template.free) &&
    FACET_KEYS.every((key) => key === except || matchesFacet(template, key, criteria[key]));

  // Each facet is counted as if its own selection were cleared, so the counts
  // show what ticking another box in that group would give.
  const facets = {} as CatalogResult["facets"];
  for (const key of FACET_KEYS) {
    const counts: Record<string, number> = {};
    for (const template of searched) {
      if (!matchesAllExcept(template, key)) continue;
      for (const value of FACET_VALUES[key](template)) counts[value] = (counts[value] ?? 0) + 1;
    }
    facets[key] = counts;
  }

  const matched = searched
    .filter((t) => matchesAllExcept(t))
    .sort(sorterFor(criteria.sort, phases));
  const total = matched.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requested = Number.isFinite(criteria.page) ? Math.trunc(criteria.page) : 1;
  const page = Math.min(Math.max(requested, 1), pageCount);
  const items = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { items, total, page, pageCount, facets };
}
