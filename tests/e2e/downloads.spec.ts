import { expect, test } from "@playwright/test";
import { signLicence } from "../../lib/licence/token";
import { hydrated, introSeen } from "./helpers";

// The fixture store and secret come from the web server's env in playwright.config.ts.
const SECRET = "test-secret-test-secret-test-secret-0";
const LICENCE = signLicence("A365-261013-ABCDEF", SECRET);
const LOCKED = "/api/library/sharepoint-migration-impact-assessment/workbook";

test.beforeEach(async ({ page }) => {
  await introSeen(page);
});

test("a free sample downloads from its pop-up", async ({ page }) => {
  await page.goto("/catalog?view=executive-sponsor-kickoff-deck");
  await hydrated(page);
  const dialog = page.getByRole("dialog");
  const link = dialog.getByRole("link", { name: /Executive Sponsor Kickoff Deck\.pptx/ });
  await expect(link).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  expect(download.suggestedFilename()).toBe("Executive Sponsor Kickoff Deck.pptx");
});

test("a licence link opens the library, and its files download", async ({ page }) => {
  await page.goto(`/licence?t=${LICENCE}`);
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your toolkit");
  await hydrated(page);
  const link = page.getByRole("link", { name: /Impact Scoring Workbook\.xlsx/ });
  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  expect(download.suggestedFilename()).toBe("Impact Scoring Workbook.xlsx");
});

test("the open library fits a 320px phone, long file names and all", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(`/licence?t=${LICENCE}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your toolkit");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the library without a licence says how to get one", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your toolkit");
  await expect(page.getByText(/Open the link from your order email/)).toBeVisible();
  await expect(page.getByRole("link", { name: /hello@advanta365\.com/ }).first()).toBeVisible();
  await expect(page.locator('a[href^="/api/library/"]')).toHaveCount(0);
  await expect(page.getByText("That link did not work.")).toHaveCount(0);
});

test("a link that does not work says so", async ({ page }) => {
  await page.goto("/licence?t=not-a-licence");
  await expect(page).toHaveURL(/\/library\?link=invalid$/);
  await expect(page.getByText("That link did not work.")).toBeVisible();
  await expect(page.locator('a[href^="/api/library/"]')).toHaveCount(0);
});

test("a locked file is not served without a licence", async ({ request }) => {
  expect((await request.get(LOCKED)).status()).toBe(404);
  expect(
    (await request.get("/api/samples/sharepoint-migration-impact-assessment/workbook")).status(),
  ).toBe(404);
});
