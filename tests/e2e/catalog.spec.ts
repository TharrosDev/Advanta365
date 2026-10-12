import { expect, test, type Page } from "@playwright/test";
import { hydrated, NAVIGATION_TIMEOUT } from "./helpers";

// The catalog is a grid of small tiles, one per template: its cover, its title, its phase and type
// and its format. Six are free samples and come first; every other one is locked. Nothing on the
// page has a price. The lock has a spec of its own (locked.spec.ts), and so has the pop-up a free
// tile opens (template-dialog.spec.ts).
//
// Every test waits for the page to answer to input before it touches a filter: a click on a
// control whose script has not run yet is lost.

/** On narrow screens the filters live in a dialog behind a button. */
async function openFiltersIfCollapsed(page: Page) {
  const button = page.getByRole("button", { name: /^Filters/ });
  if (await button.isVisible()) await button.click();
}

const tiles = (page: Page) => page.getByRole("main").locator("[data-tile]");

async function openCatalog(page: Page, address = "/catalog") {
  const response = await page.goto(address);
  await hydrated(page);
  return response;
}

test("the results are a grid of tiles, several to a row", async ({ page }) => {
  await openCatalog(page);
  await expect(page.getByRole("status")).toHaveText("67 templates");
  await expect(tiles(page)).toHaveCount(24);
  await expect(page.getByRole("main").getByRole("article")).toHaveCount(24);

  const list = tiles(page).first().locator("xpath=ancestor::ul[1]");
  await expect(list).toHaveCSS("display", "grid");

  // Tiles of one row stand side by side: the first row holds at least two, on a phone too.
  const boxes = await tiles(page).evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { top: Math.round(box.top), width: Math.round(box.width) };
    }),
  );
  const firstRow = boxes.filter((box) => box.top === boxes[0]?.top);
  expect(firstRow.length).toBeGreaterThanOrEqual(2);
  // Every tile is as wide as every other: the grid is even.
  expect(new Set(boxes.map((box) => box.width)).size).toBe(1);
});

test("the six free samples come first, and every other tile is locked", async ({ page }) => {
  await openCatalog(page);

  const kinds = await tiles(page).evaluateAll((elements) =>
    elements.map((element) => (element.hasAttribute("data-free") ? "free" : "locked")),
  );
  expect(kinds.slice(0, 6)).toEqual(Array(6).fill("free"));
  expect(kinds.slice(6)).toEqual(Array(18).fill("locked"));
  await expect(page.locator("[data-tile][data-free][data-locked]")).toHaveCount(0);

  // A free tile is one link and says what it is; a locked tile is one button.
  for (const tile of await page.locator("[data-tile][data-free]").all()) {
    await expect(tile.getByRole("link")).toHaveCount(1);
    await expect(tile.getByRole("button")).toHaveCount(0);
    await expect(tile.getByText("Free sample", { exact: true })).toBeVisible();
    await expect(tile.getByRole("link")).toHaveAttribute("href", /^\/catalog\?view=[a-z0-9-]+$/);
  }
  const locked = page.locator("[data-tile][data-locked]").first();
  await expect(locked.getByRole("button")).toHaveCount(1);
  await expect(locked.getByRole("link")).toHaveCount(0);
  await expect(locked.getByText("Free sample")).toHaveCount(0);
});

test("nothing on the page has a price", async ({ page }) => {
  for (const address of ["/catalog", "/catalog?page=2", "/catalog?free=1"]) {
    await openCatalog(page, address);
    await expect(tiles(page).first()).toBeVisible();
    expect(await page.getByRole("main").innerText(), address).not.toContain("$");
  }
});

test("“Free samples only” leaves the six, and the URL says so", async ({ page }) => {
  await openCatalog(page);
  await openFiltersIfCollapsed(page);
  await page.getByRole("checkbox", { name: "Free samples only" }).filter({ visible: true }).check();

  await expect(page).toHaveURL(/[?&]free=1(&|$)/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("status")).toHaveText("6 templates");
  await expect(tiles(page)).toHaveCount(6);
  await expect(page.locator("[data-tile][data-locked]")).toHaveCount(0);

  // The address restores it.
  await openCatalog(page, "/catalog?free=1");
  await expect(tiles(page)).toHaveCount(6);
  await openFiltersIfCollapsed(page);
  await expect(
    page.getByRole("checkbox", { name: "Free samples only" }).filter({ visible: true }),
  ).toBeChecked();
});

test("the sort order offers the samples first or the titles, and never a price", async ({
  page,
}) => {
  await openCatalog(page);
  const sort = page.getByRole("combobox", { name: "Sort by" });
  await expect(sort.getByRole("option")).toHaveText(["Free samples first", "Title A–Z"]);

  await sort.selectOption({ label: "Title A–Z" });
  await expect(page).toHaveURL(/sort=title/, { timeout: NAVIGATION_TIMEOUT });
  const titles = await tiles(page).locator("h2, h3").allInnerTexts();
  expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
});

test("filtering updates the URL and the results", async ({ page }) => {
  await openCatalog(page);
  await expect(page.getByRole("status")).toHaveText("67 templates");

  await openFiltersIfCollapsed(page);
  await page
    .getByRole("checkbox", { name: /^Training/ })
    .filter({ visible: true })
    .check();

  await expect(page).toHaveURL(/type=training/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("status")).toHaveText("10 templates");
});

test("a filtered URL restores the same state on load", async ({ page }) => {
  await openCatalog(page, "/catalog?type=training&app=sharepoint");
  await expect(page.getByRole("status")).toHaveText("5 templates");
  await openFiltersIfCollapsed(page);
  await expect(
    page.getByRole("checkbox", { name: /^Training/ }).filter({ visible: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: /^SharePoint/ }).filter({ visible: true }),
  ).toBeChecked();
});

test("search keeps the active filters", async ({ page }) => {
  await openCatalog(page, "/catalog?type=sponsor");
  await page.getByRole("searchbox", { name: "Search templates" }).fill("kickoff deck");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page).toHaveURL(/q=kickoff/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page).toHaveURL(/type=sponsor/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("status")).toContainText("1 template");
  await expect(tiles(page).first()).toContainText("Executive Sponsor Kickoff Deck");
});

test("no matches shows an empty state that can be cleared", async ({ page }) => {
  await openCatalog(page, "/catalog?q=zzzzqqq");
  await expect(page.getByText("No templates match these filters.")).toBeVisible();

  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/catalog$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(tiles(page)).toHaveCount(24);
});

test("malformed parameters never break the page", async ({ page }) => {
  const response = await page.goto("/catalog?page=9999&type=poster&page=abc&sort=nope&phase=%00");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("status")).toHaveText("67 templates");

  const lastPage = await page.goto("/catalog?page=9999");
  expect(lastPage?.status()).toBe(200);
  await expect(tiles(page)).toHaveCount(19);

  const odd = await page.goto(`/catalog?q=${encodeURIComponent("(a*\\ <b>")}`);
  expect(odd?.status()).toBe(200);
  await expect(page.getByText("No templates match these filters.")).toBeVisible();
});

test("the filter dialog opens and closes on a phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the dialog is only used on narrow screens");
  await openCatalog(page);
  await page.getByRole("button", { name: /^Filters/ }).click();
  const dialog = page.getByRole("dialog", { name: "Filters" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("checkbox", { name: /^Plans/ }).check();
  await expect(page).toHaveURL(/type=plan/, { timeout: NAVIGATION_TIMEOUT });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Show results" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Filters (1)" })).toBeVisible();
});
