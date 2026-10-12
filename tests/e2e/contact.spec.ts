import { expect, test } from "@playwright/test";
import { SITE } from "../../lib/site";
import { hydrated, introSeen, NAVIGATION_TIMEOUT } from "./helpers";

// The Contact page is one section and the footer: its title, the one address of the site as a
// link that starts an email, and what to write about. It has no form and sends nothing itself.
// The page that was About is Why Advanta now, and its old address leads there.

const ADDRESS = `mailto:${SITE.contactEmail}`;
const TOPICS = [
  "A question before you buy",
  "Purchase orders and invoices",
  "Licence questions",
  "Accessibility feedback",
];

test("the page is one section with one title, between the bar and the footer", async ({ page }) => {
  const response = await page.goto("/contact");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Contact/);

  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact");

  // One section, one band, and it stands directly inside the main landmark.
  const main = page.getByRole("main");
  await expect(main.locator("section")).toHaveCount(1);
  await expect(main.locator("[data-band]")).toHaveCount(1);
  await expect(main.locator(":scope > section")).toHaveAttribute("data-band", "paper");
  // The section is named by the title it holds.
  await expect(main.getByRole("region", { name: "Contact", exact: true })).toHaveCount(1);
});

test("the address is one link that starts an email, and it is the size of a target", async ({
  page,
}) => {
  await page.goto("/contact");
  const main = page.getByRole("main");

  const address = main.locator(`a[href="${ADDRESS}"]`);
  await expect(address).toHaveCount(1);
  await expect(address).toBeVisible();
  await expect(address).toHaveText(SITE.contactEmail);
  const box = await address.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);

  // No form, no field and no button: the page sends nothing itself.
  await expect(main.locator("form, input, textarea, select, button")).toHaveCount(0);
});

test("what to write about is a list of four links, each the address with a subject", async ({
  page,
}) => {
  await page.goto("/contact");
  const main = page.getByRole("main");

  await expect(main.getByRole("heading", { level: 2 })).toHaveText("What to write about");
  const list = main.getByRole("list", { name: "What to write about" });
  await expect(list.getByRole("listitem")).toHaveCount(TOPICS.length);

  const links = list.getByRole("link");
  await expect(links).toHaveCount(TOPICS.length);
  for (const [index, topic] of TOPICS.entries()) {
    const link = links.nth(index);
    await expect(link).toContainText(topic);
    const href = (await link.getAttribute("href")) ?? "";
    const [to, query = ""] = href.split("?");
    expect(to, topic).toBe(ADDRESS);
    expect(new URLSearchParams(query).get("subject")?.trim(), topic).toBeTruthy();
    expect([...new URLSearchParams(query).keys()], topic).toEqual(["subject"]);
    const box = await link.boundingBox();
    expect(box?.height, topic).toBeGreaterThanOrEqual(44);
  }

  // Every link of the section goes to the one address.
  const hrefs = await main
    .locator("a[href]")
    .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href") ?? ""));
  expect(hrefs).toHaveLength(TOPICS.length + 1);
  for (const href of hrefs) expect(href.startsWith(ADDRESS)).toBe(true);
});

test("the page fits a 320px phone and a large monitor", async ({ page, isMobile }) => {
  test.skip(isMobile, "the sizes are set here, the desktop project runs them");
  for (const [width, height] of [
    [320, 640],
    [1920, 1080],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/contact");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${width}`).toBeLessThanOrEqual(0);

    // The address is whole inside the window at both.
    const box = await page.getByRole("main").locator(`a[href="${ADDRESS}"]`).boundingBox();
    if (!box) throw new Error("the address is not on the page");
    expect(box.x, `${width}`).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, `${width}`).toBeLessThanOrEqual(width);
  }
});

test("the footer links to the page", async ({ page }) => {
  await introSeen(page);
  await page.goto("/");
  await hydrated(page);
  await page.getByRole("contentinfo").getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact");
});

test("/about leads to Why Advanta, which no longer holds the contact section", async ({
  page,
  request,
}) => {
  const moved = await request.get("/about", { maxRedirects: 0 });
  expect(moved.status()).toBe(308);
  expect(moved.headers().location).toBe("/why-advanta");

  const response = await page.goto("/about");
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe("/why-advanta");
  await expect(page).toHaveTitle(/Why Advanta/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Change content that has met real users.",
  );
  await expect(page.locator("#contact")).toHaveCount(0);
  await expect(page.getByRole("main").locator('a[href^="mailto:"]')).toHaveCount(0);
});
