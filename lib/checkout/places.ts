import { CANADIAN_PROVINCES, COUNTRIES, US_STATES, type Place } from "@/content/countries";

export { COUNTRIES };
export type { Place };

/**
 * How a country divides, where the checkout offers a list of its parts: the parts themselves, what
 * one is called on the form, and what to say when none is chosen. Every other country gets a free
 * line of text under the plain name "Region", which may stay empty.
 */
type Division = { label: string; places: readonly Place[]; missing: string };

const DIVISIONS: Readonly<Record<string, Division>> = {
  CA: {
    label: "Province or territory",
    places: CANADIAN_PROVINCES,
    missing: "Choose a province or territory",
  },
  US: { label: "State", places: US_STATES, missing: "Choose a state" },
};

const COUNTRY_NAMES = new Map<string, string>(COUNTRIES);

/** Whether `code` is a country the form lists. */
export function isCountry(code: string): boolean {
  return COUNTRY_NAMES.has(code);
}

/** A country's name, or the code itself when the list does not hold it. */
export function countryName(code: string): string {
  return COUNTRY_NAMES.get(code) ?? code;
}

/** The parts of a country the form lists (Canada and the United States), or nothing. */
export function regionsOf(country: string): readonly Place[] | undefined {
  return DIVISIONS[country]?.places;
}

/** What the region field is called for a country: "Province or territory", "State" or "Region". */
export function regionLabel(country: string): string {
  return DIVISIONS[country]?.label ?? "Region";
}

/**
 * What is wrong with a region for its country, or nothing. A country with a list needs one of its
 * codes; any other country takes what was typed, or nothing at all.
 */
export function regionProblem(country: string, region: string): string | undefined {
  const division = DIVISIONS[country];
  if (!division) return undefined;
  return division.places.some(([code]) => code === region) ? undefined : division.missing;
}

/** A region as an invoice writes it: the name behind a listed code, otherwise what was typed. */
export function regionName(country: string, region: string): string {
  const listed = regionsOf(country)?.find(([code]) => code === region);
  return listed ? listed[1] : region;
}
