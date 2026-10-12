import { expect, test, type Page } from "@playwright/test";
import { hydrated, introSeen, NAVIGATION_TIMEOUT } from "./helpers";

// The checkout is a pop-up over the Purchase page, the same native modal dialog as the pop-up of the
// catalog: being open is the `checkout` parameter of the address, which names the step and nothing
// else. Three steps (Your details, Review, Payment) beside an order summary. The order is kept in
// the tab's session storage, so it survives a reload, and it is never sent anywhere and never
// written into an address. No payment provider is connected, so the last step says so and offers
// the order by email.

const DRAFT_KEY = "advanta365:checkout";
const ORDER_CODE = /^A365-\d{6}-[2-9A-HJ-NP-Z]{6}$/;

const BUYER = {
  fullName: "Ada Okafor",
  email: "ada.okafor@example.org",
  organization: "City of Riverbend",
  poNumber: "PO-4471",
};

const dialog = (page: Page) => page.locator("dialog[data-checkout-dialog]");
const opener = (page: Page) =>
  page.getByRole("main").getByRole("link", { name: "Checkout", exact: true });
const step = (page: Page) => dialog(page).locator("[data-checkout-step]");
const heading = (page: Page, name: string) =>
  dialog(page).getByRole("heading", { level: 3, name, exact: true });
const announcement = (page: Page) => dialog(page).getByRole("status").first();
const params = (page: Page) => new URL(page.url()).searchParams;
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 640;

async function modal(page: Page) {
  await expect(dialog(page)).toBeVisible();
  await expect.poll(() => dialog(page).evaluate((element) => element.matches(":modal"))).toBe(true);
}

async function openPurchase(page: Page, address = "/purchase") {
  const response = await page.goto(address);
  await hydrated(page);
  return response;
}

/**
 * The link arrives with the foot of the leaf. A click on it while it still moves makes the test
 * runner scroll to find it, and can be lost, so the entrance is let finish first.
 */
async function entered(page: Page) {
  await expect
    .poll(() =>
      opener(page).evaluate((element) => {
        const moving = (animation: Animation) =>
          animation.playState === "running" &&
          animation.effect instanceof KeyframeEffect &&
          !!animation.effect.target?.contains(element);
        return document.getAnimations().filter(moving).length;
      }),
    )
    .toBe(0);
}

/** Opens the checkout from the Checkout link of the contents leaf. */
async function openFromButton(page: Page) {
  await entered(page);
  await opener(page).click();
  await expect(page).toHaveURL(/\/purchase\?checkout=details$/, { timeout: NAVIGATION_TIMEOUT });
  await modal(page);
}

/** Fills the needed fields of "Your details" for a buyer in Ontario. */
async function fillDetails(page: Page) {
  const form = dialog(page);
  await form.getByLabel("Full name").fill(BUYER.fullName);
  await form.getByLabel("Work email").fill(BUYER.email);
  await form.getByLabel("Organization").fill(BUYER.organization);
  await form.getByLabel("Country").selectOption("CA");
  await form.getByLabel("Province or territory").selectOption("ON");
}

async function toReview(page: Page) {
  await fillDetails(page);
  await dialog(page).getByRole("button", { name: "Continue to review" }).click();
  await expect(page).toHaveURL(/\/purchase\?checkout=review$/);
  await expect(heading(page, "Review")).toBeVisible();
}

async function toPayment(page: Page) {
  await toReview(page);
  await dialog(page)
    .getByRole("checkbox", { name: /I agree to the Terms/ })
    .check();
  await dialog(page).getByRole("button", { name: "Continue to payment" }).click();
  await expect(page).toHaveURL(/\/purchase\?checkout=payment$/);
  await expect(heading(page, "Payment")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await introSeen(page);
});

