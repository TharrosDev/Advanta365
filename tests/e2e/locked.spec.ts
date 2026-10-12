import { expect, test, type Locator, type Page } from "@playwright/test";
import { hydrated, NAVIGATION_TIMEOUT } from "./helpers";

// Every template that is not a free sample is locked: its cover is out of focus under a chain and
// a padlock, and the tile is a button. Pressing it does not open anything. The tile says no: for
// 600ms it carries `data-denied` (a red outline that pulses, a shake, the padlock rattling), and a
// line under it says where the template is to be had. Under reduced motion the outline and the
// line are all of it.

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

test("a locked tile is a button named for its template, under a chain and a padlock", async ({
  page,
}) => {
  await openCatalog(page);
  const tile = lockedTiles(page).first();
  const button = tile.getByRole("button");

  await expect(button).toHaveCount(1);
  await expect(button).toBeEnabled();
  await expect(button).toHaveAccessibleName(/\S, locked$/);
  await expect(tile.getByRole("link")).toHaveCount(0);

  // The chain and the padlock are a drawing, kept from assistive technology.
  const drawing = tile.locator("svg[data-chain-lock]");
  await expect(drawing).toHaveCount(1);
  await expect(drawing).toHaveAttribute("aria-hidden", "true");
  await expect(drawing.locator("[data-lock]")).toHaveCount(1);
  await expect(drawing).toBeVisible();

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

  // A free tile has neither.
  const free = page.locator("[data-tile][data-free]").first();
  await expect(free.locator("svg[data-chain-lock]")).toHaveCount(0);
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

test("while it denies, the tile shakes, the padlock rattles and the outline pulses red", async ({
  page,
}) => {
  await openCatalog(page);
  const tile = lockedTiles(page).first();
  // The state is set by hand and everything is read in the same breath, before any of it is over.
  const { names, outline, timing } = await tile.evaluate((element) => {
    element.setAttribute("data-denied", "");
    return {
      names: {
        tile: getComputedStyle(element).animationName,
        lock: getComputedStyle(element.querySelector("[data-lock]") as Element).animationName,
      },
      outline: getComputedStyle(element).outlineStyle,
      timing: element.getAnimations({ subtree: true }).map((animation) => {
        const computed = animation.effect?.getComputedTiming();
        return { end: Number(computed?.endTime ?? 0), iterations: computed?.iterations };
      }),
    };
  });
  expect(names.tile).toContain("tile-shake");
  expect(names.tile).toContain("denied-pulse");
  expect(names.lock).toBe("lock-rattle");
  expect(outline).toBe("solid");

  // Nothing of it goes on: every animation of the tile ends, well inside the 600ms.
  expect(timing.length).toBeGreaterThanOrEqual(3);
  for (const { end, iterations } of timing) {
    expect(end).toBeLessThanOrEqual(600);
    expect(iterations).toBe(1);
  }
});

test("under reduced motion the denial is the red outline and the line, and nothing moves", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openCatalog(page);
  const tile = lockedTiles(page).first();

  // The state is set by hand, so that it holds while the styles are read. Under reduced motion a
  // change of colour still takes the hundredth of a millisecond the safety net leaves it, so the
  // reading waits a moment for the colour to have arrived.
  await tile.evaluate((element) => element.setAttribute("data-denied", ""));
  await expect(tile).toHaveCSS("outline-color", ALERT);
  const look = await tile.evaluate((element) => {
    const lock = element.querySelector("[data-lock]") as Element;
    return {
      tile: getComputedStyle(element).animationName,
      lock: getComputedStyle(lock).animationName,
      style: getComputedStyle(element).outlineStyle,
      colour: getComputedStyle(element).outlineColor,
      running: element.getAnimations({ subtree: true }).length,
    };
  });
  expect(look).toEqual({ tile: "none", lock: "none", style: "solid", colour: ALERT, running: 0 });
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

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a locked tile still reads as locked, and the page says where the rest is", async ({
    page,
  }) => {
    await page.goto("/catalog");
    const tile = lockedTiles(page).first();
    await expect(tile.getByRole("button")).toHaveAccessibleName(/\S, locked$/);
    await expect(tile.locator("svg[data-chain-lock]")).toBeVisible();

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
    await expect(tile).toHaveCSS("outline-color", ALERT);
  });
});
