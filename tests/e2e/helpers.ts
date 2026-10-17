import { expect, type Page } from "@playwright/test";
import { INTRO_FLAG, INTRO_SEEN } from "../../lib/boot/state";

/**
 * How long a client-side navigation may take to show its URL. The route is fetched from a server
 * that, in the first seconds of a run, is also answering every other worker's first request. A quiet
 * machine needs well under a second; the headroom keeps a CPU-starved run from failing on the clock
 * instead of on the page.
 */
export const NAVIGATION_TIMEOUT = 15_000;

/**
 * Marks the cover of a first visit as already seen, the way it is on every load of a session but
 * the first: the session flag is set before any script of the page runs. Call it before the first
 * `goto` of a test that opens the home page for another reason, so the page is not under the cover
 * when the test starts on it. The cover itself is the subject of `intro.spec.ts`.
 */
export async function introSeen(page: Page): Promise<void> {
  await page.addInitScript(
    ([flag, seen]) => {
      try {
        window.sessionStorage.setItem(flag, seen);
      } catch {
        // No storage: the cover does not play then either.
      }
    },
    [INTRO_FLAG, INTRO_SEEN] as const,
  );
}

/**
 * Waits until the page answers to input. The server sends every page complete, so a control can be
 * seen, and clicked, before the script that listens to it has run; a click that early is lost. The
 * root element carries `data-hydrated` from the moment the client components have their handlers
 * (components/ui/motion-root.tsx). Call it after a `goto` and before the first click or key press
 * on anything a script answers: a filter, a locked tile, a menu.
 */
export async function hydrated(page: Page): Promise<void> {
  await expect(page.locator("html[data-hydrated]")).toBeAttached();
}

/** Opens the catalog (or another address) and waits for the page to answer to input. */
export async function openCatalog(page: Page, address = "/catalog") {
  const response = await page.goto(address);
  await hydrated(page);
  return response;
}
