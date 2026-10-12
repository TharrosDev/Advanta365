import { APPS, AUDIENCES, DELIVERABLE_TYPES, FORMATS } from "@/content/taxonomy";
import { DEFAULT_CRITERIA, type CatalogCriteria, type SortKey } from "./query";

export type RawParams = Record<string, string | string[] | undefined>;

const SORT_KEYS: readonly SortKey[] = ["samples", "title"];
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
  for (const key of ["phase", "type", "app", "audience", "format"] as const) {
    if (criteria[key].length > 0) params.set(key, criteria[key].join(","));
  }
  if (criteria.free) params.set("free", "1");
  if (criteria.sort !== DEFAULT_CRITERIA.sort) params.set("sort", criteria.sort);
  if (criteria.page > 1) params.set("page", String(criteria.page));
  return params.toString();
}

/**
 * The template a catalog link asks to show in the preview: the first `view` value, if it has the
 * shape of a slug. Whether such a template exists is for the caller to look up.
 */
export function parseView(sp: RawParams): string | undefined {
  const view = first(sp.view);
  return SLUG.test(view) ? view : undefined;
}

/** The address of the catalog for some criteria, with `view` (a template slug) last. */
export function catalogHref(criteria: CatalogCriteria, view?: string): string {
  const params = new URLSearchParams(serializeCatalogParams(criteria));
  if (view) params.set("view", view);
  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}
