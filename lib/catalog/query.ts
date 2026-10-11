import type { App, Audience, DeliverableType, Format, Phase, Template } from "./schema";

export const PAGE_SIZE = 24;

export type SortKey = "phase" | "featured" | "title" | "price-asc" | "price-desc";
export type FacetKey = "phase" | "type" | "app" | "audience" | "format";

export type CatalogCriteria = {
  q: string;
  phase: string[];
  type: DeliverableType[];
  app: App[];
  audience: Audience[];
  format: Format[];
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
  sort: "phase",
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

const byTitle = (a: Template, b: Template) => a.title.localeCompare(b.title);

type Comparator = (a: Template, b: Template) => number;

const SORTERS: Record<Exclude<SortKey, "phase">, Comparator> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || byTitle(a, b),
  title: byTitle,
  "price-asc": (a, b) => a.priceCents - b.priceCents || byTitle(a, b),
  "price-desc": (a, b) => b.priceCents - a.priceCents || byTitle(a, b),
};

/**
 * The order a rollout moves in: by the phase's order, then by the step's order inside it. Templates
 * of one step keep the order they were given in (the sort is stable). A phase or a step the list
 * does not know goes after every known one.
 */
function byPhase(phases: readonly Pick<Phase, "slug" | "order" | "steps">[]): Comparator {
  const phaseRank = new Map(phases.map((phase) => [phase.slug, phase.order]));
  const stepRank = new Map(
    phases.flatMap((phase) =>
      phase.steps.map((step) => [`${phase.slug}/${step.slug}`, step.order]),
    ),
  );
  const rank = (map: Map<string, number>, key: string) => map.get(key) ?? Number.POSITIVE_INFINITY;
  return (a, b) =>
    rank(phaseRank, a.phase) - rank(phaseRank, b.phase) ||
    rank(stepRank, `${a.phase}/${a.step}`) - rank(stepRank, `${b.phase}/${b.step}`);
}

/**
 * Filters, searches, sorts and paginates. Values within a facet are OR; facets are AND. `phases`
 * gives the phase and step order for the default sort ("phase"); without it that sort keeps the
 * order the templates were given in.
 */
export function queryTemplates(
  templates: Template[],
  criteria: CatalogCriteria,
  phases: readonly Pick<Phase, "slug" | "order" | "steps">[] = [],
): CatalogResult {
  const terms = fold(criteria.q).split(/\s+/).filter(Boolean);
  const searched = templates.filter((t) => matchesSearch(t, terms));

  const matchesAllExcept = (template: Template, except?: FacetKey) =>
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

  const sorter = criteria.sort === "phase" ? byPhase(phases) : SORTERS[criteria.sort];
  const matched = searched.filter((t) => matchesAllExcept(t)).sort(sorter);
  const total = matched.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requested = Number.isFinite(criteria.page) ? Math.trunc(criteria.page) : 1;
  const page = Math.min(Math.max(requested, 1), pageCount);
  const items = matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { items, total, page, pageCount, facets };
}
