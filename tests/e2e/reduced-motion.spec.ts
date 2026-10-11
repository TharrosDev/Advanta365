import { expect, test } from "@playwright/test";

// With prefers-reduced-motion nothing on the site moves by itself: a first visit opens on the page
// and not under the cover, the hero sheet is drawn in its final state, and navigation and the
// filters work as they always do. Every test here is the first load of its session, the one load
// that would have the cover.

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("the home page is drawn in its final state, with nothing in motion", async ({ page }) => {
  await page.goto("/");

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText("Don’t start your M365 rollout from a blank prompt.");

  // Three things start by themselves when motion is allowed: the cover of a first visit, the fill
  // of the tally and the blink of the caret. All three are switched off. The cover is in the page
  // and not displayed, the root element was never marked for it, and nothing at all is animating.
  const cover = page.locator("[data-intro-cover]");
  await expect(cover).toHaveCount(1);
  await expect(cover).toHaveCSS("display", "none");
  await expect(page.locator("html")).not.toHaveAttribute("data-intro");
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);

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
