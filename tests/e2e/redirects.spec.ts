import { expect, test } from "@playwright/test";

// The site once had a bundles index, bundle pages, a pricing page, a cart and a contact page. Their
// addresses are permanent redirects now, so that a bookmark or a link from elsewhere still lands on
// the page that took over: the one purchase page, or the contact section of About. A template had
// a page of its own, too: its address now opens the catalog with that template in the pop-up when
// it is a free sample, and the catalog as it is when it is not.

const MOVED: readonly { from: string; pathname: string; hash?: string; search?: string }[] = [
  { from: "/bundles", pathname: "/purchase" },
  { from: "/bundles/sponsor-essentials", pathname: "/purchase" },
  { from: "/bundles/x?y=1", pathname: "/purchase" },
  { from: "/pricing", pathname: "/purchase" },
  { from: "/Pricing", pathname: "/purchase" },
  { from: "/cart", pathname: "/purchase" },
  { from: "/contact", pathname: "/about", hash: "#contact" },
  {
    from: "/templates/change-management-strategy",
    pathname: "/catalog",
    search: "?view=change-management-strategy",
  },
  { from: "/templates/nope", pathname: "/catalog", search: "?view=nope" },
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
    ["/contact", "/about#contact"],
    ["/templates/change-management-strategy", "/catalog?view=change-management-strategy"],
    ["/templates/nope", "/catalog?view=nope"],
  ] as const) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(308);
    expect(response.headers().location, from).toBe(location);
  }
});

test("the contact section is on About, and Purchase gives the offer, its price and the address", async ({
  page,
}) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Proven change content, so your M365 rollout gets used, not just launched.",
  );
  await expect(page.locator("#contact").getByRole("heading", { level: 2 })).toHaveText("Contact");
  await expect(page.locator('#contact a[href^="mailto:"]')).toBeVisible();

  await page.goto("/purchase");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Purchase");
  // Exactly: an answer further down the page speaks of "the complete toolkit" in a sentence.
  await expect(page.getByText("The complete toolkit", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByText("$499.99")).toBeVisible();
  await expect(page.getByRole("button", { name: "Checkout coming soon" })).toBeDisabled();
});

test("the old address of a free sample opens it in the pop-up; any other shows the catalog", async ({
  page,
}) => {
  await page.goto("/templates/change-management-strategy");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catalog");
  await expect(page.locator("dialog[open]")).toHaveCount(1);
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