test("the Checkout link opens the checkout over the page, and the address names its first step", async ({
  page,
}) => {
  await openPurchase(page);
  await expect(dialog(page)).toHaveCount(0);

  await entered(page);

  // The page must not jump: the link is brought to the middle of the window first.
  await opener(page).evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  const before = await page.evaluate(() => window.scrollY);

  await openFromButton(page);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
  expect([...params(page).keys()]).toEqual(["checkout"]);

  // It is a dialog named "Checkout"; its title is not a second h1, and the first step is in view.
  const named = page.getByRole("dialog", { name: "Checkout" });
  await expect(named).toBeVisible();
  await expect(named.getByRole("heading", { level: 2, name: "Checkout" })).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(heading(page, "Your details")).toBeVisible();
  await expect(step(page)).toHaveAttribute("data-checkout-step", "details");
  expect(await dialog(page).evaluate((element) => element.contains(document.activeElement))).toBe(
    true,
  );

  // The steps are named in order, and the first is the current one.
  const steps = dialog(page).getByRole("list", { name: "Steps" }).getByRole("listitem");
  await expect(steps).toHaveText(["1Your details", "2Review", "3Payment"]);
  await expect(dialog(page).locator('[aria-current="step"]')).toHaveText("1Your details");
});

test("the order summary is always there: the offer, what it holds, the price and an honest tax line", async ({
  page,
}) => {
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);

  // One of its two forms is shown: the column from 68em, the row that opens below it.
  const shown = dialog(page).locator("[data-order-summary]").filter({ visible: true });
  await expect(shown).toHaveCount(1);
  await expect(shown).toHaveAttribute(
    "data-order-summary",
    (page.viewportSize()?.width ?? 0) >= 1088 ? "panel" : "disclosure",
  );
  await expect(shown).toContainText("The complete toolkit");
  await expect(shown).toContainText("$1,499.99");
  await expect(shown).toContainText("CAD");
  for (const line of ["59 playbooks", "130 templates", "4 field guides", "58 job aids"]) {
    await expect(shown).toContainText(line);
  }
  await expect(shown).toContainText("Training for three audiences");
  await expect(shown).toContainText("Calculated at payment");
  await expect(shown).toContainText("Total before tax");
});

test("a link to a step opens the checkout on load; any other value opens nothing", async ({
  page,
}) => {
  const response = await openPurchase(page, "/purchase?checkout=details");
  expect(response?.status()).toBe(200);
  await modal(page);
  await expect(heading(page, "Your details")).toBeVisible();

  for (const value of ["junk", "", "1", "../x"]) {
    const other = await openPurchase(page, `/purchase?checkout=${encodeURIComponent(value)}`);
    expect(other?.status()).toBe(200);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Seven phases in one folder.");
  }
});

test("a link to a later step of an order that is not there shows the first step, and says so in the address", async ({
  page,
}) => {
  await openPurchase(page, "/purchase?checkout=payment");
  await modal(page);
  await expect(heading(page, "Your details")).toBeVisible();
  await expect(page).toHaveURL(/\/purchase\?checkout=details$/);
});

test("Escape closes it, takes checkout out of the address and hands focus back to the link", async ({
  page,
}) => {
  await openPurchase(page);
  await openFromButton(page);

  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  await expect(page).toHaveURL(/\/purchase$/);
  await expect(opener(page)).toBeFocused();
});

test("its Close control closes it the same way", async ({ page }) => {
  await openPurchase(page);
  await openFromButton(page);

  await dialog(page).getByRole("link", { name: "Close", exact: true }).click();
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  await expect(page).toHaveURL(/\/purchase$/);
  await expect(opener(page)).toBeFocused();
});

test("a click on the dimmed page closes it, and a click inside it does not", async ({ page }) => {
  test.skip(isPhone(page), "on a phone the checkout is the whole window: no dimmed page to click");
  await openPurchase(page);
  await openFromButton(page);

  await heading(page, "Your details").click();
  await expect(dialog(page)).toBeVisible();
  await expect(page).toHaveURL(/checkout=details$/);

  // The panel never reaches the corner of the window.
  await page.mouse.click(3, 3);
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  await expect(page).toHaveURL(/\/purchase$/);
});

