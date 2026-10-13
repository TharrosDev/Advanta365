import { expect, test } from "@playwright/test";

// A page that logs an error is a page with a bug, even when it looks fine: hydration mismatches,
// failed chunks, 404s for assets and uncaught exceptions all land here.
//
// Every test is the first load of its session, so the home page is checked the way a first visit
// gets it: under the cover, with the inline script at work and its attribute on the root element.

const ROUTES = [
  "/",
  "/catalog",
  "/phases/prepare",
  "/catalog?view=executive-sponsor-kickoff-deck",
  "/purchase",
  "/why-advanta",
  "/contact",
  "/privacy",
  "/terms",
  "/refunds",
  "/accessibility",
  "/sample",
  "/library",
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
