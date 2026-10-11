import { expect, test } from "@playwright/test";

// With prefers-reduced-motion the site has no entry overlay, no entrance animations and no route
// fade: everything is on the page at once and navigation works as plain links.

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("the home page shows its content at once, without the intro", async ({ page }) => {
  await page.goto("/");

  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-entry");
  await expect(html).not.toHaveAttribute("data-entry-brand");
  // Hidden from the first paint and gone from the DOM right after hydration: both count as hidden.
  await expect(page.locator("[data-entry-overlay]")).toBeHidden();

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText("Don’t start your M365 rollout from a blank prompt.");
  // The words are not animated: the rise reveal is switched off, so they are simply there.
  await expect(heading.locator("span").first()).toHaveCSS("animation-name", "none");

  // The flat ribbons stand in for the WebGL canvas.
  await expect(page.locator("[data-hero-lines]")).toBeVisible();
});

test("links navigate without a fade", async ({ page }) => {
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