test("Back closes it and focus returns to the link; Forward opens it again", async ({ page }) => {
  await openPurchase(page);
  await openFromButton(page);

  await page.goBack();
  await expect(page).toHaveURL(/\/purchase$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  await expect(opener(page)).toBeFocused();

  await page.goForward();
  await expect(page).toHaveURL(/checkout=details$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(dialog(page)).toBeVisible();
});

test("the steps are one history entry with the dialog: closing on a later step leaves nothing behind", async ({
  page,
}) => {
  await page.goto("/catalog");
  await openPurchase(page);
  await openFromButton(page);
  await toReview(page);

  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  await expect(page).toHaveURL(/\/purchase$/);
  await expect(opener(page)).toBeFocused();

  // The open, the step and the close were one step of history: Back leaves the Purchase page.
  await page.goBack();
  await expect(page).toHaveURL(/\/catalog$/, { timeout: NAVIGATION_TIMEOUT });
});

test("the fields are labelled, marked and carry their autocomplete tokens", async ({ page }) => {
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);
  const form = dialog(page);

  const fields = [
    { label: "Full name", id: "checkout-fullName", token: "name", required: true },
    { label: "Work email", id: "checkout-email", token: "email", required: true },
    { label: "Organization", id: "checkout-organization", token: "organization", required: true },
    { label: "Country", id: "checkout-country", token: "country", required: true },
    { label: "Region", id: "checkout-region", token: "address-level1", required: false },
    { label: "PO or reference number", id: "checkout-poNumber", token: "off", required: false },
    { label: "Note", id: "checkout-note", token: "off", required: false },
  ];
  for (const field of fields) {
    const control = form.getByLabel(field.label);
    await expect(control, field.label).toHaveCount(1);
    await expect(control, field.label).toHaveAttribute("id", field.id);
    await expect(control, field.label).toHaveAttribute("autocomplete", field.token);
    expect(await control.evaluate((element) => (element as HTMLInputElement).required)).toBe(
      field.required,
    );
    // A field that is not needed says so in words.
    const label = form.locator(`label[for="${field.id}"]`);
    if (field.required) await expect(label).not.toContainText("(optional)");
    else await expect(label).toContainText("(optional)");
  }

  await expect(form.getByLabel("Work email")).toHaveAttribute("type", "email");
  await expect(form.getByLabel("Work email")).toHaveAttribute("inputmode", "email");
  expect(await form.getByLabel("Country").evaluate((element) => element.tagName)).toBe("SELECT");
  // Canada is the first country of the list, after the empty choice.
  await expect(form.getByLabel("Country").locator("option").nth(1)).toHaveText("Canada");
  // Nothing in the checkout asks for a card.
  await expect(form.locator('[autocomplete^="cc-"], [name*="card" i]')).toHaveCount(0);
});

test("the region is a list for Canada and the United States, and a free line anywhere else", async ({
  page,
}) => {
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);
  const form = dialog(page);
  const region = form.locator("#checkout-region");

  expect(await region.evaluate((element) => element.tagName)).toBe("INPUT");

  await form.getByLabel("Country").selectOption("CA");
  await expect(form.getByLabel("Province or territory")).toHaveAttribute("id", "checkout-region");
  expect(await region.evaluate((element) => element.tagName)).toBe("SELECT");
  await expect(region.locator("option")).toHaveCount(14);
  await region.selectOption("QC");

  // Another country starts its region empty.
  await form.getByLabel("Country").selectOption("US");
  await expect(form.getByLabel("State")).toHaveValue("");
  await expect(region.locator("option")).toHaveCount(52);

  await form.getByLabel("Country").selectOption("FR");
  expect(await region.evaluate((element) => element.tagName)).toBe("INPUT");
  await expect(form.locator('label[for="checkout-region"]')).toContainText("Region (optional)");
});

