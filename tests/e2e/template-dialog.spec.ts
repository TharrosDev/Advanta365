import { expect, test, type Page } from "@playwright/test";
import { hydrated, introSeen, NAVIGATION_TIMEOUT } from "./helpers";

// A free sample opens in a pop-up over the catalog: a native modal dialog whose being open is the
// `view` parameter of the address. A free tile is a link to that address, so the pop-up opens by a
// navigation that leaves the grid where it is; Escape, Close and a click on the dimmed page close
// it by taking `view` out again, and so does Back. `view` naming a locked template, or nothing the
// catalog holds, opens nothing.

const FREE = { slug: "change-management-strategy", title: "Change Management Strategy" };
const LOCKED_SLUG = "sharepoint-migration-impact-assessment";

const dialog = (page: Page) => page.locator("dialog[data-template-dialog]");
const tileLink = (page: Page, title = FREE.title) =>
  page.locator("[data-tile][data-free]").getByRole("link", { name: title, exact: true });

async function openCatalog(page: Page, address = "/catalog") {
  const response = await page.goto(address);
  await hydrated(page);
  return response;
}

/** Opens the pop-up of the free sample from its tile, and waits for it to be the modal dialog. */
async function openFromTile(page: Page) {
  await tileLink(page).click();
  await expect(page).toHaveURL(new RegExp(`[?&]view=${FREE.slug}$`), {
    timeout: NAVIGATION_TIMEOUT,
  });
  await expect(dialog(page)).toBeVisible();
  await expect.poll(() => dialog(page).evaluate((element) => element.matches(":modal"))).toBe(true);
}

const params = (page: Page) => new URL(page.url()).searchParams;

test("a free tile opens the pop-up over the grid, and the address names the template", async ({
  page,
}) => {
  await openCatalog(page);
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });

  // The grid must not jump: the tile is brought to the middle of the window first (so the click
  // has no scrolling of its own to do), and the page stays where that left it.
  await tileLink(page).evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(0);

  await openFromTile(page);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
  expect(params(page).get("view")).toBe(FREE.slug);

  // It is a dialog named by the template's title, and the title is not a second h1.
  const named = page.getByRole("dialog", { name: FREE.title });
  await expect(named).toBeVisible();
  await expect(named.getByRole("heading", { level: 2, name: FREE.title })).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("Catalog");

  // Focus is inside it.
  expect(await dialog(page).evaluate((element) => element.contains(document.activeElement))).toBe(
    true,
  );
});

test("the pop-up shows the template: cover, summary, facts, what is included and the way to buy", async ({
  page,
}) => {
  await openCatalog(page, `/catalog?view=${FREE.slug}`);
  const popup = dialog(page);
  await expect(popup).toBeVisible();

  await expect(popup.locator("[data-cover]")).toHaveCount(1);
  await expect(popup.getByText("Free sample", { exact: true })).toBeVisible();
  for (const label of ["Phase", "Step", "Type", "Format", "Length"]) {
    await expect(popup.locator("dt", { hasText: new RegExp(`^${label}$`) })).toHaveCount(1);
  }
  await expect(popup.locator("dd").first()).toHaveText("Plan");
  await expect(popup.getByRole("heading", { level: 3, name: "What’s included" })).toBeVisible();
  expect(await popup.getByRole("listitem").count()).toBeGreaterThan(0);

  const buy = popup.getByRole("link", { name: /Purchase/ });
  await expect(buy).toHaveCount(1);
  await expect(buy).toHaveAttribute("href", "/purchase");
  expect(await popup.innerText()).not.toContain("$");
});

test("Escape closes it, takes view out of the address, keeps the search and the filters, and hands focus back to the tile", async ({
  page,
}) => {
  await openCatalog(page, "/catalog?q=strategy&phase=plan");
  await openFromTile(page);
  expect(params(page).get("q")).toBe("strategy");
  expect(params(page).get("phase")).toBe("plan");

  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  await expect(page).not.toHaveURL(/view=/);
  expect(params(page).get("q")).toBe("strategy");
  expect(params(page).get("phase")).toBe("plan");
  await expect(tileLink(page)).toBeFocused();
});

test("its Close control closes it the same way", async ({ page }) => {
  await openCatalog(page, "/catalog?q=strategy&phase=plan");
  await openFromTile(page);

  await dialog(page).getByRole("link", { name: "Close", exact: true }).click();
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  await expect(page).not.toHaveURL(/view=/);
  expect(params(page).get("q")).toBe("strategy");
  expect(params(page).get("phase")).toBe("plan");
  await expect(tileLink(page)).toBeFocused();
});

test("a click on the dimmed page closes it, and a click inside it does not", async ({ page }) => {
  await openCatalog(page, "/catalog?q=strategy&phase=plan");
  await openFromTile(page);

  await dialog(page).getByRole("heading", { level: 2 }).click();
  await expect(dialog(page)).toBeVisible();
  await expect(page).toHaveURL(/view=/);

  // The panel never reaches the corner of the window.
  await page.mouse.click(3, 3);
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  await expect(page).not.toHaveURL(/view=/);
  expect(params(page).get("q")).toBe("strategy");
  expect(params(page).get("phase")).toBe("plan");
});

