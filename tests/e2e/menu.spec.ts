import { expect, test, type Page } from "@playwright/test";
import { introSeen, NAVIGATION_TIMEOUT } from "./helpers";

// Below 68em the bar has the brand, the purchase button without its price, and a "Menu" button
// that opens the site menu: a native modal dialog on the right edge of the screen. This file covers
// both on the phone project; header.spec.ts covers the three zones of the desktop bar.

const PRIMARY = ["Purchase", "Catalog", "Why Advanta", "Contact"];
const PHASES = ["Make the case", "Plan", "Design", "Prepare", "Communicate", "Execute", "Sustain"];

// A caption the menu must not show under the contact address. Written in two parts so that this
// file does not contain the sentence it checks for.
const RETIRED_CAPTION = ["For general", "questions"].join(" ");

const toggle = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: "Menu", exact: true });
const drawer = (page: Page) => page.getByRole("dialog", { name: "Site menu" });
const buy = (page: Page) =>
  page.getByRole("banner").getByRole("link", { name: "Get the toolkit", exact: true });
const brand = (page: Page) =>
  page.getByRole("banner").getByRole("link", { name: "Advanta365", exact: true });

/**
 * Opens the menu. The button only works once the bar has hydrated, and nothing on the page says
 * when that is, so the click is repeated until the menu is open.
 */
async function openDrawer(page: Page) {
  await expect(async () => {
    if (!(await drawer(page).isVisible())) await toggle(page).click({ timeout: 1_000 });
    await expect(drawer(page)).toBeVisible({ timeout: 1_000 });
  }).toPass();
}

