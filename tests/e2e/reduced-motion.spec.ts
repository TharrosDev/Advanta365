import { expect, test } from "@playwright/test";
import { canvases } from "./support/ink";

// With prefers-reduced-motion nothing on the site moves by itself and nothing waits to be shown: a
// first visit opens on the page and not under the cover, the ink is its still, every entrance is
// drawn in its final state, and navigation and the filters work as they always do. Every test here
// is the first load of its session, the one load that would have the cover.

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

const ROUTES = [
  "/",
  "/catalog",
  "/phases/prepare",
  "/templates/executive-sponsor-kickoff-deck",
  "/purchase",
  "/about",
  "/sample",
  "/nope",
];

for (const path of ROUTES) {
  test(`${path} is drawn in its final state, with nothing in motion`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The root element is never marked for motion, the cover or live ink. (A page the server
    // answered with a 404 is built in the browser, and its boot script runs a moment after the
    // load event.)
    await expect(page.locator("html")).toHaveAttribute("data-ink", "still");
    await expect(page.locator("html")).not.toHaveAttribute("data-motion");
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    await expect(page.locator("html")).not.toHaveAttribute("data-timeline");

    // No canvas, no button for the ink, and no animation of any kind.
    expect((await canvases(page)).count).toBe(0);
    await expect(page.locator("[data-ink-toggle]")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);

    // Nothing waits to be shown: every entrance stands in its final state.
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll("[data-move]")]
        .map((element) => ({ element, style: getComputedStyle(element) }))
        .filter(({ style }) => style.opacity !== "1" || style.filter !== "none")
        .map(({ element }) => `${element.localName}.${element.getAttribute("class") ?? ""}`),
    );
    expect(hidden).toEqual([]);
  });
}

test("the home page shows the hero's still, the odometer at 90 and a full tally", async ({
  page,
}) => {
  await page.goto("/");

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText("Don’t start your M365 rollout from a blank prompt.");

  // The picture that stands in for the ink is loaded and is decoration.
  const still = page.locator('[data-ink-backdrop][data-scene="hero"] img');
  await expect(still).toHaveAttribute("alt", "");
  await expect
    .poll(() => still.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await expect(still).toBeVisible();

  // The cover is in the page and not displayed.
  const cover = page.locator("[data-intro-cover]");
  await expect(cover).toHaveCount(1);
  await expect(cover).toHaveCSS("display", "none");

  // The odometer reads 90: its figure, and the wheel standing at the ninth place.
  const odometer = page.locator("#solution [data-odometer]");
  await expect(odometer).toHaveAttribute("data-value", "90");
  const wheel = await odometer.evaluate((element) => {
    const wheel = element.querySelector("[data-odometer-wheel]");
    if (!wheel) return null;
    const glyph = wheel.firstElementChild?.getBoundingClientRect().height ?? 0;
    const shift = getComputedStyle(wheel).translate.split(" ")[1] ?? "0px";
    return { glyph, shift: Number.parseFloat(shift) };
  });
  expect(wheel).not.toBeNull();
  expect(Math.round(-(wheel?.shift ?? 0) / (wheel?.glyph || 1))).toBe(9);

  // The tally stands full: nine inked blocks and the marked one.
  const fills = await page
    .locator("#solution [data-tally] [data-block]")
    .evaluateAll((blocks) => blocks.map((block) => getComputedStyle(block).backgroundColor));
  expect(fills).toHaveLength(10);
  for (const fill of fills) expect(fill).not.toBe("rgba(0, 0, 0, 0)");
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