test("sent empty, the form says what is wrong in a summary that takes focus and under each field", async ({
  page,
}) => {
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);
  const form = dialog(page);

  await form.getByRole("button", { name: "Continue to review" }).click();
  await expect(page).toHaveURL(/checkout=details$/);

  const summary = form.locator("[data-error-summary]");
  await expect(summary).toBeFocused();
  await expect(summary.getByRole("heading")).toHaveText("There are 4 problems to put right");
  await expect(summary.getByRole("link")).toHaveText([
    "Enter your full name",
    "Enter your work email",
    "Enter the name of your organization",
    "Choose a country",
  ]);

  for (const [id, message] of [
    ["checkout-fullName", "Enter your full name"],
    ["checkout-email", "Enter your work email"],
    ["checkout-organization", "Enter the name of your organization"],
    ["checkout-country", "Choose a country"],
  ] as const) {
    const control = form.locator(`#${id}`);
    await expect(control).toHaveAttribute("aria-invalid", "true");
    await expect(control).toHaveAttribute("aria-describedby", new RegExp(`${id}-error`));
    await expect(form.locator(`#${id}-error`)).toHaveText(`Error: ${message}`);
  }
  await expect(form.locator("#checkout-poNumber")).not.toHaveAttribute("aria-invalid", "true");

  // A problem in the summary puts the keyboard on its field.
  await summary.getByRole("link", { name: "Enter your work email" }).click();
  await expect(form.locator("#checkout-email")).toBeFocused();
  expect(new URL(page.url()).hash).toBe("");

  // Putting a field right takes its error away, and the count follows.
  await form.locator("#checkout-email").fill(BUYER.email);
  await expect(form.locator("#checkout-email-error")).toHaveCount(0);
  await expect(summary.getByRole("heading")).toHaveText("There are 3 problems to put right");
});

test("a field is checked when the keyboard leaves it, before the form is sent", async ({
  page,
}) => {
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);
  const form = dialog(page);

  const email = form.locator("#checkout-email");
  await email.fill("ada@");
  await expect(form.locator("#checkout-email-error")).toHaveCount(0);
  await email.blur();
  await expect(form.locator("#checkout-email-error")).toHaveText(
    "Error: Enter an email address like name@organization.ca",
  );
  await expect(email).toHaveAttribute("aria-invalid", "true");
  // Only the field that was left is judged, and there is no summary yet.
  await expect(form.locator("[data-field-error]")).toHaveCount(1);
  await expect(form.locator("[data-error-summary]")).toHaveCount(0);
});

test("Enter in a field sends the step", async ({ page }) => {
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);
  await fillDetails(page);

  await dialog(page).locator("#checkout-organization").press("Enter");
  await expect(page).toHaveURL(/checkout=review$/);
  await expect(heading(page, "Review")).toBeFocused();
});

