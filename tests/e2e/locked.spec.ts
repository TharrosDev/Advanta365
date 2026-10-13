import { expect, test, type Locator, type Page } from "@playwright/test";
import { hydrated, NAVIGATION_TIMEOUT } from "./helpers";

// Every template that is not a free sample is locked: its cover is out of focus, and the tile is a
// button. Nothing is drawn over the cover. Pressing the tile does not open anything. The tile says
// no: for 600ms it carries `data-denied` (a sideways shake and a thin red ring on its cover well
// that hits and fades), and a line under it says where the template is to be had. Under reduced
// motion the ring and the line are all of it.

const ALERT = "rgb(163, 43, 29)";
const LOCKED_SLUG = "sharepoint-migration-impact-assessment";
const LOCKED_NAME = "SharePoint Migration Impact Assessment, locked";

declare global {
  interface Window {
    /** Every change of `data-denied` on the watched tile: what it became, and when. */
    __denied?: { state: "on" | "off"; at: number }[];
  }
}

const lockedTiles = (page: Page) => page.locator("[data-tile][data-locked]");
const message = (tile: Locator) => tile.locator("[aria-live]");

async function openCatalog(page: Page, address = "/catalog") {
  const response = await page.goto(address);
  await hydrated(page);
  return response;
}

/** Records every time the tile gains or loses `data-denied`, so no state can be missed. */
async function watchDenied(tile: Locator) {
  await tile.evaluate((element) => {
    const log: { state: "on" | "off"; at: number }[] = [];
    window.__denied = log;
    new MutationObserver((records) => {
      for (const record of records) {
        log.push({ state: record.oldValue === null ? "on" : "off", at: performance.now() });
      }
    }).observe(element, {
      attributes: true,
      attributeFilter: ["data-denied"],
      attributeOldValue: true,
    });
  });
}

const deniedStates = (page: Page) =>
  page.evaluate(() => (window.__denied ?? []).map((entry) => entry.state));

test("a locked tile is a button named for its template, with its cover out of focus", async ({
  page,
}) => {
  await openCatalog(page);
  const tile = lockedTiles(page).first();
  const button = tile.getByRole("button");

  await expect(button).toHaveCount(1);
  await expect(button).toBeEnabled();
  await expect(button).toHaveAccessibleName(/\S, locked$/);
  await expect(tile.getByRole("link")).toHaveCount(0);

  // Nothing is drawn over the cover: the well holds the cover and nothing else.
  await expect(tile.locator("[data-well] > *")).toHaveCount(1);
  await expect(tile.locator("[data-well] > * [data-cover]")).toHaveCount(1);
  await expect(tile.locator("[data-lock], [data-chain-lock]")).toHaveCount(0);

  // Only the cover is out of focus: the title and the facts under it are sharp.
  const blurred = await tile.evaluate((element) =>
    [...element.querySelectorAll("*")]
      .filter((node) => getComputedStyle(node).filter.includes("blur"))
      .map((node) => ({
        holdsCover: node.querySelector("[data-cover]") !== null || node.matches("[data-cover]"),
        holdsTitle: node.querySelector("h2, h3, button, [aria-live]") !== null,
      })),
  );
  expect(blurred).toEqual([{ holdsCover: true, holdsTitle: false }]);

  // A free tile has no blur.
  const free = page.locator("[data-tile][data-free]").first();
  expect(
    await free.evaluate(
      (element) =>
        [...element.querySelectorAll("*")].filter((node) =>
          getComputedStyle(node).filter.includes("blur"),
        ).length,
    ),
  ).toBe(0);
});

