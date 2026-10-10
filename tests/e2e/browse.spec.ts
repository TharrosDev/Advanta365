import { expect, test } from "@playwright/test";

test("home leads to a phase and on to a template", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Beta preview — templates shown are samples.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Change management templates for Microsoft 365 rollouts",
  );

  await page.getByRole("main").getByRole("link", { name: "Prepare", exact: true }).click();
  await expect(page).toHaveURL(/\/phases\/prepare$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prepare");

  const firstCard = page.getByRole("article").first().getByRole("link");
  const title = (await firstCard.textContent()) ?? "";
  await firstCard.click();

  await expect(page).toHaveURL(/\/templates\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeVisible();
});

test("every page fits the viewport without sideways scrolling", async ({ page }) => {
  for (const path of [
    "/",
    "/catalog",
    "/phases/manage",
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