test("the whole walk: details, review with its agreement, and a payment step that says the truth", async ({
  page,
}) => {
  // Every address the page takes and every request it makes is kept, to be read at the end.
  const addresses: string[] = [];
  const sent: string[] = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) addresses.push(frame.url());
  });
  page.on("request", (request) => sent.push(`${request.url()} ${request.postData() ?? ""}`));

  await openPurchase(page);
  await openFromButton(page);
  const form = dialog(page);

  // Step one.
  await fillDetails(page);
  await form.locator("#checkout-poNumber").fill(BUYER.poNumber);
  await form.getByRole("button", { name: "Continue to review" }).click();

  // Step two: focus is on its heading, it is announced, and everything entered is read back.
  await expect(page).toHaveURL(/\/purchase\?checkout=review$/);
  await expect(heading(page, "Review")).toBeFocused();
  await expect(announcement(page)).toHaveText("Step 2 of 3: Review");
  await expect(form.locator('[aria-current="step"]')).toContainText("Review");
  for (const value of [
    BUYER.fullName,
    BUYER.email,
    BUYER.organization,
    "Canada",
    "Ontario",
    BUYER.poNumber,
  ]) {
    await expect(step(page).locator("dd", { hasText: value }).first()).toBeVisible();
  }

  // The Terms and the Refund policy open in a tab of their own, so the order stays as it is.
  for (const [name, href] of [
    [/^Terms/, "/terms"],
    [/^Refund policy/, "/refunds"],
  ] as const) {
    const link = step(page).getByRole("link", { name });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
  }

  // Sent without the agreement, it says so and stays.
  await form.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page).toHaveURL(/checkout=review$/);
  await expect(form.locator("[data-error-summary]")).toBeFocused();
  const agree = form.getByRole("checkbox", { name: /I agree to the Terms and the Refund policy/ });
  await expect(agree).toHaveAttribute("aria-invalid", "true");
  await expect(form.locator("#checkout-agree-error")).toContainText("Agree to the Terms");

  // "Edit" goes back to the field it names, with what was typed still there.
  await form.getByRole("button", { name: "Edit work email" }).click();
  await expect(page).toHaveURL(/checkout=details$/);
  await expect(form.locator("#checkout-email")).toBeFocused();
  await expect(form.locator("#checkout-email")).toHaveValue(BUYER.email);
  await expect(announcement(page)).toHaveText("Step 1 of 3: Your details");
  await form.getByRole("button", { name: "Continue to review" }).click();
  await expect(heading(page, "Review")).toBeFocused();

  await agree.check();
  await form.getByRole("button", { name: "Continue to payment" }).click();

  // Step three: no provider is connected, and the step says so.
  await expect(page).toHaveURL(/\/purchase\?checkout=payment$/);
  await expect(heading(page, "Payment")).toBeFocused();
  await expect(announcement(page)).toHaveText("Step 3 of 3: Payment");
  await expect(step(page)).toContainText("Online payment is not connected yet.");
  await expect(step(page)).toContainText("Nothing has been charged");
  await expect(step(page).locator("[data-pay]")).toHaveCount(0);
  await expect(step(page).locator("input")).toHaveCount(0);

  const code = (await step(page).locator("[data-order-code]").innerText()).trim();
  expect(code).toMatch(ORDER_CODE);
  await expect(step(page)).toContainText(BUYER.organization);

  // The order by email: a mailto to the site's address, with the order written out.
  const email = step(page).getByRole("link", { name: "Send this order by email" });
  const href = (await email.getAttribute("href")) ?? "";
  expect(href.startsWith("mailto:hello@advanta365.com?subject=")).toBe(true);
  const mail = new URLSearchParams(href.slice(href.indexOf("?") + 1));
  expect(mail.get("subject")).toBe(`Order ${code}: The complete toolkit`);
  const body = mail.get("body") ?? "";
  for (const part of [code, BUYER.fullName, BUYER.email, BUYER.organization, "Ontario", "CAD"]) {
    expect(body).toContain(part);
  }

  // Copying says it worked, or, where the browser refuses, shows the order to select.
  await step(page).getByRole("button", { name: "Copy order details" }).click();
  await expect(
    step(page).getByText("Order details copied.").or(step(page).locator("#checkout-order-text")),
  ).toBeVisible();

  // Nothing of the order was written into an address or sent to anybody.
  for (const address of [...addresses, page.url()]) {
    const url = new URL(address);
    expect(
      [...url.searchParams.keys()].filter((key) => key !== "checkout"),
      address,
    ).toEqual([]);
    expect(url.hash, address).toBe("");
  }
  for (const secret of [BUYER.email, "Okafor", "Riverbend", BUYER.poNumber, code]) {
    expect(addresses.join("\n")).not.toContain(secret);
    expect(sent.join("\n")).not.toContain(secret);
    expect(sent.join("\n")).not.toContain(encodeURIComponent(secret));
  }
});

test("the order survives a reload and a visit to the Terms, and keeps its reference", async ({
  page,
}) => {
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);
  await toReview(page);

  // A reload on the review: the same step, with everything that was entered.
  await page.reload();
  await hydrated(page);
  await modal(page);
  await expect(page).toHaveURL(/checkout=review$/);
  await expect(heading(page, "Review")).toBeVisible();
  await expect(step(page)).toContainText(BUYER.email);

  // Away to the Terms and back by a link to the first step: the fields are as they were left.
  await page.goto("/terms");
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);
  await expect(dialog(page).locator("#checkout-fullName")).toHaveValue(BUYER.fullName);
  await expect(dialog(page).locator("#checkout-country")).toHaveValue("CA");
  await expect(dialog(page).locator("#checkout-region")).toHaveValue("ON");

  // On to the payment, and a reload there: the order has its reference still.
  await dialog(page).getByRole("button", { name: "Continue to review" }).click();
  await dialog(page)
    .getByRole("checkbox", { name: /I agree to the Terms/ })
    .check();
  await dialog(page).getByRole("button", { name: "Continue to payment" }).click();
  await expect(heading(page, "Payment")).toBeVisible();
  const code = (await step(page).locator("[data-order-code]").innerText()).trim();
  expect(code).toMatch(ORDER_CODE);

  await page.reload();
  await hydrated(page);
  await modal(page);
  await expect(page).toHaveURL(/checkout=payment$/);
  await expect(step(page).locator("[data-order-code]")).toHaveText(code);

  // Closed and opened again from the page, it opens on the first step with the details in place.
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  await openFromButton(page);
  await expect(dialog(page).locator("#checkout-email")).toHaveValue(BUYER.email);
});