test("pressing a locked tile denies for 600ms and says where the template is", async ({ page }) => {
  await openCatalog(page);
  const tile = lockedTiles(page).first();
  const button = tile.getByRole("button");

  // The line's place is there from the start, empty, so that what arrives in it is announced.
  await expect(message(tile)).toHaveCount(1);
  await expect(message(tile)).toHaveAttribute("aria-live", "polite");
  await expect(message(tile)).toHaveText("");
  const described = await button.getAttribute("aria-describedby");
  expect(described).toBeTruthy();
  expect(await message(tile).getAttribute("id")).toBe(described);

  await watchDenied(tile);
  await button.click();

  await expect.poll(() => deniedStates(page)).toEqual(["on", "off"]);
  const [on, off] = (await page.evaluate(() => window.__denied)) ?? [];
  expect((off?.at ?? 0) - (on?.at ?? 0)).toBeGreaterThanOrEqual(550);
  await expect(tile).not.toHaveAttribute("data-denied");

  await expect(message(tile)).toContainText("Included with the toolkit.");
  const link = message(tile).getByRole("link");
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute("href", "/purchase");
  await expect(link).toBeVisible();

  // Nothing opened and the address did not change.
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page).toHaveURL(/\/catalog$/);

  // The link leads to the one place to buy.
  await link.click();
  await expect(page).toHaveURL(/\/purchase$/, { timeout: NAVIGATION_TIMEOUT });
});

test("Enter and Space deny as a click does", async ({ page }) => {
  await openCatalog(page);
  const tile = lockedTiles(page).first();
  await watchDenied(tile);

  await tile.getByRole("button").focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => deniedStates(page)).toEqual(["on", "off"]);
  await expect(message(tile)).toContainText("Included with the toolkit.");

  await page.keyboard.press("Space");
  await expect.poll(() => deniedStates(page)).toEqual(["on", "off", "on", "off"]);
  await expect(message(tile).getByRole("link")).toHaveCount(1);
  // The button keeps the focus all the while.
  await expect(tile.getByRole("button")).toBeFocused();
});

test("five fast presses start the denial over each time and leave one line", async ({ page }) => {
  await openCatalog(page);
  const tile = lockedTiles(page).first();
  await watchDenied(tile);

  await tile.getByRole("button").evaluate((element: HTMLElement) => {
    for (let press = 0; press < 5; press += 1) element.click();
  });

  // Each press after the first takes the state away and puts it back, so the animation restarts.
  await expect
    .poll(() => deniedStates(page))
    .toEqual(["on", "off", "on", "off", "on", "off", "on", "off", "on", "off"]);
  await expect(tile).not.toHaveAttribute("data-denied");
  await expect(message(tile)).toHaveCount(1);
  await expect(message(tile).getByRole("link")).toHaveCount(1);
  await expect(message(tile)).toHaveText(/^Included with the toolkit\.\s*Purchase$/);
});

test("while it denies, the tile shakes and its well's ring pulses red", async ({ page }) => {
  await openCatalog(page);
  const tile = lockedTiles(page).first();
  // The state is set by hand and everything is read in the same breath, before any of it is over.
  const { names, timing } = await tile.evaluate((element) => {
    element.setAttribute("data-denied", "");
    return {
      names: {
        tile: getComputedStyle(element).animationName,
        ring: getComputedStyle(element.querySelector("[data-well]") as Element, "::before")
          .animationName,
      },
      timing: element.getAnimations({ subtree: true }).map((animation) => {
        const computed = animation.effect?.getComputedTiming();
        return { end: Number(computed?.endTime ?? 0), iterations: computed?.iterations };
      }),
    };
  });
  expect(names.tile).toBe("tile-shake");
  expect(names.ring).toBe("denied-ring");

  // Nothing of it goes on: every animation of the tile ends, well inside the 600ms.
  expect(timing.length).toBeGreaterThanOrEqual(2);
  for (const { end, iterations } of timing) {
    expect(end).toBeLessThanOrEqual(600);
    expect(iterations).toBe(1);
  }
});

test("under reduced motion the denial is the red ring and the line, and nothing moves", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openCatalog(page);
  const tile = lockedTiles(page).first();

  // The state is set by hand, so that it holds while the styles are read. The ring is on the
  // well, not the tile: the tile's outline stays its focus ring.
  await tile.evaluate((element) => element.setAttribute("data-denied", ""));
  const look = await tile.evaluate((element) => {
    const ring = getComputedStyle(element.querySelector("[data-well]") as Element, "::before");
    return {
      tile: getComputedStyle(element).animationName,
      ring: ring.animationName,
      opacity: ring.opacity,
      colour: ring.borderTopColor,
      outline: getComputedStyle(element).outlineColor,
      running: element.getAnimations({ subtree: true }).length,
    };
  });
  expect(look).toEqual({
    tile: "none",
    ring: "none",
    opacity: "1",
    colour: ALERT,
    outline: "rgba(0, 0, 0, 0)",
    running: 0,
  });
  await tile.evaluate((element) => element.removeAttribute("data-denied"));

  // The press itself works as it does with motion.
  await watchDenied(tile);
  await tile.getByRole("button").click();
  await expect.poll(() => deniedStates(page)).toEqual(["on", "off"]);
  await expect(message(tile)).toContainText("Included with the toolkit.");
  await expect(message(tile).getByRole("link")).toHaveAttribute("href", "/purchase");
});