test.describe("phone menu", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, "the Menu button only shows below 68em");
    // The menu is the subject here, not the cover a first visit to the home page opens under.
    await introSeen(page);
  });

  test("the bar at 390px: the brand, the button without its price, then Menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // One button with one name; the price is not read out as it is on the desktop bar.
    await expect(buy(page)).toBeVisible();
    await expect(buy(page)).toHaveAttribute("href", "/purchase");
    await expect(page.getByRole("banner").getByText("$1,499.99")).toBeHidden();
    await expect(page.getByRole("banner").getByRole("link", { name: /\$/ })).toHaveCount(0);
    await expect(
      page.getByRole("banner").getByRole("navigation", { name: "Primary" }),
    ).toBeHidden();

    const [brandBox, buyBox, menuBox] = await Promise.all([
      brand(page).boundingBox(),
      buy(page).boundingBox(),
      toggle(page).boundingBox(),
    ]);
    if (!brandBox || !buyBox || !menuBox) throw new Error("the bar is missing a control");
    // Left to right, side by side, never on top of each other.
    expect(brandBox.x + brandBox.width).toBeLessThanOrEqual(buyBox.x);
    expect(buyBox.x + buyBox.width).toBeLessThanOrEqual(menuBox.x);
    for (const box of [buyBox, menuBox]) expect(box.height).toBeGreaterThanOrEqual(44);

    await page.goto("/purchase");
    await expect(buy(page)).toHaveAttribute("aria-current", "page");
  });

  test("at 320px the bar does not scroll sideways and keeps the mark, the button and Menu", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    for (const path of ["/", "/purchase", "/catalog"]) {
      await page.goto(path);
      await expect(brand(page)).toBeVisible();
      await expect(buy(page)).toBeVisible();
      await expect(toggle(page)).toBeVisible();

      const fits = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
      expect(fits, path).toBe(true);

      // In order and side by side. The brand link reaches 44px through a layer; the button and
      // Menu are 44px high and wide.
      const boxes = await Promise.all(
        [brand(page), buy(page), toggle(page)].map((control) => control.boundingBox()),
      );
      let right = 0;
      for (const [index, box] of boxes.entries()) {
        if (!box) throw new Error("the bar is missing a control");
        if (index > 0) {
          expect(box.height, path).toBeGreaterThanOrEqual(44);
          expect(box.width, path).toBeGreaterThanOrEqual(44);
        }
        expect(box.x, path).toBeGreaterThanOrEqual(right);
        expect(box.x + box.width, path).toBeLessThanOrEqual(320);
        right = box.x + box.width;
      }
    }
  });

  test("the Menu button opens the site menu with its four pages and the seven phases", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(drawer(page)).toBeHidden();
    await expect(toggle(page)).toHaveAttribute("aria-haspopup", "dialog");
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");

    await openDrawer(page);
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("dialog[data-nav-drawer]")).toHaveJSProperty("open", true);
    // Focus moves into the dialog: its own Close button is the first stop.
    await expect(drawer(page).getByRole("button", { name: "Close", exact: true })).toBeFocused();

    const menu = drawer(page).getByRole("navigation", { name: "Menu" });
    await expect(menu.getByRole("link")).toHaveCount(PRIMARY.length + PHASES.length);
    for (const name of PRIMARY) {
      await expect(menu.getByRole("link", { name, exact: true })).toBeVisible();
    }

    // The phases are a list under a visible label, and each link is named by its phase alone.
    const phases = menu.getByRole("list", { name: "Rollout phases" });
    await expect(phases.getByRole("link")).toHaveCount(PHASES.length);
    for (const name of PHASES) {
      await expect(phases.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(menu.getByText("Rollout phases", { exact: true })).toBeVisible();

    // The contact address closes the panel, with no caption under it.
    await expect(drawer(page).locator('a[href^="mailto:"]')).toBeVisible();
    await expect(page.getByText(RETIRED_CAPTION)).toHaveCount(0);
  });

  test("marks the page being shown", async ({ page }) => {
    await page.goto("/purchase");
    await openDrawer(page);
    const menu = drawer(page).getByRole("navigation", { name: "Menu" });
    await expect(menu.getByRole("link", { name: "Purchase", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(menu.locator("[aria-current]")).toHaveCount(1);
  });

  test("a link navigates and closes the menu", async ({ page }) => {
    await page.goto("/");
    await openDrawer(page);
    await drawer(page).getByRole("link", { name: "Catalog", exact: true }).click();

    await expect(page).toHaveURL(/\/catalog$/, { timeout: NAVIGATION_TIMEOUT });
    await expect(drawer(page)).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catalog");
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");

    // A phase link does the same, and the phase is marked when the menu is opened again.
    await openDrawer(page);
    await drawer(page).getByRole("link", { name: "Prepare", exact: true }).click();
    await expect(page).toHaveURL(/\/phases\/prepare$/, { timeout: NAVIGATION_TIMEOUT });
    await expect(drawer(page)).toBeHidden();

    await openDrawer(page);
    await expect(drawer(page).getByRole("link", { name: "Prepare", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("Escape closes it and focus returns to the Menu button", async ({ page }) => {
    await page.goto("/");
    await openDrawer(page);

    await page.keyboard.press("Escape");
    await expect(drawer(page)).toBeHidden();
    await expect(toggle(page)).toBeFocused();
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("a click on the scrim closes it", async ({ page }) => {
    await page.goto("/");
    await openDrawer(page);

    // The panel is at most 88% of the width and sits on the right, so x=8 is the dimmed page.
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("no viewport");
    await page.mouse.click(8, viewport.height / 2);
    await expect(drawer(page)).toBeHidden();
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("a click inside the panel, away from any link, leaves it open", async ({ page }) => {
    await page.goto("/");
    await openDrawer(page);

    await drawer(page).getByText("Rollout phases", { exact: true }).click();
    await expect(drawer(page)).toBeVisible();
  });

  test("a drag that starts inside the panel and ends on the scrim leaves it open", async ({
    page,
  }) => {
    await page.goto("/");
    await openDrawer(page);

    // The browser sends the click to the dialog, the common ancestor of the label and the scrim,
    // but the press was not on the scrim, so it is a selection and not a click on the dimmed page.
    const label = await drawer(page).getByText("Rollout phases", { exact: true }).boundingBox();
    const viewport = page.viewportSize();
    if (!label || !viewport) throw new Error("no label or viewport");
    await page.mouse.move(label.x + 4, label.y + label.height / 2);
    await page.mouse.down();
    await page.mouse.move(8, viewport.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(drawer(page)).toBeVisible();
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "true");
  });

  test("its own Close button closes it", async ({ page }) => {
    await page.goto("/");
    await openDrawer(page);

    await drawer(page).getByRole("button", { name: "Close", exact: true }).click();
    await expect(drawer(page)).toBeHidden();
    await expect(toggle(page)).toBeFocused();
  });

  test("closes when the page changes under it", async ({ page }) => {
    await page.goto("/");
    await openDrawer(page);
    await drawer(page).getByRole("link", { name: "Purchase", exact: true }).click();
    await expect(page).toHaveURL(/\/purchase$/, { timeout: NAVIGATION_TIMEOUT });

    // Back is a change of page that no link in the panel started.
    await openDrawer(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/, { timeout: NAVIGATION_TIMEOUT });
    await expect(drawer(page)).toBeHidden();
  });
});
