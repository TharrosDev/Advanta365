import { expect, test } from "@playwright/test";
import { NAVIGATION_TIMEOUT } from "./helpers";

// The two specs that start on "/" navigate by links at the start of the run, when every worker is
// loading its first page. They get a navigation budget, so a busy machine fails them on the page and
// not on the clock.

test("home leads to a phase and on to a template", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Beta preview — templates shown are samples.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Don’t start your M365 rollout from a blank prompt.",
  );

  await page.getByRole("main").getByRole("link", { name: "Prepare", exact: true }).click();
  await expect(page).toHaveURL(/\/phases\/prepare$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prepare");

  const firstCard = page.getByRole("article").first().getByRole("link");
  const title = (await firstCard.textContent()) ?? "";
  await firstCard.click();

  await expect(page).toHaveURL(/\/templates\//, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeVisible();
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
  // Eleven full page loads in one test, at the start of the run: three times the default budget.
  test.slow();
  for (const path of [
    "/",
    "/catalog",
    "/phases/make-the-case",
    "/sample",
    "/bundles",
    "/pricing",
    "/about",
    "/contact",
    "/cart",
    "/templates/sharepoint-migration-impact-assessment",
    "/bundles/sharepoint-rollout-complete",
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
