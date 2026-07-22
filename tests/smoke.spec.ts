import { test, expect, type Page } from "@playwright/test";

const SECTION_IDS = [
  "top",
  "problem",
  "framework",
  "delivery",
  "modules",
  "platforms",
  "adoption",
  "why",
  "contact",
];

const collectErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", err => errors.push(String(err)));
  return errors;
};

test.describe("Home", () => {
  test("happy path — renders every section with no console errors", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    for (const id of SECTION_IDS) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
    expect(errors).toEqual([]);
  });

  test("content is revealed after scrolling a section into view", async ({
    page,
  }) => {
    await page.goto("/");
    const card = page.locator(".fault-node").first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();
    // The reveal tween must land at full opacity, not leave content hidden.
    await expect
      .poll(async () =>
        card.evaluate(el => Number(getComputedStyle(el).opacity))
      )
      .toBeGreaterThan(0.95);
  });

  test("page never scrolls horizontally", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });

  test("desktop nav anchor click scrolls to the section", async ({ page }) => {
    test.skip(
      (test.info().project.name ?? "") !== "desktop",
      "desktop-only nav links"
    );
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Framework" })
      .click();
    await expect(page).toHaveURL(/#framework$/);
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const el = document.getElementById("framework");
          return el ? Math.abs(el.getBoundingClientRect().top) : Infinity;
        })
      )
      .toBeLessThan(200);
  });
});

test.describe("Mobile menu", () => {
  test.skip(
    ({ isMobile }) => !isMobile,
    "menu toggle only exists below the lg breakpoint"
  );

  test("happy path — opens, traps focus, closes on Escape", async ({
    page,
  }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();
    // First link receives focus when the panel opens.
    await expect(dialog.getByRole("link").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    // Focus returns to the (now "Open menu") toggle.
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  });

  test("menu link closes the panel and reaches the section", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await dialog.getByRole("link", { name: "Contact" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/#contact$/);
    // Scroll lock must be released so the page actually travels.
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(100);
  });
});

test.describe("Contact page", () => {
  test("renders with safe external booking link", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/contact");
    await expect(
      page.getByRole("heading", { name: "Get in touch." })
    ).toBeVisible();
    const booking = page.getByRole("link", { name: "Book a call" });
    await expect(booking).toHaveAttribute("target", "_blank");
    await expect(booking).toHaveAttribute("rel", /noopener/);
    expect(errors).toEqual([]);
  });
});

test.describe("Error handling", () => {
  test("unknown route serves the styled 404", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-page");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Not found." })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to home" })
    ).toBeVisible();
  });
});

test.describe("Hardening", () => {
  test("security headers are served", async ({ request }) => {
    const res = await request.get("/");
    const headers = res.headers();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'"
    );
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("structured data ships as real ld+json in the static HTML", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();
    const matches = [
      ...html.matchAll(
        /<script type="application\/ld\+json">(.*?)<\/script>/gs
      ),
    ];
    expect(matches.length).toBeGreaterThanOrEqual(2);
    const types = matches.flatMap(m => {
      const graph = JSON.parse(m[1]);
      return (graph["@graph"] ?? [graph]).map(
        (node: { "@type": string }) => node["@type"]
      );
    });
    expect(types).toEqual(
      expect.arrayContaining(["Organization", "WebSite", "WebPage", "Service"])
    );
  });

  test("content is fully visible without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    // Without the .js flag no reveal start-state applies — headings readable.
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const opacity = await page
      .locator("[data-reveal]")
      .first()
      .evaluate(el => Number(getComputedStyle(el).opacity));
    expect(opacity).toBe(1);
    await context.close();
  });
});
