/** The part of the Navigation API that is read here: where this tab's history stands. */
export type NavigationLike = {
  currentEntry: { index: number } | null;
  entries(): readonly { url: string | null }[];
};

/** A window that may carry the Navigation API (it is not in every browser, nor in the DOM types). */
export type WindowWithNavigation = { navigation?: NavigationLike };

/** An address as a path and its query in a fixed order, or null when it is not on this origin. */
function normalized(address: string, origin: string): string | null {
  try {
    const url = new URL(address, origin);
    if (url.origin !== origin) return null;
    url.searchParams.sort();
    return `${url.pathname}?${url.searchParams.toString()}`;
  } catch {
    return null;
  }
}

/**
 * Whether the history entry just before the current one is `href`, an address of this site, written
 * as the site writes it or in any order of its parameters.
 *
 * It answers false whenever it cannot tell: no Navigation API, no entry before this one, an entry
 * that belongs to another site. A caller that goes back on a true and does something else on a
 * false therefore never leaves the site or lands on a page it did not mean.
 */
export function previousEntryIs(
  navigation: NavigationLike | undefined,
  href: string,
  origin: string,
): boolean {
  const index = navigation?.currentEntry?.index;
  if (navigation === undefined || index === undefined || index < 1) return false;
  const previous = navigation.entries()[index - 1]?.url;
  if (!previous) return false;
  const before = normalized(previous, origin);
  return before !== null && before === normalized(href, origin);
}
