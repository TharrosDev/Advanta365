import { expect, test } from "@playwright/test";
import { introSeen } from "./helpers";

// The one place a sale starts. `/purchase` shows the toolkit as one folder with its price on a paper
// tag, the phases it reaches, and, on a contents leaf beside it, what is inside (the ledger, a
// Checkout button that is not built yet and says so, the address to write to and the note that the
// catalog is sample content). The home page shows the same folder with a way to that page.

const PHASES = ["Make the case", "Plan", "Design", "Prepare", "Communicate", "Execute", "Sustain"];

test.beforeEach(async ({ page }) => {
  await introSeen(page);
});

test("the purchase page has one title, and the price once, on the tag", async ({ page }) => {
  await page.goto("/purchase");

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Purchase");

  // The folder carries the name of the offer on its tab.
  await expect(page.locator("[data-folder]").getByText("The complete toolkit")).toBeVisible();

  // The price is printed in one place only on the page: the tag that hangs from the folder.
  const tag = page.locator("[data-price-tag]");
  await expect(tag).toHaveCount(1);
  await expect(tag).toContainText("$499.99");
  await expect(tag).toContainText("one purchase");
  // The bar’s button repeats it from 68em, so the count is of the page itself, not the bar.
  await expect(page.getByRole("main").getByText("$499.99")).toHaveCount(1);
  const mentions = await page
    .getByRole("main")
    .evaluate((main) => (main.textContent ?? "").split("$499.99").length - 1);
  expect(mentions).toBe(1);
});

test("the folder shows the six sample covers and a tally of all seven phases", async ({ page }) => {
  await page.goto("/purchase");

  const folder = page.locator("[data-folder]");
  await expect(folder).toHaveCount(1);
  await expect(folder.locator("[data-cover]")).toHaveCount(6);

  const tally = page.getByRole("img", { name: `Phases: ${PHASES.join(", ")}` });
  await expect(tally).toBeVisible();
  await expect(tally.locator("[data-block]")).toHaveCount(7);
  await expect(tally.locator('[data-block="ink"]')).toHaveCount(7);
});

test("the ledger counts what is inside the toolkit", async ({ page }) => {
  await page.goto("/purchase");

  const ledger = page
    .locator("section", { has: page.getByRole("heading", { level: 2, name: "What is inside" }) })
    .locator("dl");
  await expect(ledger).toHaveCount(1);

  for (const [label, count] of [
    ["Playbooks", "59"],
    ["Templates", "130"],
    ["Field guides", "4"],
    ["Job aids", "58"],
  ] as const) {
    const row = ledger.locator("div", { has: page.locator("dt", { hasText: label }) });
    await expect(row.locator("dd [data-count]"), label).toHaveText(count);
  }
  await expect(ledger).toContainText("three audiences");
});

test("checkout is not built: the button says so, can be reached and does nothing", async ({
  page,
}) => {
  await page.goto("/purchase");

  const button = page.getByRole("button", { name: "Checkout coming soon" });
  await expect(button).toBeDisabled();
  // It stays in the tab order, so the words reach a keyboard, and it shows the focus ring.
  await expect(button).toHaveAttribute("aria-disabled", "true");
  await button.focus();
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS("cursor", "not-allowed");

  const before = page.url();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  expect(page.url()).toBe(before);

  // The address to write to stands beside it, and the page says the catalog is sample content.
  const main = page.getByRole("main");
  await expect(main.locator('a[href="mailto:hello@advanta365.com"]')).toBeVisible();
  await expect(main.getByText(/the catalog on this site shows sample content/i)).toBeVisible();
});

