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

const SORT_KEYS: readonly SortKey[] = ["phase", "featured", "title", "price-asc", "price-desc"];
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
    sort: SORT_KEYS.includes(sort) ? sort : DEFAULT_CRITERIA.sort,
    page: /^[1-9]\d{0,5}$/.test(pageText) ? Number(pageText) : 1,
  };
}

/** Serializes criteria to a query string (without "?"), leaving out defaults. */
export function serializeCatalogParams(criteria: CatalogCriteria): string {
  const params = new URLSearchParams();
  if (criteria.q) params.set("q", criteria.q);
  for (const key of ["phase", "type", "app", "audience", "format"] as const) {
    if (criteria[key].length > 0) params.set(key, criteria[key].join(","));
  }
  if (criteria.sort !== DEFAULT_CRITERIA.sort) params.set("sort", criteria.sort);
  if (criteria.page > 1) params.set("page", String(criteria.page));
  return params.toString();
}

/** The catalog address for some criteria. */
export function catalogHref(criteria: CatalogCriteria): string {
  const query = serializeCatalogParams(criteria);
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

const FACET_LABELS: Record<Exclude<FacetKey, "phase">, Record<string, string>> = {
  type: DELIVERABLE_TYPE_LABELS,
  app: APP_LABELS,
  audience: AUDIENCE_LABELS,
  format: FORMAT_LABELS,
};

/** "Clear all filters": keeps the search term only, so the sort and the page reset too. */
export function clearFiltersHref(criteria: CatalogCriteria): string {
  return catalogHref({ ...DEFAULT_CRITERIA, q: criteria.q });
}

export type ActiveFilter = {
  key: FacetKey;
  value: string;
  /** The facet's name, such as "File format". */
  facet: string;
  /** The value's name, such as "Word". */
  label: string;
  /** The catalog with this one value removed, on its first page. */
  removeHref: string;
};

/**
 * Every selected filter value, facet by facet in the order the filters list them, each with the
 * address that removes it. `phases` names the phase slugs; a slug it does not know shows as itself.
 */
export function activeFilters(
  criteria: CatalogCriteria,
  phases: ReadonlyArray<{ slug: string; name: string }>,
): ActiveFilter[] {
  const phaseNames = new Map(phases.map((phase) => [phase.slug, phase.name]));
  return FACET_KEYS.flatMap((key) =>
    (criteria[key] as readonly string[]).map((value) => ({
      key,
      value,
      facet: FACET_TITLES[key],
      label: (key === "phase" ? phaseNames.get(value) : FACET_LABELS[key][value]) ?? value,
      removeHref: catalogHref({
        ...criteria,
        [key]: (criteria[key] as readonly string[]).filter((v) => v !== value),
        page: 1,
      }),
    })),
  );
}
