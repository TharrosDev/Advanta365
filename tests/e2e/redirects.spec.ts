import { expect, test } from "@playwright/test";

// The site once had a bundles index, bundle pages, a pricing page, a cart and a contact page. Their
// addresses are permanent redirects now, so that a bookmark or a link from elsewhere still lands on
// the page that took over: the one purchase page, or the contact section of About.

const MOVED: readonly { from: string; pathname: string; hash?: string }[] = [
  { from: "/bundles", pathname: "/purchase" },
  { from: "/bundles/sponsor-essentials", pathname: "/purchase" },
  { from: "/bundles/x?y=1", pathname: "/purchase" },
  { from: "/pricing", pathname: "/purchase" },
  { from: "/Pricing", pathname: "/purchase" },
  { from: "/cart", pathname: "/purchase" },
  { from: "/contact", pathname: "/about", hash: "#contact" },
];

for (const { from, pathname, hash = "" } of MOVED) {
  test(`${from} ends on ${pathname}${hash}`, async ({ page }) => {
    const response = await page.goto(from);
    expect(response?.status()).toBe(200);

    const url = new URL(page.url());
    expect(url.pathname).toBe(pathname);
    expect(url.hash).toBe(hash);
  });
}

test("the old addresses answer with a permanent redirect", async ({ request }) => {
  for (const [from, location] of [
    ["/bundles", "/purchase"],
    ["/bundles/sponsor-essentials", "/purchase"],
    ["/pricing", "/purchase"],
    ["/cart", "/purchase"],
    ["/contact", "/about#contact"],
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
  await expect(page.getByText("$499.99")).toBeVisible();
  await expect(page.getByRole("button", { name: "Checkout coming soon" })).toBeDisabled();
});
