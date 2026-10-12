import { expect, test, type Locator, type Page } from "@playwright/test";
import { hydrated, introSeen, NAVIGATION_TIMEOUT } from "./helpers";

// From 68em the bar has three zones (the brand, Catalog and Why Advanta centred, and the purchase button)
// and the phase rail stands under it. This file covers both on the desktop project (1280x800);
// menu.spec.ts covers the narrow bar and the drawer on a phone.

const INLINE = ["Catalog", "Why Advanta"];
const BUTTON = "Get the toolkit · $1,499.99 CAD";
const PHASES = ["Make the case", "Plan", "Design", "Prepare", "Communicate", "Execute", "Sustain"];

const banner = (page: Page) => page.getByRole("banner");
const primary = (page: Page) => banner(page).getByRole("navigation", { name: "Primary" });
const buy = (page: Page) => banner(page).getByRole("link", { name: BUTTON, exact: true });
const underline = (page: Page) => banner(page).locator("[data-nav-underline]");
// Exact, so that no other navigation named after the phases is taken for the rail.
const rail = (page: Page) => page.getByRole("navigation", { name: "Phases", exact: true });

/** The horizontal centre of an element's box. */
async function centre(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("no box");
  return box.x + box.width / 2;
}

test.describe("desktop bar", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile, "the inline navigation and the rail only show from 68em");
    // The bar is the subject here, not the cover a first visit to the home page opens under.
    await introSeen(page);
  });

  test("shows Catalog and Why Advanta inline, the purchase button, and no Menu button", async ({
    page,
  }) => {
    await page.goto("/");

    // Purchase is the button at the right, not a third link in the row.
    await expect(primary(page).getByRole("link")).toHaveCount(INLINE.length);
    for (const name of INLINE) {
      await expect(primary(page).getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(primary(page).getByRole("link", { name: /Purchase/ })).toHaveCount(0);
    await expect(buy(page)).toBeVisible();
    await expect(buy(page)).toHaveAttribute("href", "/purchase");
    await expect(banner(page).getByRole("link", { name: "Advanta365", exact: true })).toBeVisible();
    await expect(banner(page).getByRole("link", { name: /^Cart/ })).toHaveCount(0);
    await expect(banner(page).getByRole("button", { name: "Menu", exact: true })).toBeHidden();
    await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
  });

  test("the bar's links are in order: the brand, Catalog, Why Advanta, then the purchase button", async ({
    page,
  }) => {
    await page.goto("/");
    const hrefs = await banner(page)
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs).toEqual(["/", "/catalog", "/why-advanta", "/purchase"]);
  });

  test("marks the current page in the row, and the button on the purchase page", async ({
    page,
  }) => {
    await page.goto("/catalog");
    await expect(primary(page).getByRole("link", { name: "Catalog", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(primary(page).locator("[aria-current]")).toHaveCount(1);
    await expect(buy(page)).not.toHaveAttribute("aria-current");

    await page.goto("/why-advanta");
    await expect(
      primary(page).getByRole("link", { name: "Why Advanta", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(primary(page).locator("[aria-current]")).toHaveCount(1);

    // The purchase page: nothing in the row is current, and the button is, still in its place.
    await page.goto("/purchase");
    await expect(primary(page).locator("[aria-current]")).toHaveCount(0);
    await expect(buy(page)).toHaveAttribute("aria-current", "page");
    // The drawer, closed, still holds its own current link; only what is on screen counts.
    await expect(banner(page).locator("[aria-current]").filter({ visible: true })).toHaveCount(1);

    await page.goto("/");
    await expect(banner(page).locator("[aria-current]").filter({ visible: true })).toHaveCount(0);
  });

  test("the row is centred on the bar, at 1280px and at 1440px", async ({ page }) => {
    for (const width of [1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const bar = await centre(banner(page));
      expect(Math.abs((await centre(primary(page))) - bar), `${width}px`).toBeLessThanOrEqual(2);

      // The brand stands to the left of it and the button to the right.
      expect(await centre(banner(page).getByRole("link", { name: "Advanta365" }))).toBeLessThan(
        bar,
      );
      expect(await centre(buy(page))).toBeGreaterThan(bar);
    }
  });

  test("the button reads with its price from 68em, and without it just under", async ({ page }) => {
    await page.setViewportSize({ width: 1088, height: 800 });
    await page.goto("/");
    await expect(buy(page)).toBeVisible();
    await expect(primary(page)).toBeVisible();

    await page.setViewportSize({ width: 1087, height: 800 });
    // One button, one name: the price is gone from the name as well as from the eye.
    const short = banner(page).getByRole("link", { name: "Get the toolkit", exact: true });
    await expect(short).toBeVisible();
    await expect(buy(page)).toHaveCount(0);
    await expect(primary(page)).toBeHidden();
    await expect(banner(page).getByRole("button", { name: "Menu", exact: true })).toBeVisible();
  });

  test("one underline sits under the current link and is hidden when there is none", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(underline(page)).toHaveCount(1);
    await expect(underline(page)).toBeHidden();

    await page.goto("/catalog");
    const catalog = primary(page).getByRole("link", { name: "Catalog", exact: true });
    await expect(underline(page)).toBeVisible();
    await expect(underline(page)).toHaveAttribute("aria-hidden", "true");
    expect(Math.abs((await centre(underline(page))) - (await centre(catalog)))).toBeLessThan(1);

    // A click on the other link moves it: it ends under the link of the page that opened.
    await hydrated(page);
    const about = primary(page).getByRole("link", { name: "Why Advanta", exact: true });
    await about.click();
    await expect(page).toHaveURL(/\/why-advanta$/, { timeout: NAVIGATION_TIMEOUT });
    await expect
      .poll(async () => Math.abs((await centre(underline(page))) - (await centre(about))))
      .toBeLessThan(1);

    // The purchase page has no current link in the row, so no underline.
    await page.goto("/purchase");
    await expect(underline(page)).toBeHidden();
  });

  test("the underline slides only when movement is wanted", async ({ page }) => {
    await page.goto("/catalog");
    await expect(underline(page)).toHaveCSS("transition-property", "translate");

    await page.emulateMedia({ reducedMotion: "reduce" });
    // The reduced-motion safety net of globals.css leaves a transition of one hundredth of a
    // millisecond: nothing a person can see.
    await expect
      .poll(() =>
        underline(page).evaluate((el) =>
          Number.parseFloat(getComputedStyle(el).transitionDuration),
        ),
      )
      .toBeLessThan(0.001);
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

  test("the rail marks a phase page, and no phase while a template is open in the catalog", async ({
    page,
  }) => {
    await page.goto("/phases/prepare");
    await expect(rail(page).getByRole("link", { name: "Prepare", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(rail(page).locator("[aria-current]")).toHaveCount(1);

    await page.goto("/catalog?view=executive-sponsor-kickoff-deck");
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    await expect(rail(page).locator("[aria-current]")).toHaveCount(0);
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

  test("the brand takes the home page back to its top, with no new history entry", async ({
    page,
  }) => {
    await page.goto("/");
    await hydrated(page);
    const brand = banner(page).getByRole("link", { name: "Advanta365", exact: true });
    await expect(brand).toHaveAttribute("href", "/");

    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(600);
    const entries = await page.evaluate(() => window.history.length);

    await brand.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page).toHaveURL(/\/$/);
    expect(await page.evaluate(() => window.history.length)).toBe(entries);
  });

  test("the brand scrolls to the top at once when movement is reduced, and keeps a query", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?from=brand");
    await hydrated(page);

    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(600);

    await banner(page).getByRole("link", { name: "Advanta365", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page).toHaveURL(/\/\?from=brand$/);
  });

  test("the brand is still a link home from another page", async ({ page }) => {
    await page.goto("/catalog");
    await hydrated(page);

    await banner(page).getByRole("link", { name: "Advanta365", exact: true }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: NAVIGATION_TIMEOUT });
  });
});
