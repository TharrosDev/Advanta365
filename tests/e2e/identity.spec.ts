import { expect, test, type Page } from "@playwright/test";

// The look of the site, checked where it is computed: grounds and inks, the two typefaces, the
// landmarks every page shares, and the things the design does without (a second theme, anything
// drawn by script, blending, movement that starts by itself outside the hero sheet).

const ROUTES = [
  "/",
  "/catalog",
  "/phases/prepare",
  "/templates/executive-sponsor-kickoff-deck",
  "/bundles",
  "/bundles/sponsor-essentials",
  "/pricing",
  "/about",
  "/sample",
  "/contact",
  "/cart",
];

const DESK = "rgb(240, 243, 234)";
const INK = "rgb(18, 48, 34)";
const MARK = "rgb(244, 234, 82)";
const WASH = "rgb(249, 247, 192)";
const BINDER = "rgb(20, 56, 42)";

// Attributes the root element never carries. The names are put together here, so that this file
// does not contain them.
const ROOT_ATTRIBUTES = ["theme", "entry", "entry-brand", "entry-lock"].map(
  (name) => `data-${name}`,
);

// Wording the site does not use. Written in parts for the same reason.
const RETIRED_CAPTION = ["For general", "questions"].join(" ");
const RETIRED_LABEL = ["Error", "404"].join(" ");

/** A computed letter-spacing as a number of pixels ("normal" is 0). */
const tracking = (value: string) => (value === "normal" ? 0 : Number.parseFloat(value));

/** The computed style values of the first element that matches a selector. */
async function computed<const Names extends readonly string[]>(
  page: Page,
  selector: string,
  names: Names,
): Promise<Record<Names[number], string>> {
  return page
    .locator(selector)
    .first()
    .evaluate((element, properties) => {
      const style = getComputedStyle(element);
      return Object.fromEntries(properties.map((name) => [name, style.getPropertyValue(name)]));
    }, names) as Promise<Record<Names[number], string>>;
}

for (const path of ROUTES) {
  test(`${path} has the grounds, the faces and the landmarks of the design`, async ({ page }) => {
    await page.goto(path);

    // One of each landmark, one h1, and the one navigation that lists the phases by that name.
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Rollout phases", exact: true })).toHaveCount(
      1,
    );

    // The desk and the ink.
    const body = await computed(page, "body", [
      "background-color",
      "color",
      "font-family",
      "letter-spacing",
    ]);
    expect(body["background-color"]).toBe(DESK);
    expect(body.color).toBe(INK);

    // Atkinson Hyperlegible Next speaks for the store, Besley for the documents.
    expect(body["font-family"]).toMatch(/^"?Atkinson Hyperlegible Next"?/);
    const heading = await computed(page, "h1", ["font-family", "font-weight", "letter-spacing"]);
    expect(heading["font-family"]).toMatch(/^"?Besley"?/);
    expect(heading["font-weight"]).toBe("600");

    // Nothing is tracked in.
    expect(tracking(body["letter-spacing"])).toBeGreaterThanOrEqual(0);
    expect(tracking(heading["letter-spacing"])).toBeGreaterThanOrEqual(0);

    // The bar is a sticky sheet with no line under it; the footer is the binder.
    await expect(page.getByRole("banner")).toHaveCSS("position", "sticky");
    await expect(page.getByRole("banner")).toHaveCSS("border-bottom-width", "0px");
    await expect(page.getByRole("contentinfo")).toHaveCSS("background-color", BINDER);

    // One theme, set by nothing on the root element.
    for (const attribute of ROOT_ATTRIBUTES) {
      await expect(page.locator("html")).not.toHaveAttribute(attribute);
    }

    // Every surface is one of the four bands, and the binder is the footer alone.
    const bands = await page
      .locator("[data-band]")
      .evaluateAll((elements) =>
        elements.map((element) => `${element.localName}:${element.getAttribute("data-band")}`),
      );
    expect(bands.length).toBeGreaterThan(1);
    for (const band of bands) expect(band).toMatch(/:(desk|paper|wash|binder)$/);
    expect(bands.filter((band) => band.endsWith(":binder"))).toEqual(["footer:binder"]);
    expect(bands.filter((band) => band.endsWith(":wash")).length).toBeLessThanOrEqual(1);

    // Graphics are HTML, CSS and inline SVG, and nothing is blended.
    await expect(page.locator("canvas")).toHaveCount(0);
    const blended = await page.evaluate(
      () =>
        [...document.querySelectorAll("*")].filter(
          (element) => getComputedStyle(element).mixBlendMode !== "normal",
        ).length,
    );
    expect(blended).toBe(0);

    // Nothing starts moving by itself, except the tally and the caret of the hero sheet.
    const strays = await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => {
          const target =
            animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
          return !target?.closest("[data-hero-sheet]");
        }).length,
    );
    expect(strays).toBe(0);
  });
}

