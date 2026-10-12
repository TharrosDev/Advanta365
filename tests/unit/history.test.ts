import { expect, test } from "vitest";
import { previousEntryIs, type NavigationLike } from "@/lib/history";

const ORIGIN = "https://www.advanta365.test";

/** A tab whose history is `urls`, standing on the entry at `at`. */
function navigation(urls: (string | null)[], at: number): NavigationLike {
  const entries = urls.map((url) => ({ url }));
  return { currentEntry: { index: at }, entries: () => entries };
}

test("the entry before the current one is the address: it is", () => {
  const nav = navigation([`${ORIGIN}/catalog?type=plan`, `${ORIGIN}/catalog?type=plan&view=a`], 1);
  expect(previousEntryIs(nav, "/catalog?type=plan", ORIGIN)).toBe(true);
});

test("the order of the parameters does not matter", () => {
  const nav = navigation([`${ORIGIN}/catalog?free=1&type=plan`, `${ORIGIN}/catalog?view=a`], 1);
  expect(previousEntryIs(nav, "/catalog?type=plan&free=1", ORIGIN)).toBe(true);
});

test("the plain catalog is the plain catalog", () => {
  const nav = navigation([`${ORIGIN}/catalog`, `${ORIGIN}/catalog?view=a`], 1);
  expect(previousEntryIs(nav, "/catalog", ORIGIN)).toBe(true);
});

test("another page, or the same page with other parameters, is not", () => {
  const home = navigation([`${ORIGIN}/`, `${ORIGIN}/catalog?view=a`], 1);
  expect(previousEntryIs(home, "/catalog", ORIGIN)).toBe(false);

  const other = navigation([`${ORIGIN}/catalog?type=plan`, `${ORIGIN}/catalog?view=a`], 1);
  expect(previousEntryIs(other, "/catalog", ORIGIN)).toBe(false);
});

test("an entry of another site is not", () => {
  const nav = navigation(["https://elsewhere.test/catalog", `${ORIGIN}/catalog?view=a`], 1);
  expect(previousEntryIs(nav, "/catalog", ORIGIN)).toBe(false);
});

test("it is false whenever it cannot tell", () => {
  // No Navigation API in this browser.
  expect(previousEntryIs(undefined, "/catalog", ORIGIN)).toBe(false);
  // The first entry of the tab has none before it.
  expect(previousEntryIs(navigation([`${ORIGIN}/catalog?view=a`], 0), "/catalog", ORIGIN)).toBe(
    false,
  );
  // An entry that is not in the list (index -1) or has no readable address.
  expect(previousEntryIs(navigation([`${ORIGIN}/catalog`], -1), "/catalog", ORIGIN)).toBe(false);
  expect(
    previousEntryIs(navigation([null, `${ORIGIN}/catalog?view=a`], 1), "/catalog", ORIGIN),
  ).toBe(false);
  expect(previousEntryIs({ currentEntry: null, entries: () => [] }, "/catalog", ORIGIN)).toBe(
    false,
  );
});
