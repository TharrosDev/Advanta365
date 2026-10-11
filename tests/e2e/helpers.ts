import { expect, type Page } from "@playwright/test";

/**
 * How long the first load of "/" may take to hand over to the page: the page-ready gate is capped
 * at 8s and the intro itself (spin, land, dock) takes about 3s after that. On a normal load the
 * overlay is gone in 3-6s; the headroom is for software-rendered WebGL on a busy machine.
 */
export const INTRO_TIMEOUT = 12_000;

/**
 * Test timeout for a spec that sits through the intro on "/". The default 30s is enough on a
 * quiet machine; this keeps a CPU-starved run from failing on the clock instead of on the page.
 */
export const INTRO_TEST_TIMEOUT = 60_000;

/**
 * How long a client-side navigation may take to show its URL. The click fades the page out first
 * (300ms) and the route is then fetched from a server that, in the first seconds of a run, is also
 * answering every other worker's first request. A quiet machine needs well under a second; the
 * headroom is for a CPU-starved run, like the intro timeouts above.
 */
export const NAVIGATION_TIMEOUT = 15_000;

/** The three attributes the inline entry script and the overlay put on <html> during the intro. */
export const ENTRY_ATTRIBUTES = ["data-entry", "data-entry-brand", "data-entry-lock"] as const;

/**
 * The overlay has been lifted: `data-entry` is gone (it is removed at dock start), so reveals run,
 * the scroll lock is released and the page can be used. The overlay itself is still fading for
 * about a second after this.
 */
export async function waitForIntroLift(page: Page): Promise<void> {
  await expect(page.locator("html")).not.toHaveAttribute("data-entry", {
    timeout: INTRO_TIMEOUT,
  });
}

/** The whole intro is over: every entry attribute is gone and the overlay is out of the DOM. */
export async function waitForIntroEnd(page: Page): Promise<void> {
  await waitForIntroLift(page);
  for (const attribute of ENTRY_ATTRIBUTES) {
    await expect(page.locator("html")).not.toHaveAttribute(attribute, { timeout: INTRO_TIMEOUT });
  }
  await expect(page.locator("[data-entry-overlay]")).toHaveCount(0, { timeout: INTRO_TIMEOUT });
}