test("Start over forgets the order: the storage is cleared and the form is empty", async ({
  page,
}) => {
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);
  await toPayment(page);
  expect(
    await page.evaluate((key) => window.sessionStorage.getItem(key), DRAFT_KEY),
  ).not.toBeNull();

  await step(page).getByRole("button", { name: "Start over" }).click();
  await expect(page).toHaveURL(/checkout=details$/);
  await expect(heading(page, "Your details")).toBeFocused();
  await expect(dialog(page).locator("#checkout-fullName")).toHaveValue("");
  await expect(dialog(page).locator("#checkout-country")).toHaveValue("");
  expect(await page.evaluate((key) => window.sessionStorage.getItem(key), DRAFT_KEY)).toBeNull();
});

test("the stored order holds what was typed and nothing else", async ({ page }) => {
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);
  await toPayment(page);

  const stored = await page.evaluate(
    (key) => JSON.parse(window.sessionStorage.getItem(key) ?? "{}") as Record<string, unknown>,
    DRAFT_KEY,
  );
  expect(Object.keys(stored).sort()).toEqual(["agreed", "createdAt", "details", "reference"]);
  expect(Object.keys(stored.details as object).sort()).toEqual(
    ["country", "email", "fullName", "note", "organization", "poNumber", "region"].sort(),
  );
  // It is kept for the tab, not for the browser.
  expect(await page.evaluate((key) => window.localStorage.getItem(key), DRAFT_KEY)).toBeNull();
});

test("on a phone the checkout is the whole window, with its actions at the foot and the summary a row that opens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);

  // The window's own width: what a scrollbar's gutter leaves of the 390px, where there is one.
  // A fixed box from edge to edge measures it, as the dialog is placed.
  const width = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;inset:0;visibility:hidden";
    document.body.append(probe);
    const measured = probe.getBoundingClientRect().width;
    probe.remove();
    return Math.round(measured);
  });
  const box = await dialog(page).boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box!.x)).toBe(0);
  expect(Math.round(box!.y)).toBe(0);
  expect(Math.round(box!.width)).toBe(width);
  expect(Math.round(box!.height)).toBe(844);

  // The summary is closed until it is asked for.
  const summary = dialog(page).locator('details[data-order-summary="disclosure"]');
  const open = () => summary.evaluate((element) => (element as HTMLDetailsElement).open);
  await expect(summary).toBeVisible();
  await expect(dialog(page).locator('[data-order-summary="panel"]')).toBeHidden();
  expect(await open()).toBe(false);
  await summary.locator("summary").click();
  expect(await open()).toBe(true);
  await expect(summary.getByText("Calculated at payment")).toBeVisible();
  await summary.locator("summary").click();
  expect(await open()).toBe(false);

  // The main action stays in the window, at its foot, while the step is longer than the window
  // and scrolls behind it.
  const action = dialog(page).getByRole("button", { name: "Continue to review" });
  await expect(action).toBeInViewport({ ratio: 1 });
  const button = await action.boundingBox();
  expect(button!.height).toBeGreaterThanOrEqual(44);
  expect(button!.y + button!.height).toBeGreaterThan(844 - 96);
  const scrolls = await action.evaluate((element) => {
    for (let box = element.parentElement; box; box = box.parentElement) {
      if (getComputedStyle(box).overflowY === "auto") return box.scrollHeight > box.clientHeight;
    }
    return false;
  });
  expect(scrolls).toBe(true);

  // Close is a 44px target, and nothing is drawn past the window's edge.
  const close = await dialog(page).getByRole("link", { name: "Close", exact: true }).boundingBox();
  expect(close!.height).toBeGreaterThanOrEqual(44);
  expect(close!.x + close!.width).toBeLessThanOrEqual(width);
});