test("there is no questions section, and what is inside sits beside the folder from 68em", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/purchase");

  await expect(page.getByRole("heading", { level: 2, name: "Questions" })).toHaveCount(0);

  // The folder is on the left, the price tag clear of the leaf, and the leaf holds the ledger, the
  // button, the address and the note, in that order.
  const folder = await page.locator("[data-folder]").boundingBox();
  const tag = await page.locator("[data-price-tag]").boundingBox();
  const leaf = page.locator("[data-paper][data-lit]").filter({ hasText: "What is inside" });
  await expect(leaf).toHaveCount(1);
  const sheet = await leaf.boundingBox();
  expect(folder && tag && sheet).toBeTruthy();
  expect(folder!.x + folder!.width).toBeLessThanOrEqual(sheet!.x);
  expect(tag!.x + tag!.width).toBeLessThanOrEqual(sheet!.x);

  const order = await leaf.evaluate((root) => {
    const at = (selector: string) => root.querySelector(selector);
    const follows = (first: Element | null, second: Element | null) =>
      !!first &&
      !!second &&
      (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    const ledger = at("dl");
    const button = at('[aria-disabled="true"]');
    const mail = at('a[href^="mailto:"]');
    return { one: follows(ledger, button), two: follows(button, mail) };
  });
  expect(order).toEqual({ one: true, two: true });
});

test("at 320px the purchase page does not scroll sideways and the tag stays on the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/purchase");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  const box = await page.locator("[data-price-tag]").boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);

  // Nor does its paper lie over the maker's name on the front of the folder.
  const paper = await page.locator("[data-price-tag] [data-paper]").boundingBox();
  const name = await page.locator("[data-folder]").getByText("Advanta365").boundingBox();
  expect(paper).not.toBeNull();
  expect(name).not.toBeNull();
  const apart =
    paper!.x >= name!.x + name!.width ||
    paper!.y >= name!.y + name!.height ||
    paper!.y + paper!.height <= name!.y;
  expect(apart).toBe(true);
});

test("the tag swings once when it is seen, and comes to rest at its own angle", async ({
  page,
}) => {
  await page.goto("/purchase");

  const tag = page.locator("[data-price-tag]");
  await expect(tag).toHaveAttribute("data-seen", "");
  await expect(tag).toHaveCSS("animation-name", "price-tag-swing");
  await expect(tag).toHaveCSS("animation-iteration-count", "1");
  // Nothing of the swing is left once it is over: the tag is turned by its resting angle alone.
  await expect
    .poll(
      () =>
        tag.evaluate(
          (element) =>
            element.getAnimations().filter((animation) => animation.playState === "running").length,
        ),
      { timeout: 10_000 },
    )
    .toBe(0);
  const turn = await tag.evaluate((element) => getComputedStyle(element).rotate);
  expect(Math.abs(Number.parseFloat(turn))).toBeGreaterThan(3);
  expect(Math.abs(Number.parseFloat(turn))).toBeLessThan(8);
});

test("under reduced motion the tag hangs still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/purchase");

  const tag = page.locator("[data-price-tag]");
  await expect(tag).toBeVisible();
  // The tag is deaf to the pointer: the folder it is tied to is what a pointer wakes.
  await page.locator("[data-folder]").hover({ position: { x: 40, y: 200 } });
  const swinging = await tag.evaluate(
    (element) =>
      document.getAnimations().filter((animation) => {
        const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
        return target !== null && element.contains(target);
      }).length,
  );
  expect(swinging).toBe(0);
  await expect(tag).toHaveCSS("animation-name", "none");
  await expect(tag.locator("> div")).toHaveCSS("animation-name", "none");
});

test("home shows the toolkit as a folder that leads to the purchase page", async ({ page }) => {
  await page.goto("/");

  const section = page.locator("#toolkit");
  await expect(section).toHaveCount(1);
  await expect(page.locator("#bundles")).toHaveCount(0);
  await expect(section.locator("[data-folder]")).toHaveCount(1);
  await expect(section.locator("[data-price-tag]")).toContainText("$499.99");

  const link = section.getByRole("link", { name: "Purchase the toolkit" });
  await expect(link).toHaveAttribute("href", "/purchase");
});
