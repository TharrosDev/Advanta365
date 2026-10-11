import { expect, test } from "@playwright/test";
import { INTRO_TEST_TIMEOUT, waitForIntroEnd } from "./helpers";

// Every canvas on the site has a flat fallback. Here the browser refuses to create any WebGL
// context, as a machine without WebGL or with a blocked GPU would: the pages must stay complete,
// the intro must still hand over, and nothing may throw.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const refused = new Set(["webgl2", "webgl", "experimental-webgl"]);
    type ContextHost = { prototype: { getContext: unknown } };
    const refuse = (host: ContextHost) => {
      const original = host.prototype.getContext as (this: unknown, ...args: unknown[]) => unknown;
      host.prototype.getContext = function (this: unknown, type: unknown, ...rest: unknown[]) {
        // 2D contexts (the sheen words' text mask) still work.
        if (typeof type === "string" && refused.has(type)) return null;
        return original.call(this, type, ...rest);
      };
    };
    refuse(HTMLCanvasElement as unknown as ContextHost);
    if (typeof OffscreenCanvas !== "undefined") refuse(OffscreenCanvas as unknown as ContextHost);
  });
});

test("the home page falls back to flat graphics and finishes its intro", async ({ page }) => {
  test.setTimeout(INTRO_TEST_TIMEOUT);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");
  // Without WebGL the mark that docks into the header is the flat glyph; the hand-over is the same.
  await waitForIntroEnd(page);

  // The hero shows its flat ribbons instead of the canvas, and the swirl canvas is switched off.
  await expect(page.locator("[data-hero-lines]")).toBeVisible();
  await expect(page.locator("[data-hero-liquid]")).toBeHidden();
  await expect(page.locator("[data-swirl-canvas]")).toBeHidden();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Don’t start your M365 rollout from a blank prompt.",
  );
  expect(pageErrors).toEqual([]);
});

test("inner page titles keep their static gradient", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/catalog");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText("Catalog");

  // Give the sheen engine every chance to start: its chunk, the fonts and a couple of frames.
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });

  const word = page.locator("[data-sheen-word]").first();
  await expect(word).toBeVisible();
  await expect(word).not.toHaveAttribute("data-live");
  // The one text node of the word carries the gradient, clipped to the glyphs.
  await expect(word.locator("span").first()).toHaveCSS("background-image", /linear-gradient/);
  expect(pageErrors).toEqual([]);
});
