import { expect, test, type Page } from "@playwright/test";
import { NAVIGATION_TIMEOUT, openCatalog } from "./helpers";

// The catalog is a grid of small tiles, one per template: its cover, its title, its step and type
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

test("the results are a grid of tiles, several to a row", async ({ page }) => {
  await openCatalog(page);
  await expect(page.locator("#results-heading")).toHaveText("67 templates");
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
    "/catalog?phase=assess-the-impact&q=plan&page=2",
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
  await expect(page.locator("#results-heading")).toHaveText("6 templates");
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

test("the sort order keeps the option that was picked while the server answers", async ({
  page,
  isMobile,
}) => {
  await openCatalog(page);
  if (isMobile) await openFiltersIfCollapsed(page);
  const sort = page.getByRole("combobox", { name: "Sort by" });

  // The server is slow to answer: the select is not given back to the old option meanwhile.
  await page.route(/\/catalog\?.*sort=title/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    await route.continue();
  });
  await sort.selectOption({ label: "Title A–Z" });
  expect(await sort.inputValue()).toBe("title");

  await expect(page).toHaveURL(/sort=title/, { timeout: NAVIGATION_TIMEOUT });
  await expect(sort).toHaveValue("title");
});

test("filtering updates the URL and the results", async ({ page }) => {
  await openCatalog(page);
  await expect(page.locator("#results-heading")).toHaveText("67 templates");

  await openFiltersIfCollapsed(page);
  await page
    .getByRole("checkbox", { name: /^Training/ })
    .filter({ visible: true })
    .check();

  await expect(page).toHaveURL(/type=training/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.locator("#results-heading")).toHaveText("10 templates");
});

test("a filtered URL restores the same state on load", async ({ page }) => {
  await openCatalog(page, "/catalog?type=training&app=sharepoint");
  await expect(page.locator("#results-heading")).toHaveText("5 templates");
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
  await expect(page.locator("#results-heading")).toContainText("1 template");
  await expect(tiles(page).first()).toContainText("Executive Sponsor Kickoff Deck");
});

test("a search with no match names the search and offers the steps, once", async ({
  page,
  isMobile,
}) => {
  await openCatalog(page, "/catalog?q=zzzzqqq");
  await expect(page.getByText("No templates match “zzzzqqq”.")).toBeVisible();
  // Below 68em the drop-down above the results is the way in by step, and the results do not
  // repeat it; from 68em the results offer the steps as cards, and the drop-down is not shown.
  const inResults = page.getByRole("navigation", { name: "Browse by phase" });
  const dropDown = page.getByRole("main").locator("[data-step-menu]");
  if (isMobile) {
    await expect(inResults).toHaveCount(0);
    await dropDown.locator("summary").click();
  } else {
    await expect(dropDown).toBeHidden();
  }
  const pivot = isMobile ? dropDown : inResults;
  await expect(pivot.getByRole("link")).toHaveCount(13);
  await expect(
    pivot.getByRole("link", { name: "Build the training", exact: true }),
  ).toHaveAttribute("href", "/phases/build-the-training");
  // The open drop-down lies over the results; Escape puts it away.
  if (isMobile) await page.keyboard.press("Escape");

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
  await openCatalog(page, "/catalog?phase=build-the-training&format=pptx");
  const chips = page.getByRole("list", { name: "Active filters" });
  await expect(chips.getByRole("link", { name: /^Remove/ })).toHaveCount(2);

  await chips.getByRole("link", { name: "Remove File format filter: PowerPoint" }).click();
  await expect(page).toHaveURL(/\/catalog\?phase=build-the-training$/, {
    timeout: NAVIGATION_TIMEOUT,
  });
  await expect(chips.getByRole("link", { name: /^Remove/ })).toHaveCount(1);

  await chips.getByRole("link", { name: "Clear all", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("list", { name: "Active filters" })).toHaveCount(0);
});

test("“Free samples only” has a chip of its own, and removing it brings the locked tiles back", async ({
  page,
}) => {
  await openCatalog(page, "/catalog?free=1&phase=set-the-strategy");
  const chips = page.getByRole("list", { name: "Active filters" });
  await expect(chips.getByRole("link", { name: /^Remove/ })).toHaveText([
    "Free samples only",
    "Set the strategy",
  ]);
  await expect(tiles(page)).toHaveCount(1);

  await chips.getByRole("link", { name: "Remove filter: Free samples only" }).click();
  await expect(page).toHaveURL(/\/catalog\?phase=set-the-strategy$/, {
    timeout: NAVIGATION_TIMEOUT,
  });
  await expect(page.locator("[data-tile][data-locked]").first()).toBeVisible();

  // The last chip gone, focus is on the count: the keyboard is not left on nothing.
  await chips.getByRole("link", { name: "Remove Phase filter: Set the strategy" }).click();
  await expect(page).toHaveURL(/\/catalog$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.locator("#results-heading")).toBeFocused();
});

test("a free tile keeps the filters that are on in its link", async ({ page }) => {
  await openCatalog(page, "/catalog?free=1&format=docx");
  const link = page.locator("[data-tile][data-free]").first().getByRole("link");
  await expect(link).toHaveAttribute("href", /^\/catalog\?format=docx&free=1&view=[a-z0-9-]+$/);
});

test("step order is the rollout order alone, and one filtered step is lit", async ({
  page,
  isMobile,
}) => {
  await openCatalog(page, "/catalog?sort=phase");
  // The first tile is of the first section, and no tile's section comes before the one ahead of it.
  const phases = await tiles(page).evaluateAll((elements) =>
    elements.map((element) => {
      const meta = [...element.querySelectorAll("p")].find((p) => p.textContent?.includes(" · "));
      return meta?.textContent?.split(" · ")[0] ?? "";
    }),
  );
  expect(phases[0]).toBe("Start here");
  const order = [...new Set(phases)];
  expect(phases).toEqual([...phases].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
  // Not the samples first: the six are spread through the steps they belong to.
  const kinds = await tiles(page).evaluateAll((elements) =>
    elements.map((element) => element.hasAttribute("data-free")),
  );
  expect(kinds.slice(0, 6).every(Boolean)).toBe(false);

  // The step is marked in the drop-down: the catalog's own on a phone, which names it on its
  // button too, and Phases in the bar from 68em.
  await openCatalog(page, "/catalog?phase=go-live-and-support");
  const dropDown = isMobile
    ? page.getByRole("main").locator("[data-step-menu]")
    : page.getByRole("banner").locator("[data-step-menu]");
  if (isMobile) await expect(dropDown.locator("summary")).toContainText("Go live and support");
  await dropDown.locator("summary").click();
  await expect(dropDown.locator('[aria-current="true"]')).toHaveText(/Go live and support/);
  await expect(dropDown.locator("[aria-current]")).toHaveCount(1);

  // Two steps are no single step: nothing is named or marked.
  await openCatalog(page, "/catalog?phase=go-live-and-support,assess-the-impact");
  await expect(dropDown.locator("summary")).toHaveText(isMobile ? "Jump to a phase" : "Phases");
  await dropDown.locator("summary").click();
  await expect(dropDown.getByRole("link").first()).toBeVisible();
  await expect(dropDown.locator("[aria-current]")).toHaveCount(0);
});

test("on a phone the rail is the phases' drop-down, one search row and the sort in the sheet", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "the drop-down and the sheet's sort order are the phone's");
  await openCatalog(page, "/catalog?phase=make-it-stick");

  // One drop-down, named by the step the catalog is filtered on; open, it lists the thirteen in
  // folder order, the lit one in view although it is near the end.
  const dropDown = page.getByRole("main").locator("[data-step-menu]");
  await expect(dropDown).toHaveCount(1);
  await expect(dropDown.locator("summary")).toContainText("Make it stick");
  await dropDown.locator("summary").click();
  await expect(dropDown.getByRole("link")).toHaveCount(13);
  await expect(dropDown.getByRole("link").first()).toHaveAccessibleName("Start here");
  await expect(dropDown.getByRole("link").last()).toHaveAccessibleName("Used at every step");
  const current = dropDown.locator('[aria-current="true"]');
  await expect(current).toHaveText(/Make it stick/);
  await expect(current).toBeInViewport({ ratio: 1 });
  await page.keyboard.press("Escape");
  await expect(current).toBeHidden();
  // The bar's own Phases drop-down is the desktop's: the page never shows the steps twice.
  await expect(page.getByRole("banner").locator("[data-step-menu]")).toBeHidden();

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
  await expect(page.locator("#results-heading")).toHaveText("67 templates");

  const lastPage = await page.goto("/catalog?page=9999");
  expect(lastPage?.status()).toBe(200);
  await expect(tiles(page)).toHaveCount(19);

  const odd = await page.goto(`/catalog?q=${encodeURIComponent("(a*\\ <b>")}`);
  expect(odd?.status()).toBe(200);
  await expect(page.getByText("No templates match “(a*\\ <b>”.")).toBeVisible();
});

test("Clear all filters clears in place: the entry is replaced and focus stays in the list", async ({
  page,
  isMobile,
}) => {
  await openCatalog(page, "/catalog?q=strategy&phase=assess-the-impact&type=training");
  await openFiltersIfCollapsed(page);
  const clear = page
    .getByRole("link", { name: "Clear all filters", exact: true })
    .filter({ visible: true });
  const before = await page.evaluate(() => window.history.length);
  await clear.click();

  // The search stays; the filters go; no entry was added; the link has gone and focus is on the
  // first row, not on nothing.
  await expect(page).toHaveURL(/\/catalog\?q=strategy$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(clear).toHaveCount(0);
  expect(await page.evaluate(() => window.history.length)).toBe(before);
  await expect(
    page.getByRole("checkbox", { name: "Free samples only" }).filter({ visible: true }),
  ).toBeFocused();
  if (isMobile) await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
});

test("the filter sheet closes when the window grows to the rail, and the page is free again", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "the test sets the width of the window itself");
  await page.setViewportSize({ width: 1087, height: 800 });
  await openCatalog(page);
  await page.getByRole("button", { name: /^Filters/ }).click();
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");

  // From 68em the filters stand in the rail and the sheet has no box: it must not stay open,
  // inert and locking the scroll, behind nothing.
  await page.setViewportSize({ width: 1088, height: 800 });
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  await page.getByRole("checkbox", { name: "Free samples only" }).filter({ visible: true }).check();
  await expect(page).toHaveURL(/free=1/, { timeout: NAVIGATION_TIMEOUT });
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
