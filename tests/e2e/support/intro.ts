import type { Page } from "@playwright/test";

/**
 * Helpers for the specs that look at the cover of a first visit. They read clocks and states in
 * the page and leave the waiting to `expect.poll`, so nothing here sleeps.
 */

declare global {
  interface Window {
    /** Every value `data-intro` took on the root element, with the page clock at that moment. */
    __introLog?: Array<[number, string | null]>;
  }
}

/**
 * Records every state of `data-intro` with the page clock (`performance.now()`, from the start of
 * the navigation), from before the first script of each load. A state that lasts a fifth of a
 * second cannot be missed this way, and the times do not depend on how busy the machine is when
 * the test gets round to asking.
 */
export async function recordIntro(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const log: Array<[number, string | null]> = [];
    window.__introLog = log;
    new MutationObserver(() => {
      log.push([performance.now(), document.documentElement.getAttribute("data-intro")]);
    }).observe(document, { attributes: true, attributeFilter: ["data-intro"], subtree: true });
  });
}

/** The recorded states in order, without their times. */
export const introStates = (page: Page) =>
  page.evaluate(() => (window.__introLog ?? []).map(([, state]) => state));

/** The page clock when `data-intro` first took a value, or null if it never did. */
export const introAt = (page: Page, value: string | null) =>
  page.evaluate((wanted) => {
    const found = (window.__introLog ?? []).find(([, state]) => state === wanted);
    return found ? found[0] : null;
  }, value);

/** The page clock, in milliseconds from the start of the navigation. */
export const pageClock = (page: Page) => page.evaluate(() => performance.now());
