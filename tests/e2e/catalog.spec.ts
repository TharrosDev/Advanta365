import { expect, test, type Page } from "@playwright/test";

/** On narrow screens the filters live in a dialog behind a button. */
async function openFiltersIfCollapsed(page: Page) {
  const button = page.getByRole("button", { name: /^Filters/ });
  if (await button.isVisible()) await button.click();
}

const cards = (page: Page) => page.getByRole("main").getByRole("article");

test("filtering updates the URL and the results", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.getByRole("status")).toHaveText("67 templates");
  await expect(cards(page)).toHaveCount(24);

  await openFiltersIfCollapsed(page);
  await page
    .getByRole("checkbox", { name: /^Training/ })
    .filter({ visible: true })
    .check();

  await expect(page).toHaveURL(/type=training/);
  await expect(page.getByRole("status")).toHaveText("10 templates");
});

test("a filtered URL restores the same state on load", async ({ page }) => {
  await page.goto("/catalog?type=training&app=sharepoint");
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
  await page.goto("/catalog?type=sponsor");
  await page.getByRole("searchbox", { name: "Search templates" }).fill("kickoff deck");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page).toHaveURL(/q=kickoff/);
  await expect(page).toHaveURL(/type=sponsor/);
  await expect(page.getByRole("status")).toContainText("1 template");
  await expect(cards(page).first()).toContainText("Executive Sponsor Kickoff Deck");
});

test("a search with no match names the search and offers the phases", async ({ page }) => {
  await page.goto("/catalog?q=zzzzqqq");
  await expect(page.getByText("No templates match “zzzzqqq”.")).toBeVisible();
  const pivot = page.getByRole("navigation", { name: "Browse by phase" });
  await expect(pivot.getByRole("link")).toHaveCount(7);
  await expect(pivot.getByRole("link", { name: "Prepare", exact: true })).toHaveAttribute(
    "href",
    "/phases/prepare",
  );

  await page.getByRole("link", { name: "Clear search" }).click();
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(cards(page)).toHaveCount(24);
});

test("filters with no match keep the filters wording", async ({ page }) => {
  await page.goto("/catalog?q=zzzzqqq&type=training");
  await expect(page.getByText("No templates match these filters.")).toBeVisible();
  await page.getByRole("link", { name: "Clear search and filters" }).click();
  await expect(page).toHaveURL(/\/catalog$/);
});

test("active filters show as chips that remove one value each", async ({ page }) => {
  await page.goto("/catalog?phase=prepare&format=docx");
  const chips = page.getByRole("list", { name: "Active filters" });
  await expect(chips.getByRole("link", { name: /^Remove/ })).toHaveCount(2);

  await chips.getByRole("link", { name: "Remove File format filter: Word" }).click();
  await expect(page).toHaveURL(/\/catalog\?phase=prepare$/);
  await expect(chips.getByRole("link", { name: /^Remove/ })).toHaveCount(1);

  await chips.getByRole("link", { name: "Clear all", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(page.getByRole("list", { name: "Active filters" })).toHaveCount(0);
});

test("malformed parameters never break the page", async ({ page }) => {
  const response = await page.goto("/catalog?page=9999&type=poster&page=abc&sort=nope&phase=%00");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("status")).toHaveText("67 templates");

  const lastPage = await page.goto("/catalog?page=9999");
  expect(lastPage?.status()).toBe(200);
  await expect(cards(page)).toHaveCount(19);

  const odd = await page.goto(`/catalog?q=${encodeURIComponent("(a*\\ <b>")}`);
  expect(odd?.status()).toBe(200);
  await expect(page.getByText("No templates match “(a*\\ <b>”.")).toBeVisible();
});

test("the filter dialog opens and closes on a phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the dialog is only used on narrow screens");
  await page.goto("/catalog");
  await page.getByRole("button", { name: /^Filters/ }).click();
  const dialog = page.getByRole("dialog", { name: "Filters" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("checkbox", { name: /^Plans/ }).check();
  await expect(page).toHaveURL(/type=plan/);
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Show results" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Filters (1)" })).toBeVisible();
});