test.describe("home", () => {
  test("sets the headline in Besley at 56px on a desktop and 34px on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const wide = await computed(page, "h1", ["font-size", "font-weight"]);
    expect(Number.parseFloat(wide["font-size"])).toBeCloseTo(56, 0);
    expect(wide["font-weight"]).toBe("600");

    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await computed(page, "h1", ["font-size"]);
    expect(Number.parseFloat(narrow["font-size"])).toBeCloseTo(34, 0);
  });

  test("runs product first: hero, shelves, the pitch, then the closing sheet", async ({ page }) => {
    await page.goto("/");

    const ids = await page
      .getByRole("main")
      .locator("[id]")
      .evaluateAll((elements) => elements.map((element) => element.id));
    const sections = [
      "featured",
      "inside",
      "bundles",
      "problem",
      "solution",
      "practice",
      "values",
      "closing",
    ];
    expect(ids.filter((id) => sections.includes(id))).toEqual(sections);

    // The hero comes before the first shelf, and the product row sits between the last two.
    const order = await page.getByRole("main").evaluate((main) => {
      const follows = (first: Element | null, second: Element | null) =>
        !!first &&
        !!second &&
        (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      const builtFor = [...main.querySelectorAll("p")].find(
        (paragraph) => paragraph.textContent === "Built for Microsoft 365",
      );
      return {
        heroFirst: follows(main.querySelector("h1"), main.querySelector("#featured")),
        afterValues: follows(main.querySelector("#values"), builtFor ?? null),
        beforeClosing: follows(builtFor ?? null, main.querySelector("#closing")),
      };
    });
    expect(order).toEqual({ heroFirst: true, afterValues: true, beforeClosing: true });

    // The one wash band of the page.
    await expect(page.locator("#practice")).toHaveCSS("background-color", WASH);
  });

  test("the hero sheet is decoration, and its fill and blink are over within five seconds", async ({
    page,
  }) => {
    await page.goto("/");

    const sheet = page.locator("[data-hero-sheet]");
    await expect(sheet).toHaveCount(1);
    await expect(sheet).toHaveAttribute("aria-hidden", "true");
    await expect(sheet.locator("h1, h2, h3, h4, a, button")).toHaveCount(0);
    await expect(sheet.locator("[data-tally] [data-block]")).toHaveCount(10);
    await expect(sheet.locator("[data-blank] [data-caret]")).toHaveCount(1);

    // Each block fills once and the caret blinks three times. Read from the styles (a delay, then
    // the duration as many times as it repeats), the last of them ends within five seconds of the
    // first paint, however busy the machine that runs this is.
    const sequence = await sheet.locator("[data-block], [data-caret]").evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        const seconds = (value: string) =>
          Number.parseFloat(value) * (value.endsWith("ms") ? 0.001 : 1);
        return {
          name: style.animationName,
          end:
            seconds(style.animationDelay) +
            seconds(style.animationDuration) * Number(style.animationIterationCount),
        };
      }),
    );
    expect(sequence).toHaveLength(11);
    for (const step of sequence) {
      expect(step.name).not.toBe("none");
      expect(step.end).toBeGreaterThan(0);
      expect(step.end).toBeLessThanOrEqual(5);
    }

    // Brought to their end, every block and the caret are in their drawn state.
    await page.evaluate(() => {
      for (const animation of document.getAnimations()) animation.finish();
    });
    await expect(sheet.locator('[data-block="mark"]')).toHaveCSS("background-color", MARK);
    await expect(sheet.locator('[data-block="ink"]').first()).toHaveCSS("background-color", INK);
    await expect(sheet.locator("[data-caret]")).toHaveCSS("opacity", "1");
  });

  test("states the answer as a figure, a sentence and a tally of nine and one", async ({
    page,
  }) => {
    await page.goto("/");

    const answer = page.locator("#solution");
    await expect(answer.getByRole("heading", { level: 2 })).toHaveText(
      "90% done before you open your AI tool.",
    );
    const blocks = await answer
      .locator("[data-tally] [data-block]")
      .evaluateAll((elements) => elements.map((element) => element.getAttribute("data-block")));
    expect(blocks).toEqual([...Array<string>(9).fill("ink"), "mark"]);
  });

  test("the main button is the highlighter with ink text and a 2px ink border", async ({
    page,
  }) => {
    await page.goto("/");

    const button = page
      .getByRole("main")
      .getByRole("link", { name: "Browse the catalog", exact: true });
    await expect(button).toHaveCSS("background-color", MARK);
    await expect(button).toHaveCSS("color", INK);
    await expect(button).toHaveCSS("border-top-width", "2px");
    await expect(button).toHaveCSS("border-top-color", INK);
  });

  test("the focus ring is 3px of ink on the page and of highlighter on the binder", async ({
    page,
  }) => {
    await page.goto("/");
    // A key press first, so that focus moved by script counts as keyboard focus.
    await page.keyboard.press("Tab");

    const onPage = page.getByRole("main").getByRole("link", { name: "See a sample", exact: true });
    await onPage.focus();
    await expect(onPage).toHaveCSS("outline-style", "solid");
    await expect(onPage).toHaveCSS("outline-width", "3px");
    await expect(onPage).toHaveCSS("outline-color", INK);

    const onBinder = page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Pricing", exact: true });
    await onBinder.focus();
    await expect(onBinder).toHaveCSS("outline-style", "solid");
    await expect(onBinder).toHaveCSS("outline-width", "3px");
    await expect(onBinder).toHaveCSS("outline-color", MARK);
  });
});

