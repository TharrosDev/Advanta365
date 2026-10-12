import { expect, test } from "@playwright/test";

const MISSING = [
  "/templates/nope",
  "/templates/NOPE",
  "/templates/a%20b",
  "/cart/nope",
  "/phases/nope",
  "/nope",
  "/templates/nope/extra",
];

for (const path of MISSING) {
  test(`${path} returns the 404 page`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    // The 404 keeps the site header so visitors can carry on.
    await expect(page.getByRole("navigation", { name: "Rollout phases" })).toBeVisible();
  });
}

test("a mixed-case address redirects to the lower-case page", async ({ page }) => {
  const response = await page.goto("/Templates/Executive-Sponsor-Kickoff-Deck");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/templates\/executive-sponsor-kickoff-deck$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Executive Sponsor Kickoff Deck",
  );
});
