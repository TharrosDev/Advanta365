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
    await page.getByRole("heading", { level: 1 }).click();
    await expect(menu).toBeHidden();
  });
});
