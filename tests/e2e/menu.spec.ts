import { expect, test, type Page } from "@playwright/test";
import { introSeen, NAVIGATION_TIMEOUT } from "./helpers";

// Below 68em the bar has a "Menu" button that opens the site menu: a native modal dialog on the
// right edge of the screen. This file covers it on the phone project; header.spec.ts covers the
// inline navigation of the desktop bar.

const PRIMARY = ["Catalog", "Bundles", "Pricing", "About", "Contact"];
const PHASES = ["Make the case", "Plan", "Design", "Prepare", "Communicate", "Execute", "Sustain"];

// A caption the menu used to carry under the contact address. Written in two parts so that this
// file does not contain the sentence it checks for.
const RETIRED_CAPTION = ["For general", "questions"].join(" ");

const toggle = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: "Menu", exact: true });
const drawer = (page: Page) => page.getByRole("dialog", { name: "Site menu" });

/**
 * Opens the menu. The button only works once the bar has hydrated, and the cart link beside it tells
 * when that is: its name gains the count ("Cart, 0 items") at that moment.
 */
async function openDrawer(page: Page) {
  await expect(
    page.getByRole("banner").getByRole("link", { name: /^Cart, \d+ items?$/ }),
  ).toBeVisible();
  await toggle(page).click();
  await expect(drawer(page)).toBeVisible();
}

test.describe("phone menu", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, "the Menu button only shows below 68em");
    // The menu is the subject here, not the cover a first visit to the home page opens under.
    await introSeen(page);
  });

  test("the Menu button opens the site menu with the five links and the seven phases", async ({
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
    await page.goto("/pricing");
    await openDrawer(page);
    const menu = drawer(page).getByRole("navigation", { name: "Menu" });
    await expect(menu.getByRole("link", { name: "Pricing", exact: true })).toHaveAttribute(
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
    await drawer(page).getByRole("link", { name: "Pricing", exact: true }).click();
    await expect(page).toHaveURL(/\/pricing$/, { timeout: NAVIGATION_TIMEOUT });

    // Back is a change of page that no link in the panel started.
    await openDrawer(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/, { timeout: NAVIGATION_TIMEOUT });
    await expect(drawer(page)).toBeHidden();
  });
});
