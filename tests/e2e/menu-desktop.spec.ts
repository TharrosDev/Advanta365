import { expect, test, type Page } from "@playwright/test";
import { INTRO_TEST_TIMEOUT, waitForIntroEnd } from "./helpers";

// The menu is a curtain on every viewport. menu.spec.ts covers it on a phone; this file is the
// desktop counterpart (1280x800). Links are always scoped to the Menu navigation: the footer has a
// "Footer" navigation with the same link names, and an open menu does not hide the page from the
// accessibility tree.

test.describe("desktop menu", () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, "the phone menu is covered by menu.spec.ts");
  });

  const toggle = (page: Page) =>
    page.getByRole("banner").getByRole("button", { name: "Menu", exact: true });
  const menu = (page: Page) => page.getByRole("navigation", { name: "Menu" });

  test("opens, turns the page dark, and closes on Escape and on the Close button", async ({
    page,
  }) => {
    await page.goto("/catalog");
    const html = page.locator("html");

    await toggle(page).click();
    await expect(menu(page)).toBeVisible();
    await expect(html).toHaveAttribute("data-theme", "dark");

    // Escape: the curtain retracts, focus is back on the toggle and the page is light again.
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
    await expect(toggle(page)).toBeFocused();
    await expect(html).not.toHaveAttribute("data-theme");

    await toggle(page).click();
    await expect(menu(page)).toBeVisible();
    await expect(html).toHaveAttribute("data-theme", "dark");

    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(menu(page)).toBeHidden();
    await expect(html).not.toHaveAttribute("data-theme");
  });

  test("closes on a click beside the panel", async ({ page }) => {
    await page.goto("/catalog");

    await toggle(page).click();
    await expect(menu(page)).toBeVisible();

    // The panel is at most 502px wide and centred; the rest of the viewport is the backdrop.
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("no viewport");
    await page.mouse.click(viewport.width - 64, viewport.height / 2);
    await expect(menu(page)).toBeHidden();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  });

  test("following a link navigates and closes the menu", async ({ page }) => {
    await page.goto("/catalog");

    await toggle(page).click();
    await expect(menu(page)).toBeVisible();
    await menu(page).getByRole("link", { name: "Pricing" }).click();

    await expect(page).toHaveURL(/\/pricing$/);
    await expect(menu(page)).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pricing");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  });

  test("works on the home page once the intro is over", async ({ page }) => {
    test.setTimeout(INTRO_TEST_TIMEOUT);
    await page.goto("/");
    await waitForIntroEnd(page);

    await toggle(page).click();
    await expect(menu(page)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
    // The scroll theme and the menu theme share one controller: the menu's release leaves the
    // home page light, because it is at the top and #practice is far below.
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  });
});
