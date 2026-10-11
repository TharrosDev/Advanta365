import { expect, test } from "@playwright/test";

test.describe("phone menu", () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, "the menu button only shows on narrow screens");
  });

  test("closes after following a link", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Menu", { exact: true }).click();
    const menu = page.getByRole("navigation", { name: "Menu" });
    await expect(menu).toBeVisible();

    await menu.getByRole("link", { name: "Catalog" }).click();
    await expect(page).toHaveURL(/\/catalog$/);
    await expect(menu).toBeHidden();
  });

  test("closes on Escape and on a tap outside", async ({ page }) => {
    await page.goto("/");
    const menu = page.getByRole("navigation", { name: "Menu" });

    await page.getByText("Menu", { exact: true }).click();
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    await page.getByText("Menu", { exact: true }).click();
    await expect(menu).toBeVisible();
    // The menu is a curtain with an invisible backdrop; a tap below the panel lands on the backdrop.
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("no viewport");
    await page.mouse.click(viewport.width / 2, viewport.height - 8);
    await expect(menu).toBeHidden();
  });
});
