import { expect, test, type Page } from "@playwright/test";
import { introSeen } from "./helpers";
import { canvases, collectProblems, inkMode, scrollToEnd } from "./support/ink";

// Everything that stands in for the live ink. Without WebGL2, on a software renderer, under raised
// contrast and without JavaScript the page has no canvas and shows the stills; under raised
// contrast it shows no ink at all. In each of them the console stays clean: a still that is
// missing, a chunk that fails or a context that cannot be made is an error, not a fallback.
//
// The default projects render in software, so the last scenario is the one every visitor without a
// graphics card gets. Firefox may well have WebGL2 in headless mode, which makes the live ink the
// right thing there: that scenario is for Chromium.

const ROUTES = ["/", "/about", "/catalog"];

const HERO = '[data-ink-backdrop][data-scene="hero"]';
const FOOTER = '[data-ink-backdrop][data-scene="wisps"]';

test.beforeEach(async ({ page }) => {
  await introSeen(page);
});

/** A still is shown, and the picture in it has loaded. */
async function expectStill(page: Page, backdrop: string) {
  const picture = page.locator(`${backdrop} [data-ink-still]`);
  // The picture element itself has no box (its image stands out of the flow); it is displayed.
  await expect(picture).not.toHaveCSS("display", "none");
  const image = picture.locator("img");
  await expect(image).toHaveAttribute("alt", "");
  // The image is loaded lazily: bring it into view and wait for it.
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0);
  await expect(image).toBeVisible();
}

/** What every scenario asks of a page, whatever the reason there is no live ink. */
async function expectNoCanvas(page: Page, path: string) {
  expect((await canvases(page)).count, path).toBe(0);
  await expect(page.locator("[data-ink-toggle]")).toHaveCount(0);
}

async function expectStills(page: Page, path: string) {
  await expectNoCanvas(page, path);
  if (path === "/") await expectStill(page, HERO);
  // The footer's wisps are on every page.
  await scrollToEnd(page);
  await expectStill(page, FOOTER);
}

test.describe("without WebGL2", () => {
  test.beforeEach(async ({ page }) => {
    // The constructor is gone, and so is every way to ask a canvas for the context.
    await page.addInitScript(() => {
      Reflect.deleteProperty(window, "WebGL2RenderingContext");
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        kind: string,
        ...rest: unknown[]
      ) {
        if (kind === "webgl2") return null;
        return Reflect.apply(original, this, [kind, ...rest]);
      } as typeof original;
    });
  });

  for (const path of ROUTES) {
    test(`${path} shows its stills and no canvas`, async ({ page }) => {
      const problems = collectProblems(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect.poll(() => inkMode(page)).toBe("still");
      await expectStills(page, path);
      expect(problems).toEqual([]);
    });
  }
});

test.describe("on a software renderer", () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "chromium", "Firefox may have WebGL2 here, and then the ink is live");
  });

  for (const path of ROUTES) {
    test(`${path} shows its stills and no canvas`, async ({ page }) => {
      const problems = collectProblems(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // The boot script saw a software renderer and settled on stills for the session.
      await expect.poll(() => inkMode(page)).toBe("still");
      await expectStills(page, path);
      expect(problems).toEqual([]);
    });
  }
});

test.describe("with raised contrast", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ contrast: "more" });
  });

  for (const path of ROUTES) {
    test(`${path} shows no ink at all`, async ({ page }) => {
      const problems = collectProblems(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect.poll(() => inkMode(page)).toBe("still");
      await expectNoCanvas(page, path);
      // The backdrops are not displayed, so neither is the picture in them.
      for (const backdrop of await page.locator("[data-ink-backdrop]").all()) {
        await expect(backdrop).toBeHidden();
        await expect(backdrop.locator("[data-ink-still]")).toBeHidden();
      }
      // Objects get their border back and the page keeps its landmarks.
      const sheets = page.locator("[data-paper]");
      expect(await sheets.count()).toBeGreaterThan(0);
      for (const sheet of await sheets.all()) {
        await expect(sheet).toHaveCSS("border-top-style", "solid");
        await expect(sheet).toHaveCSS("border-top-width", "1px");
        await expect(sheet).toHaveCSS("box-shadow", "none");
      }
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      expect(problems).toEqual([]);
    });
  }
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const path of ROUTES) {
    test(`${path} shows its stills, its entrances and no cover`, async ({ page }) => {
      const problems = collectProblems(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      // Nothing set the root element up: no motion, no ink mode, no cover.
      await expect(page.locator("html")).not.toHaveAttribute("data-ink");
      await expect(page.locator("html")).not.toHaveAttribute("data-motion");
      await expect(page.locator("html")).not.toHaveAttribute("data-intro");
      await expectStills(page, path);
      await expect(page.locator("[data-intro-cover]")).toBeHidden();

      // Nothing waits for a script to be shown.
      const hidden = await page.evaluate(() =>
        [...document.querySelectorAll("[data-move]")]
          .map((element) => ({ element, style: getComputedStyle(element) }))
          .filter(({ style }) => style.opacity !== "1" || style.filter !== "none")
          .map(({ element }) => `${element.localName}.${element.getAttribute("class") ?? ""}`),
      );
      expect(hidden).toEqual([]);
      expect(problems).toEqual([]);
    });
  }
});
