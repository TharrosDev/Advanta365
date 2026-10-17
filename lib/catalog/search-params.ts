import {
  APPS,
  APP_LABELS,
  AUDIENCES,
  AUDIENCE_LABELS,
  DELIVERABLE_TYPES,
  DELIVERABLE_TYPE_LABELS,
  FORMATS,
  FORMAT_LABELS,
} from "@/content/taxonomy";
import {
  DEFAULT_CRITERIA,
  FACET_KEYS,
  type CatalogCriteria,
  type FacetKey,
  type SortKey,
} from "./query";

type RawParams = Record<string, string | string[] | undefined>;

const SORT_KEYS: readonly SortKey[] = ["samples", "phase", "title"];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_QUERY_LENGTH = 200;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Reads a comma-separated (and possibly repeated) parameter, keeping only allowed values. */
function list<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T[] {
  const parts = (Array.isArray(value) ? value : [value ?? ""]).flatMap((v) => v.split(","));
  const known = parts.filter((part): part is T => (allowed as readonly string[]).includes(part));
  return [...new Set(known)];
}

/** Turns URL search parameters into catalog criteria. Anything unrecognized is ignored. */
export function parseCatalogParams(sp: RawParams, phaseSlugs: string[]): CatalogCriteria {
  const sort = first(sp.sort) as SortKey;
  const pageText = first(sp.page);
  return {
    q: first(sp.q).trim().slice(0, MAX_QUERY_LENGTH),
    phase: list(sp.phase, phaseSlugs),
    type: list(sp.type, DELIVERABLE_TYPES),
    app: list(sp.app, APPS),
    audience: list(sp.audience, AUDIENCES),
    format: list(sp.format, FORMATS),
    free: first(sp.free) === "1",
    sort: SORT_KEYS.includes(sort) ? sort : DEFAULT_CRITERIA.sort,
    page: /^[1-9]\d{0,5}$/.test(pageText) ? Number(pageText) : 1,
  };
}

/** Serializes criteria to a query string (without "?"), leaving out defaults. */
export function serializeCatalogParams(criteria: CatalogCriteria): string {
  const params = new URLSearchParams();
  if (criteria.q) params.set("q", criteria.q);
  for (const key of FACET_KEYS) {
    if (criteria[key].length > 0) params.set(key, criteria[key].join(","));
  }
  if (criteria.free) params.set("free", "1");
  if (criteria.sort !== DEFAULT_CRITERIA.sort) params.set("sort", criteria.sort);
  if (criteria.page > 1) params.set("page", String(criteria.page));
  return params.toString();
}

/**
 * The template a catalog link asks to show in the preview: the first `view` value, if it has the
 * shape of a slug. Whether such a template exists is for the caller to look up. Slugs are
 * lowercase and the site's addresses are not case-sensitive, so a value typed in mixed case (an old
 * `/Templates/Change-Management-Strategy` link keeps its case through the redirect) is read as the
 * lowercase slug.
 */
export function parseView(sp: RawParams): string | undefined {
  const view = first(sp.view).toLowerCase();
  return SLUG.test(view) ? view : undefined;
}

/** The address of a section's own page. */
export function phaseHref(slug: string): string {
  return `/phases/${slug}`;
}

/** The address of the catalog for some criteria, with `view` (a template slug) last. */
export function catalogHref(criteria: CatalogCriteria, view?: string): string {
  const params = new URLSearchParams(serializeCatalogParams(criteria));
  if (view) params.set("view", view);
  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

/** Each facet's name, as the heading of its group of filters. */
export const FACET_TITLES: Record<FacetKey, string> = {
  phase: "Phase",
  type: "Deliverable type",
  app: "Microsoft 365 app",
  audience: "Audience",
  format: "File format",
};

/** The one filter that is not a facet, as its check row and its chip name it. */
export const FREE_FILTER_LABEL = "Free samples only";

const FACET_LABELS: Record<Exclude<FacetKey, "phase">, Record<string, string>> = {
  type: DELIVERABLE_TYPE_LABELS,
  app: APP_LABELS,
  audience: AUDIENCE_LABELS,
  format: FORMAT_LABELS,
};

/** Whether any filter is on: a facet value or "Free samples only". A search is not a filter. */
export function hasFilters(criteria: CatalogCriteria): boolean {
  return criteria.free || FACET_KEYS.some((key) => criteria[key].length > 0);
}

/**
 * "Clear all filters": keeps the search term only, so the free filter, the sort and the page reset
 * too.
 */
export function clearFiltersHref(criteria: CatalogCriteria): string {
  return catalogHref({ ...DEFAULT_CRITERIA, q: criteria.q });
}

type ActiveFilter = {
  key: FacetKey | "free";
  value: string;
  /** The facet's name, such as "File format"; empty for "Free samples only", which has none. */
  facet: string;
  /** The value's name, such as "Word". */
  label: string;
  /** What removing it is called: "Remove File format filter: Word". */
  removeLabel: string;
  /** The catalog with this one value removed, on its first page. */
  removeHref: string;
};

/**
 * Every filter that is on, each with the address that removes it: "Free samples only" first, as the
 * filters list it, then every selected value facet by facet. `phases` names the phase slugs; a slug
 * it does not know shows as itself.
 */
export function activeFilters(
  criteria: CatalogCriteria,
  phases: ReadonlyArray<{ slug: string; name: string }>,
): ActiveFilter[] {
  const phaseNames = new Map(phases.map((phase) => [phase.slug, phase.name]));
  const free: ActiveFilter[] = criteria.free
    ? [
        {
          key: "free",
          value: "1",
          facet: "",
          label: FREE_FILTER_LABEL,
          removeLabel: `Remove filter: ${FREE_FILTER_LABEL}`,
          removeHref: catalogHref({ ...criteria, free: false, page: 1 }),
        },
      ]
    : [];
  const values = FACET_KEYS.flatMap((key) =>
    (criteria[key] as readonly string[]).map((value): ActiveFilter => {
      const facet = FACET_TITLES[key];
      const label = (key === "phase" ? phaseNames.get(value) : FACET_LABELS[key][value]) ?? value;
      return {
        key,
        value,
        facet,
        label,
        removeLabel: `Remove ${facet} filter: ${label}`,
        removeHref: catalogHref({
          ...criteria,
          [key]: (criteria[key] as readonly string[]).filter((v) => v !== value),
          page: 1,
        }),
      };
    }),
  );
  return [...free, ...values];
}
