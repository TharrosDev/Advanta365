import { expect, test } from "@playwright/test";
import { ENTRY_ATTRIBUTES, INTRO_TEST_TIMEOUT, INTRO_TIMEOUT } from "./helpers";

// The entry overlay plays on a hard load of "/" and nowhere else: not on other routes, and not when
// "/" is reached by following a link. The spec is the same on both projects (desktop and phone).

test("a hard load of the home page plays the intro and then hands over to the page", async ({
  page,
}) => {
  test.setTimeout(INTRO_TEST_TIMEOUT);
  await page.goto("/");

  const html = page.locator("html");
  const overlay = page.locator("[data-entry-overlay]");
  await expect(overlay).toBeVisible();

  // Dock start lifts the overlay (data-entry, data-entry-lock); the header logo takes over a little
  // later (data-entry-brand) and then the overlay leaves the DOM.
  for (const attribute of ENTRY_ATTRIBUTES) {
    await expect(html).not.toHaveAttribute(attribute, { timeout: INTRO_TIMEOUT });
  }
  await expect(overlay).toHaveCount(0, { timeout: INTRO_TIMEOUT });

  // Nothing covers the page any more: a trial click performs every actionability check, including
  // "receives events at the click point", without clicking.
  await page.getByRole("heading", { level: 1 }).click({ trial: true, timeout: 5_000 });

  // The header logo is fully back (it was transparent while the overlay owned the mark).
  await expect(page.locator("[data-site-symbol] svg")).toHaveCSS("opacity", "1");
});

test("other routes load without the intro", async ({ page }) => {
  await page.goto("/catalog");

  await expect(page.locator("html")).not.toHaveAttribute("data-entry");
  await expect(page.locator("[data-entry-overlay]")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catalog");
});

test("following the logo back to the home page does not replay the intro", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catalog");

  // A client-side navigation keeps this document, so a watcher installed now sees every change the
  // entry attributes go through from here on.
  await page.evaluate((attributes) => {
    const seen: string[] = [];
    Object.assign(window, { __entryAttributesSeen: seen });
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.attributeName) seen.push(record.attributeName);
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: [...attributes] });
  }, ENTRY_ATTRIBUTES);

  await page.getByRole("banner").getByRole("link", { name: "Advanta365", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/");

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible({ timeout: 5_000 });
  await heading.click({ trial: true, timeout: 5_000 });

  await expect(page.locator("html")).not.toHaveAttribute("data-entry");
  await expect(page.locator("[data-entry-overlay]")).toHaveCount(0);
  const seen = await page.evaluate(
    () => (window as unknown as { __entryAttributesSeen?: string[] }).__entryAttributesSeen,
  );
  expect(seen).toEqual([]);
});