test("at 320px nothing of the checkout is cut off, on any step", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);

  const past = () =>
    dialog(page).evaluate((root) =>
      [...root.querySelectorAll("*")]
        .filter((element) => {
          const edges = element.getBoundingClientRect();
          if (edges.width <= 1 || edges.height <= 1) return false;
          const unseen =
            'option, .visually-hidden, ol[aria-label="Steps"], details:not([open]) > :not(summary)';
          if (element.closest(unseen)) return false;
          return edges.right > document.documentElement.clientWidth + 0.5 || edges.left < -0.5;
        })
        .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
    );

  expect(await past()).toEqual([]);
  await toReview(page);
  expect(await past()).toEqual([]);
  await dialog(page)
    .getByRole("checkbox", { name: /I agree to the Terms/ })
    .check();
  await dialog(page).getByRole("button", { name: "Continue to payment" }).click();
  await expect(heading(page, "Payment")).toBeVisible();
  expect(await past()).toEqual([]);
});

test("from 68em the summary is a column beside the form, and the dialog keeps its size between steps", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);

  const panel = dialog(page).locator('[data-order-summary="panel"]');
  await expect(panel).toBeVisible();
  await expect(dialog(page).locator('[data-order-summary="disclosure"]')).toBeHidden();
  const form = await step(page).boundingBox();
  const side = await panel.boundingBox();
  expect(form!.x + form!.width).toBeLessThanOrEqual(side!.x + 1);

  const first = await dialog(page).boundingBox();
  await toReview(page);
  const second = await dialog(page).boundingBox();
  expect(second).toEqual(first);
});

test("a step the visitor moves to settles into place, and under reduced motion it does not move", async ({
  page,
}) => {
  await openPurchase(page, "/purchase?checkout=details");
  await modal(page);
  // The step the dialog opened on is simply there.
  await expect(step(page)).not.toHaveAttribute("data-enter", "");
  await toReview(page);
  await expect(step(page)).toHaveAttribute("data-enter", "");
  await expect(step(page)).toHaveCSS("animation-name", "checkout-step-in");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(step(page)).toHaveCSS("animation-name", "none");
});

test("the pop-up of the catalog is the same dialog, and is not the checkout", async ({ page }) => {
  await page.goto("/catalog?view=change-management-strategy");
  await hydrated(page);

  const popup = page.locator("dialog[data-template-dialog]");
  await expect(popup).toBeVisible();
  await expect(popup).toHaveAttribute("data-page-dialog", "");
  await expect(dialog(page)).toHaveCount(0);
  await expect.poll(() => popup.evaluate((element) => element.matches(":modal"))).toBe(true);
  // It keeps the size its content gives it, and the dimmed page around it.
  const box = await popup.boundingBox();
  expect(box!.x).toBeGreaterThan(0);

  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0, { timeout: NAVIGATION_TIMEOUT });
  await expect(page).toHaveURL(/\/catalog$/);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the Checkout link shows the first step open on the page, with a link that closes it", async ({
    page,
  }) => {
    await page.goto("/purchase");
    await opener(page).click();
    await expect(page).toHaveURL(/\/purchase\?checkout=details$/);

    const popup = dialog(page);
    await expect(popup).toHaveAttribute("open", "");
    await expect(popup.getByRole("heading", { level: 3, name: "Your details" })).toBeVisible();
    await expect(popup.locator("#checkout-fullName")).toBeVisible();
    await expect(popup.getByText(/needs JavaScript/)).toBeVisible();
    // The form cannot put what is typed into the address: its method is the dialog's own.
    await expect(popup.locator("form")).toHaveAttribute("method", "dialog");

    await popup.getByRole("link", { name: "Close", exact: true }).click();
    await expect(page).toHaveURL(/\/purchase$/);
    await expect(dialog(page)).toHaveCount(0);
  });
});
