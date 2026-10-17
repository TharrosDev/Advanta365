import { expect, test, type Page } from "@playwright/test";
import { signLicence } from "../../lib/licence/token";
import { hydrated, introSeen } from "./helpers";

// The fixture store and secret come from the web server's env in playwright.config.ts.
const SECRET = "test-secret-test-secret-test-secret-0";
const LICENCE = signLicence("A365-261013-ABCDEF", SECRET);
const LOCKED = "sharepoint-migration-impact-assessment";

/**
 * Opens the licence link, the way a buyer does from their order email: the cookie is set. Each call
 * comes from an address of its own, so the claims of a whole run do not add up to the limit of ten a
 * minute that /licence keeps per client.
 */
async function claim(page: Page) {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
  await page.goto(`/licence?t=${LICENCE}`);
  await expect(page).toHaveURL(/\/catalog$/);
}

test.beforeEach(async ({ page }) => {
  await introSeen(page);
});

test("a free sample downloads from its pop-up", async ({ page }) => {
  await page.goto("/catalog?view=executive-sponsor-kickoff-deck");
  await hydrated(page);
  const link = page
    .getByRole("dialog")
    .getByRole("link", { name: /Executive Sponsor Kickoff Deck\.pptx/ });
  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  expect(download.suggestedFilename()).toBe("Executive Sponsor Kickoff Deck.pptx");
});

test("a licence link opens the catalog with every template unlocked", async ({ page }) => {
  await claim(page);
  await expect(page.locator("[data-tile]").first()).toBeVisible();
  await expect(page.locator("[data-locked]")).toHaveCount(0);
  await expect(page.getByText("Your toolkit is unlocked in this browser.")).toBeVisible();
});

test("a buyer opens a locked template's pop-up and downloads its files", async ({ page }) => {
  await claim(page);
  await page.goto(`/catalog?view=${LOCKED}`);
  await hydrated(page);
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(
    "SharePoint Migration Impact Assessment",
  );
  await expect(dialog.getByText("Free sample")).toHaveCount(0);
  await expect(dialog.getByRole("link", { name: /Purchase the toolkit/ })).toHaveCount(0);
  const link = dialog.getByRole("link", { name: /Impact Scoring Workbook\.xlsx/ });
  await expect(link).toHaveAttribute("href", `/api/library/${LOCKED}/workbook`);
  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  expect(download.suggestedFilename()).toBe("Impact Scoring Workbook.xlsx");
});

test("a buyer's tile opens its pop-up from the grid", async ({ page }) => {
  await claim(page);
  await hydrated(page);
  await page.getByRole("link", { name: "SharePoint Migration Impact Assessment" }).click();
  await expect(page).toHaveURL(new RegExp(`view=${LOCKED}`));
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("a buyer's step page has no locked tiles", async ({ page }) => {
  await claim(page);
  await page.goto("/phases/assess-the-impact");
  await expect(page.locator("[data-tile]").first()).toBeVisible();
  await expect(page.locator("[data-locked]")).toHaveCount(0);
});

test("a link that does not work says so on the catalog, and nothing unlocks", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "10.0.0.250" });
  await page.goto("/licence?t=not-a-licence");
  await expect(page).toHaveURL(/\/catalog\?link=invalid$/);
  await expect(page.getByText(/That link did not work\./)).toBeVisible();
  await expect(page.locator("[data-locked]").first()).toBeVisible();
});

test("without a licence a locked template stays locked and its file is not served", async ({
  page,
  request,
}) => {
  await page.goto(`/catalog?view=${LOCKED}`);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await request.get(`/api/library/${LOCKED}/workbook`)).status()).toBe(404);
  expect((await request.get(`/api/samples/${LOCKED}/workbook`)).status()).toBe(404);
});
