import { expect, test } from "@playwright/test";

// A template's old address is not here: it leads to the catalog now (redirects.spec.ts).
const MISSING = ["/cart/nope", "/phases/nope", "/nope", "/templates/nope/extra"];

for (const path of MISSING) {
  test(`${path} returns the 404 page`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    // The 404 keeps the site header so visitors can carry on.
    await expect(page.getByRole("banner")).toBeVisible();
  });
}

test("a mixed-case address redirects to the lower-case page", async ({ page }) => {
  const response = await page.goto("/Phases/Build-The-Training");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/phases\/build-the-training$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Build the training");
});
