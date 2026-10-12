import { expect, test } from "@playwright/test";
import { hydrated, introSeen, NAVIGATION_TIMEOUT } from "./helpers";

// The two specs that start on "/" navigate by links at the start of the run, when every worker is
// loading its first page. They get a navigation budget, so a busy machine fails them on the page and
// not on the clock. They are about the links, so they start on the page and not under the cover of
// a first visit.

test.beforeEach(async ({ page }) => {
  await introSeen(page);
});

test("home leads to a phase and on to its free sample, open in the catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Beta preview — templates shown are samples.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Don’t start your M365 rollout from a blank prompt.",
  );

  await hydrated(page);
  await page.getByRole("main").getByRole("link", { name: "Prepare", exact: true }).click();
  await expect(page).toHaveURL(/\/phases\/prepare$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prepare");

  // Every template of the phase is a tile; the one free sample among them is a link.
  const sample = page.locator("[data-tile][data-free]").getByRole("link");
  await expect(sample).toHaveCount(1);
  const title = (await sample.textContent()) ?? "";
  await sample.click();

  await expect(page).toHaveURL(/\/catalog\?view=[a-z0-9-]+$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catalog");
  await expect(page.getByRole("dialog", { name: title })).toBeVisible();
});

test("the hero leads to the worked example, which says its file cannot be downloaded yet", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("main").getByRole("link", { name: "See a sample", exact: true }).click();

  await expect(page).toHaveURL(/\/sample$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A complete worked example");
  await expect(
    page.getByText("Beta note: the sample file is not available to download yet."),
  ).toBeVisible();
  // The page describes the example; it offers no file.
  await expect(page.getByRole("main").getByRole("link", { name: /download/i })).toHaveCount(0);
});

test("every page fits the viewport without sideways scrolling", async ({ page }) => {
  // Seven full page loads in one test, at the start of the run: three times the default budget.
  test.slow();
  for (const path of [
    "/",
    "/catalog",
    "/phases/make-the-case",
    "/sample",
    "/purchase",
    "/about",
    "/catalog?view=change-management-strategy",
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
