import { expect, test } from "@playwright/test";
import { INTRO_TEST_TIMEOUT, waitForIntroEnd } from "./helpers";

// A page that logs an error is a page with a bug, even when it looks fine: hydration mismatches,
// failed chunks (workers, shaders, renderers), 404s for assets and uncaught exceptions all land here.

const ROUTES = [
  "/",
  "/catalog",
  "/phases/prepare",
  "/templates/executive-sponsor-kickoff-deck",
  "/bundles",
  "/bundles/sponsor-essentials",
  "/pricing",
  "/about",
  "/sample",
  "/contact",
  "/cart",
];

for (const path of ROUTES) {
  test(`${path} logs no console errors`, async ({ page }) => {
    if (path === "/") test.setTimeout(INTRO_TEST_TIMEOUT);

    const problems: string[] = [];
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const { url } = message.location();
      problems.push(`console.error: ${message.text()}${url ? ` (${url})` : ""}`);
    });
    page.on("pageerror", (error) => {
      problems.push(`pageerror: ${error.message}`);
    });

    await page.goto(path);
    // The intro runs the three canvases and the hand-over to the header; errors from any of it count.
    if (path === "/") await waitForIntroEnd(page);
    await page.waitForLoadState("networkidle");

    expect(problems).toEqual([]);
  });
}
