import { expect, test } from "@playwright/test";

// With prefers-reduced-motion nothing on the site moves by itself: the hero sheet is drawn in its
// final state, and navigation and the filters work as they always do.

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("the home page is drawn in its final state, with nothing in motion", async ({ page }) => {
  await page.goto("/");

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText("Don’t start your M365 rollout from a blank prompt.");

  // The fill of the tallies and the blink of the caret are the only things that start by
  // themselves, and both are switched off.
  const blocks = page.locator("[data-tally] [data-block]");
  expect(await blocks.count()).toBeGreaterThan(0);
  for (const block of await blocks.all()) {
    await expect(block).toHaveCSS("animation-name", "none");
  }

  const carets = page.locator("[data-caret]");
  expect(await carets.count()).toBeGreaterThan(0);
  for (const caret of await carets.all()) {
    await expect(caret).toHaveCSS("animation-name", "none");
  }

  // Every graphic is HTML, CSS or inline SVG.
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("links navigate", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("main").getByRole("link", { name: "Prepare", exact: true }).click();

  await expect(page).toHaveURL(/\/phases\/prepare$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prepare");
});

test("the catalog filters work", async ({ page }) => {
  await page.goto("/catalog");

  // On narrow screens the filters live in a dialog behind a button.
  const open = page.getByRole("button", { name: /^Filters/ });
  if (await open.isVisible()) await open.click();

  await page
    .getByRole("checkbox", { name: /^Training/ })
    .filter({ visible: true })
    .check();

  await expect(page).toHaveURL(/type=training/);
});
