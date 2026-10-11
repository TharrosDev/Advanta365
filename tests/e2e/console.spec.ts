import { expect, test } from "@playwright/test";

// A page that logs an error is a page with a bug, even when it looks fine: hydration mismatches,
// failed chunks, 404s for assets and uncaught exceptions all land here.

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
    await page.waitForLoadState("networkidle");

    expect(problems).toEqual([]);
  });
}