test("a link to a locked template opens nothing: its tile denies once, with its line", async ({
  page,
}) => {
  const response = await openCatalog(page, `/catalog?phase=plan&view=${LOCKED_SLUG}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("dialog[open]")).toHaveCount(0);

  const tile = lockedTiles(page).filter({
    has: page.getByRole("button", { name: LOCKED_NAME, exact: true }),
  });
  await expect(tile).toHaveCount(1);
  await expect(message(tile)).toContainText("Included with the toolkit.");
  await expect(message(tile).getByRole("link")).toHaveAttribute("href", "/purchase");

  // It clears as a press would, and no other tile was ever in the state.
  await expect(tile).not.toHaveAttribute("data-denied");
  await expect(page.locator("[data-denied]")).toHaveCount(0);
  await expect(lockedTiles(page).locator("[aria-live]").filter({ hasText: /\S/ })).toHaveCount(1);
});

test("a link to a locked template whose tile is not on the page of results is answered in a line above them", async ({
  page,
}) => {
  // Only the six free samples are listed here, so the template the link names has no tile.
  const response = await openCatalog(page, `/catalog?free=1&view=${LOCKED_SLUG}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.locator("[data-tile]")).toHaveCount(6);
  await expect(page.locator("[data-denied]")).toHaveCount(0);

  const line = page.getByRole("main").locator("[data-included]");
  await expect(line).toHaveCount(1);
  await expect(line).toBeVisible();
  await expect(line).toHaveAttribute("role", "status");
  await expect(line).toHaveText(
    "SharePoint Migration Impact Assessment is included with the toolkit. Purchase",
  );
  await expect(line.getByRole("link", { name: "Purchase", exact: true })).toHaveAttribute(
    "href",
    "/purchase",
  );
  // It stands above the count and the tiles.
  const [lineBox, countBox] = await Promise.all([
    line.boundingBox(),
    page.locator("#results-heading").boundingBox(),
  ]);
  expect(lineBox?.y ?? Infinity).toBeLessThan(countBox?.y ?? -Infinity);

  // The same on a page of the full results that does not hold the tile, whichever page that is.
  let without = 0;
  for (const number of [1, 2, 3]) {
    await page.goto(`/catalog?page=${number}&view=${LOCKED_SLUG}`);
    const onPage = await page.locator("[data-tile][data-denied]").count();
    await expect(page.locator("[data-included]")).toHaveCount(onPage ? 0 : 1);
    without += onPage ? 0 : 1;
  }
  expect(without).toBe(2);

  // Where the tile is on the page, the tile answers and there is no line; a free sample, or a
  // name the catalog does not hold, gets none either.
  for (const address of [
    `/catalog?phase=plan&view=${LOCKED_SLUG}`,
    "/catalog?free=1&view=nope",
    "/catalog?page=3&view=change-management-strategy",
  ]) {
    await page.goto(address);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catalog");
    await expect(page.locator("[data-included]"), address).toHaveCount(0);
  }
});

