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

test("every address of the catalog names the plain catalog as the canonical one", async ({
  page,
}) => {
  for (const address of [
    "/catalog",
    "/catalog?view=change-management-strategy",
    "/catalog?view=sharepoint-migration-impact-assessment",
    "/catalog?phase=plan&q=plan&page=2",
  ]) {
    await page.goto(address);
    const canonical = page.locator('head link[rel="canonical"]');
    await expect(canonical, address).toHaveCount(1);
    const href = (await canonical.getAttribute("href")) ?? "";
    const named = new URL(href, page.url());
    expect(named.pathname + named.search + named.hash, address).toBe("/catalog");
  }
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

test("the sort order offers the samples first, the rollout order or the titles, and never a price", async ({
  page,
  isMobile,
}) => {
  await openCatalog(page);
  // On a phone the sort order is at the top of the filter sheet.
  if (isMobile) await openFiltersIfCollapsed(page);
  const sort = page.getByRole("combobox", { name: "Sort by" });
  await expect(sort.getByRole("option")).toHaveText([
    "Free samples first",
    "Phase order",
    "Title A–Z",
  ]);

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

test("a search with no match names the search and offers the phases", async ({ page }) => {
  await openCatalog(page, "/catalog?q=zzzzqqq");
  await expect(page.getByText("No templates match “zzzzqqq”.")).toBeVisible();
  const pivot = page.getByRole("navigation", { name: "Browse by phase" });
  await expect(pivot.getByRole("link")).toHaveCount(7);
  await expect(pivot.getByRole("link", { name: "Prepare", exact: true })).toHaveAttribute(
    "href",
    "/phases/prepare",
  );

  await page.getByRole("link", { name: "Clear search" }).click();
  await expect(page).toHaveURL(/\/catalog$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(tiles(page)).toHaveCount(24);
});

test("filters with no match keep the filters wording", async ({ page }) => {
  await openCatalog(page, "/catalog?q=zzzzqqq&type=training");
  await expect(page.getByText("No templates match these filters.")).toBeVisible();
  await page.getByRole("link", { name: "Clear search and filters" }).click();
  await expect(page).toHaveURL(/\/catalog$/, { timeout: NAVIGATION_TIMEOUT });
});

test("the free filter with a search that finds none of the six is a filter with no match", async ({
  page,
}) => {
  await openCatalog(page, "/catalog?free=1&q=zzzzqqq");
  await expect(page.getByText("No templates match these filters.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Browse by phase" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Clear search and filters" })).toBeVisible();
});

test("active filters show as chips that remove one value each", async ({ page }) => {
  await openCatalog(page, "/catalog?phase=prepare&format=docx");
  const chips = page.getByRole("list", { name: "Active filters" });
  await expect(chips.getByRole("link", { name: /^Remove/ })).toHaveCount(2);

  await chips.getByRole("link", { name: "Remove File format filter: Word" }).click();
  await expect(page).toHaveURL(/\/catalog\?phase=prepare$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(chips.getByRole("link", { name: /^Remove/ })).toHaveCount(1);

  await chips.getByRole("link", { name: "Clear all", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("list", { name: "Active filters" })).toHaveCount(0);
});

test("“Free samples only” has a chip of its own, and removing it brings the locked tiles back", async ({
  page,
}) => {
  await openCatalog(page, "/catalog?free=1&phase=plan");
  const chips = page.getByRole("list", { name: "Active filters" });
  await expect(chips.getByRole("link", { name: /^Remove/ })).toHaveText([
    "Free samples only",
    "Plan",
  ]);
  await expect(tiles(page)).toHaveCount(1);

  await chips.getByRole("link", { name: "Remove filter: Free samples only" }).click();
  await expect(page).toHaveURL(/\/catalog\?phase=plan$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.locator("[data-tile][data-locked]").first()).toBeVisible();

  // The last chip gone, focus is on the count: the keyboard is not left on nothing.
  await chips.getByRole("link", { name: "Remove Phase filter: Plan" }).click();
  await expect(page).toHaveURL(/\/catalog$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.locator("#results-heading")).toBeFocused();
});

test("a free tile keeps the filters that are on in its link", async ({ page }) => {
  await openCatalog(page, "/catalog?free=1&format=docx");
  const link = page.locator("[data-tile][data-free]").first().getByRole("link");
  await expect(link).toHaveAttribute("href", /^\/catalog\?format=docx&free=1&view=[a-z0-9-]+$/);
});

test("phase order is the rollout order alone, and one filtered phase is lit", async ({
  page,
  isMobile,
}) => {
  await openCatalog(page, "/catalog?sort=phase");
  // The first tile is of the first phase, and no tile's phase comes before the one ahead of it.
  const phases = await tiles(page).evaluateAll((elements) =>
    elements.map((element) => {
      const meta = [...element.querySelectorAll("p")].find((p) => p.textContent?.includes(" · "));
      return meta?.textContent?.split(" · ")[0] ?? "";
    }),
  );
  expect(phases[0]).toBe("Make the case");
  const order = [...new Set(phases)];
  expect(phases).toEqual([...phases].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
  // Not the samples first: the six are spread through the phases they belong to.
  const kinds = await tiles(page).evaluateAll((elements) =>
    elements.map((element) => element.hasAttribute("data-free")),
  );
  expect(kinds.slice(0, 6).every(Boolean)).toBe(false);

  await openCatalog(page, "/catalog?phase=execute");
  const lit = isMobile
    ? page.getByRole("navigation", { name: "Start from a phase" })
    : page.getByRole("navigation", { name: "Phases" });
  await expect(lit.locator('[aria-current="true"]')).toHaveText(/Execute/);
  await expect(lit.locator("[aria-current]")).toHaveCount(1);

  // Two phases are no single phase: nothing is lit.
  await openCatalog(page, "/catalog?phase=execute,plan");
  await expect(lit.getByRole("link").first()).toBeVisible();
  await expect(lit.locator("[aria-current]")).toHaveCount(0);
});

test("on a phone the rail is one strip of phases, one search row and the sort in the sheet", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "the strip and the sheet's sort order are the phone's");
  await openCatalog(page, "/catalog?phase=sustain");

  // One strip, seven phases, the lit one scrolled into view although it is the last.
  const strip = page.getByRole("navigation", { name: "Start from a phase" });
  await expect(strip).toHaveCount(1);
  await expect(strip.getByRole("link")).toHaveCount(7);
  const current = strip.locator('[aria-current="true"]');
  await expect(current).toHaveText(/Sustain/);
  await expect(current).toBeInViewport({ ratio: 1 });
  // The bar's own rail is the desktop's: the page never shows the phases twice.
  await expect(page.locator("[data-phase-rail]")).toBeHidden();

  // One search field, with its button inside it, beside the Filters button.
  const search = page.getByRole("searchbox", { name: "Search templates" });
  await expect(search).toHaveCount(1);
  const submit = page.getByRole("button", { name: "Search", exact: true });
  const filters = page.getByRole("button", { name: /^Filters/ });
  const [field, button, opener] = await Promise.all(
    [search, submit, filters].map(async (locator) => (await locator.boundingBox())!),
  );
  expect(button!.x).toBeGreaterThanOrEqual(field!.x);
  expect(button!.x + button!.width).toBeLessThanOrEqual(field!.x + field!.width + 0.5);
  expect(Math.min(button!.width, button!.height)).toBeGreaterThanOrEqual(43.5);
  expect(Math.abs(opener!.y - field!.y)).toBeLessThan(2);

  // The sort order is not above the results; it is at the top of the sheet.
  await expect(page.getByRole("combobox", { name: "Sort by" })).toHaveCount(0);
  await filters.click();
  const dialog = page.getByRole("dialog", { name: "Filters" });
  await expect(dialog.getByRole("combobox", { name: "Sort by" })).toBeVisible();
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
  await expect(page.getByText("No templates match “(a*\\ <b>”.")).toBeVisible();
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
