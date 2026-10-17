import { expect, test } from "@playwright/test";

// The site once had a bundles index, bundle pages, a pricing page, a cart and an About page. Their
// addresses are permanent redirects now, so that a bookmark or a link from elsewhere still lands on
// the page that took over: the one purchase page, or Why Advanta, which About became. A template had
// a page of its own, too: its address now opens the catalog with that template in the pop-up when
// it is a free sample, and the catalog as it is when it is not. The seven invented phases gave way
// to the toolkit's own folders: each old phase page goes to the phase that took over most of it.

const MOVED: readonly { from: string; pathname: string; hash?: string; search?: string }[] = [
  { from: "/bundles", pathname: "/purchase" },
  { from: "/bundles/sponsor-essentials", pathname: "/purchase" },
  { from: "/bundles/x?y=1", pathname: "/purchase" },
  { from: "/pricing", pathname: "/purchase" },
  { from: "/Pricing", pathname: "/purchase" },
  { from: "/cart", pathname: "/purchase" },
  { from: "/about", pathname: "/why-advanta" },
  { from: "/About", pathname: "/why-advanta" },
  { from: "/about?x=1", pathname: "/why-advanta", search: "?x=1" },
  {
    from: "/templates/change-management-strategy",
    pathname: "/catalog",
    search: "?view=change-management-strategy",
  },
  { from: "/templates/nope", pathname: "/catalog", search: "?view=nope" },
  { from: "/phases/make-the-case", pathname: "/phases/define-the-change" },
  { from: "/phases/plan", pathname: "/phases/assess-the-impact" },
  { from: "/phases/design", pathname: "/phases/design-the-platform" },
  { from: "/phases/prepare", pathname: "/phases/build-the-training" },
  { from: "/phases/communicate", pathname: "/phases/plan-communications" },
  { from: "/phases/execute", pathname: "/phases/go-live-and-support" },
  { from: "/Phases/Sustain", pathname: "/phases/make-it-stick" },
  {
    from: "/Templates/Change-Management-Strategy",
    pathname: "/catalog",
    search: "?view=Change-Management-Strategy",
  },
];

for (const { from, pathname, hash = "", search } of MOVED) {
  test(`${from} ends on ${pathname}${search ?? ""}${hash}`, async ({ page }) => {
    const response = await page.goto(from);
    expect(response?.status()).toBe(200);

    const url = new URL(page.url());
    expect(url.pathname).toBe(pathname);
    expect(url.hash).toBe(hash);
    if (search !== undefined) expect(url.search).toBe(search);
  });
}

test("the old addresses answer with a permanent redirect", async ({ request }) => {
  for (const [from, location] of [
    ["/bundles", "/purchase"],
    ["/bundles/sponsor-essentials", "/purchase"],
    ["/pricing", "/purchase"],
    ["/cart", "/purchase"],
    ["/about", "/why-advanta"],
    ["/templates/change-management-strategy", "/catalog?view=change-management-strategy"],
    ["/templates/nope", "/catalog?view=nope"],
  ] as const) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(308);
    expect(response.headers().location, from).toBe(location);
  }
});

test("Contact is a page of its own again, and Purchase gives the offer and its price", async ({
  page,
}) => {
  // `/contact` was a redirect to a section of About for a while; it answers as a page now.
  const response = await page.goto("/contact");
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact");
  await expect(page.getByRole("main").locator('a[href^="mailto:"]').first()).toBeVisible();

  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Change content that has met real users.",
  );

  await page.goto("/purchase");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Eleven phases in one folder.");
  // Exactly: the folder's tab is the one place the name of the offer is printed.
  await expect(page.getByText("The complete toolkit", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByText("$1,499.99")).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Checkout", exact: true }),
  ).toHaveAttribute("href", "/purchase?checkout=details");
});

test("the old address of a free sample opens it in the pop-up; any other shows the catalog", async ({
  page,
}) => {
  await page.goto("/templates/change-management-strategy");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catalog");
  await expect(page.locator("dialog[open]")).toHaveCount(1);
  await expect(page.getByRole("dialog", { name: "Change Management Strategy" })).toBeVisible();

  // The address is not case-sensitive, and the redirect keeps the case it was typed in.
  await page.goto("/Templates/Change-Management-Strategy");
  await expect(page.getByRole("dialog", { name: "Change Management Strategy" })).toBeVisible();

  for (const from of ["/templates/nope", "/templates/sharepoint-migration-impact-assessment"]) {
    const response = await page.goto(from);
    expect(response?.status(), from).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catalog");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator("#results-heading")).toHaveText("67 templates");
    // A locked template is answered, by its tile or, where the tile is not on the page, by the
    // line above the results; a name the catalog does not hold is answered by nothing.
    await expect(page.locator("[data-answer], [data-included]"), from).toHaveCount(
      from.endsWith("/nope") ? 0 : 1,
    );
  }
});
