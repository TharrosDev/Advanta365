import { expect, test } from "@playwright/test";
import { CONTACT_LINK, LEGAL_LINKS, SITE } from "../../lib/site";
import { hydrated, introSeen, NAVIGATION_TIMEOUT } from "./helpers";

// The four pages a site that sells owes its visitors: the privacy policy, the terms and licence,
// the refund policy and the accessibility statement. They share one layout (components/legal), so
// every check here runs on all four: the page answers, has its one title and its date, a table of
// contents that leads to the sections that are there, and the ways on to the other three and to
// the contact page. The words themselves are checked in tests/unit/legal.test.ts.

const TITLES: Record<(typeof LEGAL_LINKS)[number]["href"], string> = {
  "/privacy": "Privacy policy",
  "/terms": "Terms of use and licence",
  "/refunds": "Refund policy",
  "/accessibility": "Accessibility statement",
};

test.beforeEach(async ({ page }) => {
  await introSeen(page);
});

for (const { href, label } of LEGAL_LINKS) {
  test(`${href} answers with its one title, its date and its summary`, async ({ page }) => {
    const response = await page.goto(href);
    expect(response?.status()).toBe(200);

    const title = page.getByRole("heading", { level: 1 });
    await expect(title).toHaveCount(1);
    await expect(title).toHaveText(TITLES[href]);
    await expect(page).toHaveTitle(`${TITLES[href]} · ${SITE.name}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S{3}/);

    // The date the page last changed: a machine-readable day, printed in words.
    const date = page.getByRole("main").locator("time");
    await expect(date).toHaveCount(1);
    await expect(date).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
    await expect(date).toHaveText(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
    await expect(page.getByRole("main").getByText("Last updated", { exact: true })).toBeVisible();

    // The page in a few points, before the first section.
    await expect(page.getByRole("main").getByText("In short", { exact: true })).toBeVisible();

    // Nothing on the page is a stand-in for words still to be written.
    const text = await page.getByRole("main").innerText();
    expect(text).not.toMatch(/\b(TODO|TBD|lorem|undefined)\b/i);
  });

  test(`${href} has a table of contents that matches its sections`, async ({ page }) => {
    await page.goto(href);

    const contents = page.getByRole("navigation", { name: "On this page" });
    await expect(contents).toHaveCount(1);

    const sections = page.locator("main [data-legal-section]");
    const ids = await sections.evaluateAll((found) => found.map((section) => section.id));
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(new Set(ids).size).toBe(ids.length);

    // One entry per section, in order, each an anchor to it.
    const targets = await contents
      .getByRole("link")
      .evaluateAll((found) => found.map((anchor) => anchor.getAttribute("href")));
    expect(targets).toEqual(ids.map((id) => `#${id}`));

    // Each entry is named by its number and the heading of its section, and each section is
    // headed by one h2, numbered the same way.
    const entries = await contents
      .getByRole("link")
      .evaluateAll((found) =>
        found.map((anchor) => (anchor.textContent ?? "").replace(/\s+/g, " ").trim()),
      );
    const headings = await sections.evaluateAll((found) =>
      found.map((section) => {
        const all = section.querySelectorAll("h2");
        return {
          count: all.length,
          text: [...(all[0]?.children ?? [])].map((part) => part.textContent ?? "").join(" "),
          labelled: section.getAttribute("aria-labelledby") === all[0]?.id,
        };
      }),
    );
    for (const [index, heading] of headings.entries()) {
      expect(heading.count).toBe(1);
      expect(heading.labelled).toBe(true);
      expect(heading.text).toMatch(new RegExp(`^${index + 1} \\S`));
      expect(entries[index]?.replace(/^(\d+)\s*/, "$1 ")).toBe(heading.text);
    }

    // No id is on the page twice, so every anchor has one place to go.
    const repeated = await page.evaluate(() => {
      const seen = new Set<string>();
      const twice: string[] = [];
      for (const element of document.querySelectorAll("[id]")) {
        if (seen.has(element.id)) twice.push(element.id);
        seen.add(element.id);
      }
      return twice;
    });
    expect(repeated).toEqual([]);

    // Headings go in order: the h1, then h2 sections, with h3 only inside a section.
    const outside = await page.evaluate(
      () => document.querySelectorAll("main h3:not([data-legal-section] h3)").length,
    );
    expect(outside).toBe(0);
  });

  test(`${href} leads to the contact page and to the other three`, async ({ page }) => {
    await page.goto(href);
    const main = page.getByRole("main");

    // In the words of the page, and in the list of policies beside them.
    await expect(main.locator(`article a[href="${CONTACT_LINK.href}"]`).first()).toBeVisible();
    await expect(main.locator(`a[href="mailto:${SITE.contactEmail}"]`).first()).toBeVisible();

    const policies = main.getByRole("complementary", { name: "Policies" });
    await expect(policies.getByRole("link", { name: label, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (const other of LEGAL_LINKS) {
      await expect(policies.locator(`a[href="${other.href}"]`)).toHaveCount(1);
      if (other.href !== href) {
        await expect(main.locator(`article a[href^="${other.href}"]`).first()).toBeAttached();
      }
    }
  });

  test(`${href} sets no cookie and keeps only the site's two session entries`, async ({
    page,
    context,
  }) => {
    await page.goto(href);
    await page.waitForLoadState("networkidle");

    expect(await context.cookies()).toEqual([]);
    const kept = await page.evaluate(() => ({
      local: Object.keys(window.localStorage),
      session: Object.keys(window.sessionStorage),
    }));
    expect(kept.local).toEqual([]);
    for (const key of kept.session) expect(key).toMatch(/^advanta365\.(intro|ink)\.v1$/);
  });
}

test("an entry of the contents brings its section into view and lights its number", async ({
  page,
}) => {
  await page.goto("/privacy");
  await hydrated(page);

  const entry = page
    .getByRole("navigation", { name: "On this page" })
    .getByRole("link", { name: /Cookies and browser storage/ });
  await entry.click();
  await expect(page).toHaveURL(/\/privacy#cookies$/);

  const section = page.locator("#cookies");
  await expect(section).toBeInViewport();
  // The section's number takes the highlighter while the address names the section.
  await expect(section.locator("h2 > span").first()).toHaveCSS(
    "background-color",
    "rgb(134, 193, 255)",
  );
  // What is planned for the checkout stands in a part of its own, with an anchor.
  await expect(
    page.locator("#when-checkout-opens").and(page.getByRole("heading", { level: 3 })),
  ).toHaveText("When checkout opens");
});

test("the policies beside a page lead to the next one", async ({ page }) => {
  await page.goto("/privacy");
  await hydrated(page);

  await page
    .getByRole("complementary", { name: "Policies" })
    .getByRole("link", { name: "Refunds", exact: true })
    .click();
  await expect(page).toHaveURL(/\/refunds$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Refund policy");
});

test("from 68em the contents and the policies stand at the sides of the words", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "the phone has one column");
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/terms");

  const contents = page.getByRole("navigation", { name: "On this page" });
  const words = page.locator("main article");
  const policies = page.getByRole("complementary", { name: "Policies" });
  const [left, middle, right] = await Promise.all(
    [contents, words, policies].map((part) => part.boundingBox()),
  );
  if (!left || !middle || !right) throw new Error("a part of the page has no box");

  expect(left.x + left.width).toBeLessThanOrEqual(middle.x);
  expect(middle.x + middle.width).toBeLessThanOrEqual(right.x);
  await expect(contents).toHaveCSS("position", "sticky");
  await expect(policies).toHaveCSS("position", "sticky");

  // A line of the words keeps to a reading measure: 40rem at most.
  const widest = await words.evaluate((article) =>
    Math.max(...[...article.querySelectorAll("p")].map((line) => line.clientWidth)),
  );
  expect(widest).toBeLessThanOrEqual(640);
});

test("on a phone the contents come first, in one column, each a 44px target", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/accessibility");

  const contents = page.getByRole("navigation", { name: "On this page" });
  const first = page.locator("main [data-legal-section]").first();
  const top = await contents.boundingBox();
  const below = await first.boundingBox();
  if (!top || !below) throw new Error("a part of the page has no box");
  expect(top.y + top.height).toBeLessThanOrEqual(below.y);

  const heights = await contents
    .getByRole("link")
    .evaluateAll((found) => found.map((anchor) => anchor.getBoundingClientRect().height));
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(44 - 0.5);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
