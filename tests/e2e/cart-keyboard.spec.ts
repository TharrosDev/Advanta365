import { expect, test } from "@playwright/test";

const KEY = "advanta365.cart.v1";

test("adding with the keyboard moves focus to the cart link and announces it", async ({ page }) => {
  await page.goto("/templates/executive-sponsor-kickoff-deck");
  await page.getByRole("button", { name: "Add to cart" }).focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("link", { name: "In cart — view cart" })).toBeFocused();
  await expect(page.getByRole("main").getByRole("status")).toHaveText("Added to cart.");
});

test("removing a line moves focus to the next line", async ({ page }) => {
  await page.addInitScript(
    ([key]) =>
      window.localStorage.setItem(
        key!,
        JSON.stringify([
          { kind: "template", slug: "executive-sponsor-kickoff-deck" },
          { kind: "bundle", slug: "sponsor-essentials" },
        ]),
      ),
    [KEY],
  );
  await page.goto("/cart");
  await page.getByRole("button", { name: "Remove Executive Sponsor Kickoff Deck" }).focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("button", { name: "Remove Sponsor Essentials" })).toBeFocused();
});

test("removing the last line moves focus to the empty-cart heading", async ({ page }) => {
  await page.goto("/templates/executive-sponsor-kickoff-deck");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/cart");
  await page.getByRole("button", { name: "Remove Executive Sponsor Kickoff Deck" }).focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("heading", { name: "Your cart is empty." })).toBeFocused();
});

test("a stale saved cart is cleaned up on any page, not only the cart", async ({ page }) => {
  await page.addInitScript(
    ([key]) => {
      // Only seed once, so the cleaned-up cart is what a later page load sees.
      if (window.sessionStorage.getItem("seeded")) return;
      window.sessionStorage.setItem("seeded", "1");
      window.localStorage.setItem(key!, JSON.stringify([{ kind: "template", slug: "gone" }]));
    },
    [KEY],
  );
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Cart, 0 items" })).toBeVisible();
  expect(await page.evaluate((key) => window.localStorage.getItem(key), KEY)).toBe("[]");
});
