import { expect, test, type Page } from "@playwright/test";

// From 68em the bar shows its navigation inline and the phase rail stands under it. This file
// covers both on the desktop project (1280x800); menu.spec.ts covers the drawer on a phone.

const PRIMARY = ["Catalog", "Bundles", "Pricing", "About", "Contact"];
const PHASES = ["Make the case", "Plan", "Design", "Prepare", "Communicate", "Execute", "Sustain"];

const banner = (page: Page) => page.getByRole("banner");
const primary = (page: Page) => banner(page).getByRole("navigation", { name: "Primary" });
// Exact: the footer has a navigation named "Rollout phases".
const rail = (page: Page) => page.getByRole("navigation", { name: "Phases", exact: true });

test.describe("desktop bar", () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, "the inline navigation and the rail only show from 68em");
  });

  test("shows the five primary links inline and no Menu button", async ({ page }) => {
    await page.goto("/");

    await expect(primary(page).getByRole("link")).toHaveCount(PRIMARY.length);
    for (const name of PRIMARY) {
      await expect(primary(page).getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(banner(page).getByRole("link", { name: "Advanta365", exact: true })).toBeVisible();
    await expect(banner(page).getByRole("link", { name: /^Cart/ })).toBeVisible();
    await expect(banner(page).getByRole("button", { name: "Menu", exact: true })).toBeHidden();
    await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
  });

  test("marks the current page, and the section a page lies under", async ({ page }) => {
    await page.goto("/pricing");
    await expect(primary(page).getByRole("link", { name: "Pricing", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(primary(page).locator("[aria-current]")).toHaveCount(1);

    await page.goto("/bundles/sponsor-essentials");
    await expect(primary(page).getByRole("link", { name: "Bundles", exact: true })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(primary(page).locator("[aria-current]")).toHaveCount(1);

    await page.goto("/");
    await expect(primary(page).locator("[aria-current]")).toHaveCount(0);
  });

  test("the phase rail has seven tabs, each named by its phase", async ({ page }) => {
    await page.goto("/");

    await expect(rail(page)).toBeVisible();
    await expect(rail(page)).toHaveAttribute("data-phase-rail");
    await expect(rail(page).getByRole("link")).toHaveCount(PHASES.length);
    for (const name of PHASES) {
      await expect(rail(page).getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(rail(page).locator("[aria-current]")).toHaveCount(0);
  });

  test("the rail marks a phase page and the phase of a template page", async ({ page }) => {
    await page.goto("/phases/prepare");
    await expect(rail(page).getByRole("link", { name: "Prepare", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(rail(page).locator("[aria-current]")).toHaveCount(1);

    await page.goto("/templates/executive-sponsor-kickoff-deck");
    await expect(
      rail(page).getByRole("link", { name: "Make the case", exact: true }),
    ).toHaveAttribute("aria-current", "true");
    await expect(rail(page).locator("[aria-current]")).toHaveCount(1);
  });

  test("the bar stays at the top after scrolling, and the rail scrolls away", async ({ page }) => {
    await page.goto("/catalog");
    await expect(banner(page)).toHaveCSS("position", "sticky");
    // The bar is set off by a shadow, not by a line under it.
    await expect(banner(page)).toHaveCSS("border-bottom-width", "0px");

    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1200);

    await expect(banner(page)).toBeInViewport({ ratio: 1 });
    const box = await banner(page).boundingBox();
    expect(box?.y).toBe(0);
    await expect(rail(page)).not.toBeInViewport();
  });
});