test("the footer names the brand once, as plain text no larger than 28px", async ({ page }) => {
  await page.goto("/pricing");

  const footer = page.getByRole("contentinfo");
  const largest = await footer.evaluate((element) =>
    Math.max(
      ...[...element.querySelectorAll("*")].map((child) =>
        Number.parseFloat(getComputedStyle(child).fontSize),
      ),
    ),
  );
  expect(largest).toBeLessThanOrEqual(28);

  // The name beside the mark is one unbroken word in one element.
  const names = await footer
    .locator("span")
    .evaluateAll(
      (spans) =>
        spans.filter((span) => span.childElementCount === 0 && span.textContent === "Advanta365")
          .length,
    );
  expect(names).toBe(1);
});

test("the catalog draws every template as a file on a 3:2 cover", async ({ page }) => {
  await page.goto("/catalog");

  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(24);
  await expect(page.getByRole("status")).toHaveCount(1);

  const covers = cards.locator('svg[viewBox="0 0 300 200"]');
  await expect(covers).toHaveCount(24);
  const ratios = await covers.evaluateAll((drawings) =>
    drawings.map((drawing) => {
      const box = drawing.getBoundingClientRect();
      return box.width / box.height;
    }),
  );
  for (const ratio of ratios) expect(ratio).toBeCloseTo(1.5, 1);
});

test("wording the site does not use is not on the pages that carried it", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact");
  await expect(page.getByText(RETIRED_CAPTION)).toHaveCount(0);

  await page.goto("/nope");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  await expect(page.getByText(RETIRED_LABEL)).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Index" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Next", exact: true })).toBeVisible();
});

test("at 320px no page runs past the screen and the bar's controls are 44px tall", async ({
  page,
}) => {
  // Eleven page loads in one test.
  test.slow();
  await page.setViewportSize({ width: 320, height: 640 });

  for (const path of ROUTES) {
    await page.goto(path);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);

    // The frame clips sideways, which hides an element that sticks out from the measure above:
    // check the edges of everything that takes up room on the page.
    const outside = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      return [...document.querySelectorAll("header *, main *, footer *")]
        .filter((element) => {
          const box = element.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) return false;
          return box.left < -0.5 || box.right > width + 0.5;
        })
        .map((element) => `${element.localName}.${element.getAttribute("class") ?? ""}`)
        .slice(0, 5);
    });
    expect(outside, path).toEqual([]);

    const controls = page
      .getByRole("banner")
      .locator("a[href='/cart'], button")
      .filter({ visible: true });
    expect(await controls.count(), path).toBe(2);
    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      expect(box?.height, path).toBeGreaterThanOrEqual(44);
    }
  }
});