test("a phase page draws nothing over its locked tiles, in any of its grids", async ({ page }) => {
  await page.goto("/phases/plan");
  // Several steps, each with a grid of its own, and locked tiles in more than one of them.
  const grids = page.getByRole("main").locator("ul:has([data-tile])");
  expect(await grids.count()).toBeGreaterThan(1);
  expect(
    await grids.evaluateAll(
      (lists) => lists.filter((list) => list.querySelector("[data-tile][data-locked]")).length,
    ),
  ).toBeGreaterThan(1);

  // A locked tile is a button named for its template, and the well of every tile holds its cover
  // and nothing drawn over it. No id is on the page twice.
  const locked = page.locator("[data-tile][data-locked]");
  await expect(locked.first().getByRole("button")).toHaveAccessibleName(/\S, locked$/);
  const tiles = await page.locator("[data-tile]").count();
  await expect(page.locator("[data-tile] [data-well] > *")).toHaveCount(tiles);
  await expect(page.locator("[data-chain-lock], [data-lock]")).toHaveCount(0);
  const ids = await page.evaluate(() => [...document.querySelectorAll("[id]")].map((el) => el.id));
  expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the line for a locked template that has no tile on the page is there too", async ({
    page,
  }) => {
    await page.goto(`/catalog?free=1&view=${LOCKED_SLUG}`);
    const line = page.locator("[data-included]");
    await expect(line).toContainText(
      "SharePoint Migration Impact Assessment is included with the toolkit.",
    );
    await expect(line.getByRole("link")).toHaveAttribute("href", "/purchase");
  });

  test("a locked tile still reads as locked, and the page says where the rest is", async ({
    page,
  }) => {
    await page.goto("/catalog");
    const tile = lockedTiles(page).first();
    await expect(tile.getByRole("button")).toHaveAccessibleName(/\S, locked$/);
    await expect(tile.locator("[data-well] > *")).toHaveCount(1);

    // The button answers to nothing here, so the way to the purchase page is on the page itself.
    const way = page.getByRole("main").getByRole("link", { name: "Purchase", exact: true });
    await expect(way.first()).toBeVisible();
    await expect(way.first()).toHaveAttribute("href", "/purchase");
  });

  test("the server sends the tile of a locked link already denied, with its line", async ({
    page,
  }) => {
    await page.goto(`/catalog?phase=plan&view=${LOCKED_SLUG}`);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator("[data-denied]")).toHaveCount(1);

    const tile = page.locator("[data-tile][data-denied]");
    await expect(tile.getByRole("button")).toHaveAccessibleName(LOCKED_NAME);
    await expect(message(tile)).toContainText("Included with the toolkit.");
    await expect(message(tile).getByRole("link")).toHaveAttribute("href", "/purchase");
    const ring = await tile.evaluate((element) => {
      const style = getComputedStyle(element.querySelector("[data-well]") as Element, "::before");
      return { opacity: style.opacity, colour: style.borderTopColor };
    });
    expect(ring).toEqual({ opacity: "1", colour: ALERT });
  });
});

test("every press puts the one line there anew, so it is announced each time and never stacked", async ({
  page,
}) => {
  await openCatalog(page);
  const tile = lockedTiles(page).first();
  const button = tile.getByRole("button");
  await expect(message(tile)).toHaveAttribute("aria-atomic", "true");

  // What a screen reader hears is a change inside the live region: count the lines that arrive.
  await message(tile).evaluate((region) => {
    const seen = { added: 0, removed: 0 };
    (window as unknown as { __lines: typeof seen }).__lines = seen;
    new MutationObserver((records) => {
      for (const record of records) {
        seen.added += record.addedNodes.length;
        seen.removed += record.removedNodes.length;
      }
    }).observe(region, { childList: true });
  });
  const lines = () =>
    page.evaluate(
      () => (window as unknown as { __lines: { added: number; removed: number } }).__lines,
    );

  const PRESSES = 4;
  for (let press = 1; press <= PRESSES; press += 1) {
    await button.click();
    // One line arrived for this press, and the one before it left.
    await expect.poll(lines).toEqual({ added: press, removed: press - 1 });
    await expect(message(tile).locator("[data-answer]")).toHaveCount(1);
    await expect(message(tile).getByRole("link")).toHaveCount(1);
    await expect(message(tile)).toHaveText("Included with the toolkit. Purchase");
  }

  // The keyboard is announced the same way.
  await button.focus();
  await page.keyboard.press("Enter");
  await expect.poll(lines).toEqual({ added: PRESSES + 1, removed: PRESSES });
  await expect(message(tile).locator("[data-answer]")).toHaveCount(1);
});
