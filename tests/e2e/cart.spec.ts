import { expect, test } from "@playwright/test";

const TEMPLATE = "/templates/executive-sponsor-kickoff-deck";

test("a template can be added, seen in the cart and removed", async ({ page }) => {
  await page.goto(TEMPLATE);
  await page.getByRole("button", { name: "Add to cart" }).click();

  await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();
  await page.getByRole("link", { name: "In cart — view cart" }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("link", { name: "Executive Sponsor Kickoff Deck" })).toBeVisible();
  await expect(page.getByLabel("Order summary")).toContainText("$59");
  await expect(page.getByRole("button", { name: "Checkout — coming soon" })).toBeDisabled();

  await page.reload();
  await expect(page.getByRole("link", { name: "Executive Sponsor Kickoff Deck" })).toBeVisible();

  await page.getByRole("button", { name: "Remove Executive Sponsor Kickoff Deck" }).click();
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart, 0 items" })).toBeVisible();
});

test("a template and a bundle add up in the subtotal", async ({ page }) => {
  // The playbook is not in Sponsor Essentials.
  await page.goto("/templates/champion-network-playbook");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/bundles/sponsor-essentials");
  await page.getByRole("button", { name: "Add bundle to cart" }).click();
  await expect(page.getByRole("link", { name: "Cart, 2 items" })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByLabel("Order summary")).toContainText("$183");
});

test("a template a bundle in the cart holds is not charged twice", async ({ page }) => {
  await page.goto(TEMPLATE);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/bundles/sponsor-essentials");
  await page.getByRole("button", { name: "Add bundle to cart" }).click();

  await page.goto("/cart");
  await expect(page.getByText("Included in Sponsor Essentials")).toBeVisible();
  await expect(page.getByLabel("Order summary")).toContainText("$139");
  await expect(
    page.getByRole("button", { name: "Remove Executive Sponsor Kickoff Deck" }),
  ).toBeVisible();

  await page.goto(TEMPLATE);
  await expect(
    page.getByText("Included in Sponsor Essentials, which is in your cart."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to cart" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "View cart" })).toHaveAttribute("href", "/cart");
});

test("a corrupted saved cart is treated as empty", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("advanta365.cart.v1", "garbage"));
  await page.goto("/cart");
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
});

test("items that left the catalog are dropped from a saved cart", async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem(
      "advanta365.cart.v1",
      JSON.stringify([
        { kind: "template", slug: "gone" },
        { kind: "bundle", slug: "sponsor-essentials" },
      ]),
    ),
  );
  await page.goto("/cart");
  await expect(page.getByRole("link", { name: "Sponsor Essentials" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();
});

test("the cart still works when browser storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    Storage.prototype.getItem = blocked;
    Storage.prototype.setItem = blocked;
  });
  await page.goto(TEMPLATE);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("link", { name: "In cart — view cart" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cart, 1 item" })).toBeVisible();
});