test("Back closes it and focus returns to the tile", async ({ page }) => {
  await openCatalog(page);
  await openFromTile(page);

  await page.goBack();
  await expect(page).toHaveURL(/\/catalog$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  await expect(tileLink(page)).toBeFocused();

  // Forward opens it again, as the address says.
  await page.goForward();
  await expect(page).toHaveURL(/view=/, { timeout: NAVIGATION_TIMEOUT });
  await expect(dialog(page)).toBeVisible();
});

test("closing leaves a catalog that still works: another sample opens after it", async ({
  page,
}) => {
  await openCatalog(page);
  await openFromTile(page);
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });

  await tileLink(page, "Master Communications Plan").click();
  await expect(page).toHaveURL(/view=master-communications-plan$/, {
    timeout: NAVIGATION_TIMEOUT,
  });
  await expect(page.getByRole("dialog", { name: "Master Communications Plan" })).toBeVisible();
});

for (const view of [LOCKED_SLUG, "nope", "../x", "", "Change-Management-Strategy"]) {
  test(`view=${view || "(empty)"} opens nothing and the page answers 200`, async ({ page }) => {
    const response = await openCatalog(page, `/catalog?view=${encodeURIComponent(view)}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catalog");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
    await expect(page.locator("#results-heading")).toHaveText("67 templates");
  });
}

test("a link to a free sample opens it on load, even when the filters leave its tile out", async ({
  page,
}) => {
  const response = await openCatalog(page, `/catalog?view=${FREE.slug}&phase=sustain`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("dialog", { name: FREE.title })).toBeVisible();
  await expect.poll(() => dialog(page).evaluate((element) => element.matches(":modal"))).toBe(true);
  await expect(tileLink(page)).toHaveCount(0);

  // Closing keeps the filter.
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  await expect(page).toHaveURL(/\/catalog\?phase=sustain$/);
});

test("the six samples on the home page and the free tile of a phase page open the pop-up in the catalog", async ({
  page,
}) => {
  await introSeen(page);
  await page.goto("/");
  await hydrated(page);
  const samples = page.locator("#featured");
  await expect(samples.getByRole("heading", { level: 2 })).toContainText(/free sample/i);
  await expect(samples.locator("[data-tile][data-free]")).toHaveCount(6);
  await expect(samples.locator("[data-tile][data-locked]")).toHaveCount(0);

  await samples.getByRole("link", { name: FREE.title, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/catalog\\?view=${FREE.slug}$`), {
    timeout: NAVIGATION_TIMEOUT,
  });
  await expect(page.getByRole("dialog", { name: FREE.title })).toBeVisible();

  await page.goto("/phases/plan");
  await hydrated(page);
  const main = page.getByRole("main");
  await expect(main.locator("[data-tile][data-free]")).toHaveCount(1);
  expect(await main.locator("[data-tile][data-locked]").count()).toBeGreaterThan(0);
  await main.getByRole("link", { name: FREE.title, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/catalog\\?view=${FREE.slug}$`), {
    timeout: NAVIGATION_TIMEOUT,
  });
  await expect(page.getByRole("dialog", { name: FREE.title })).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a free tile's link shows the same content open on the page, with a link that closes it", async ({
    page,
  }) => {
    await page.goto("/catalog?q=strategy&phase=plan");
    await tileLink(page).click();
    await expect(page).toHaveURL(new RegExp(`view=${FREE.slug}$`));

    const popup = dialog(page);
    await expect(popup).toHaveAttribute("open", "");
    await expect(popup.getByRole("heading", { level: 2, name: FREE.title })).toBeVisible();
    await expect(popup.getByRole("link", { name: /Purchase/ })).toBeVisible();

    await popup.getByRole("link", { name: "Close", exact: true }).click();
    await expect(page).toHaveURL(/\/catalog\?q=strategy&phase=plan$/);
    await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  });
});

test("of a repeated view the first value is the one that counts", async ({ page }) => {
  // The sample first: it opens, whatever follows it.
  const first = await openCatalog(page, `/catalog?view=${FREE.slug}&view=junk`);
  expect(first?.status()).toBe(200);
  await expect(page.getByRole("dialog", { name: FREE.title })).toBeVisible();
  await expect(page.locator("dialog[open]")).toHaveCount(1);

  // Junk first: nothing opens, though a sample is named after it.
  const second = await openCatalog(page, `/catalog?view=junk&view=${FREE.slug}`);
  expect(second?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catalog");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.locator("[data-denied]")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("67 templates");
});

test("a sample opens over a page of results that does not hold it, and closing keeps the page", async ({
  page,
}) => {
  const response = await openCatalog(page, `/catalog?view=${FREE.slug}&page=3&sort=title`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("dialog", { name: FREE.title })).toBeVisible();
  await expect.poll(() => dialog(page).evaluate((element) => element.matches(":modal"))).toBe(true);

  // The third page is the last one: nineteen tiles, and the sample is not among them.
  await expect(page.locator("[data-tile]")).toHaveCount(19);
  await expect(tileLink(page)).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  expect(params(page).has("view")).toBe(false);
  expect(params(page).get("page")).toBe("3");
  expect(params(page).get("sort")).toBe("title");
  await expect(page.locator("[data-tile]")).toHaveCount(19);

  // A page past the end is not kept as it was written: it closes to the last page there is.
  await openCatalog(page, `/catalog?view=${FREE.slug}&page=99`);
  await expect(page.getByRole("dialog", { name: FREE.title })).toBeVisible();
  await dialog(page).getByRole("link", { name: "Close", exact: true }).click();
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  expect(params(page).has("view")).toBe(false);
  expect(params(page).get("page")).toBe("3");
});
