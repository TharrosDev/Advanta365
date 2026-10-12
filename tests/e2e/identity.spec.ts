import { expect, test, type Page } from "@playwright/test";
import { introSeen } from "./helpers";
import { pageClock } from "./support/ink";

// The look of the site, checked where it is computed: grounds and inks, the two typefaces, the
// landmarks every page shares, and the things the design does without (a second theme, a second
// canvas, blending, a loop, movement that goes on by itself).
//
// The cover of a first visit to the home page has a spec of its own, intro.spec.ts; here every load
// is a later one of its session. The live ink has one too (ink-live.spec.ts, on a graphics card);
// the default projects render in software, where the stills stand in for it.

test.beforeEach(async ({ page }) => {
  await introSeen(page);
});

const ROUTES = [
  "/",
  "/catalog",
  "/phases/prepare",
  "/catalog?view=executive-sponsor-kickoff-deck",
  "/purchase",
  "/about",
  "/sample",
];

// The 404 pages are built in the browser; their server HTML is checked all the same.
const MISSING = ["/nope", "/templates/nope/extra", "/phases/nope"];

// White, black and light blue: the page, the ink and the text on it, the highlighter and its wash,
// the binder.
const PAPER = "rgb(255, 255, 255)";
const INK = "rgb(11, 13, 18)";
const ON_INK = "rgb(255, 255, 255)";
const MARK = "rgb(134, 193, 255)";
const WASH = "rgb(234, 244, 255)";
const BINDER = "rgb(13, 15, 21)";

const BANDS = ["desk", "paper", "wash", "ink", "binder"];

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

    // The page is white paper and the text on it is ink.
    const body = await computed(page, "body", [
      "background-color",
      "color",
      "font-family",
      "letter-spacing",
    ]);
    expect(body["background-color"]).toBe(PAPER);
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

    // One theme, set by nothing on the root element. The state of the cover is the one thing
    // written there, and only on a first visit: this load is not one, so there is no cover (only
    // the home page renders one, and there it is not displayed).
    for (const attribute of ROOT_ATTRIBUTES) {
      await expect(page.locator("html")).not.toHaveAttribute(attribute);
    }
    await expect(page.locator("html")).not.toHaveAttribute("data-intro");
    const cover = page.locator("[data-intro-cover]");
    await expect(cover).toHaveCount(path === "/" ? 1 : 0);
    if (path === "/") await expect(cover).toHaveCSS("display", "none");

    // Every ground is one of the five bands. The binder is the footer alone, black is on the home
    // page and the page about us only, and a page has one wash at most.
    const bands = await page
      .locator("[data-band]")
      .evaluateAll((elements) =>
        elements.map((element) => `${element.localName}:${element.getAttribute("data-band")}`),
      );
    expect(bands.length).toBeGreaterThan(1);
    for (const band of bands) expect(band).toMatch(new RegExp(`:(${BANDS.join("|")})$`));
    expect(bands.filter((band) => band.endsWith(":binder"))).toEqual(["footer:binder"]);
    expect(bands.filter((band) => band.endsWith(":wash")).length).toBeLessThanOrEqual(1);
    const black = bands.filter((band) => band.endsWith(":ink")).length;
    expect(black).toBeLessThanOrEqual(1);
    if (black) expect(["/", "/about"]).toContain(path);

    // Light blue and black are only ever read one way round: the highlighter is never the colour
    // of text, and whatever is written on it is ink.
    const misread = await page.evaluate(
      ([mark, ink]) => {
        const ground = (element: Element): string => {
          for (let node: Element | null = element; node; node = node.parentElement) {
            const fill = getComputedStyle(node).backgroundColor;
            if (fill !== "rgba(0, 0, 0, 0)") return fill;
          }
          return "";
        };
        return [...document.querySelectorAll("body *")]
          .filter((element) =>
            [...element.childNodes].some(
              (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
            ),
          )
          .filter((element) => {
            const colour = getComputedStyle(element).color;
            return colour === mark || (ground(element) === mark && colour !== ink);
          })
          .map((element) => `${element.localName}: ${element.textContent?.trim().slice(0, 40)}`);
      },
      [MARK, INK] as const,
    );
    expect(misread).toEqual([]);

    // At most one canvas, inside an ink slot and hidden from assistive technology (the software
    // renderer of this project has none), and nothing is blended.
    const canvases = await page.locator("canvas").evaluateAll((elements) =>
      elements.map((element) => ({
        inSlot: !!element.closest("[data-ink-slot]"),
        hidden: element.getAttribute("aria-hidden") === "true",
      })),
    );
    expect(canvases.length).toBeLessThanOrEqual(1);
    for (const canvas of canvases) expect(canvas).toEqual({ inSlot: true, hidden: true });
    const blended = await page.evaluate(
      () =>
        [...document.querySelectorAll("*")].filter(
          (element) => getComputedStyle(element).mixBlendMode !== "normal",
        ).length,
    );
    expect(blended).toBe(0);

    // Nothing loops.
    const loops = await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => {
          const iterations = animation.effect?.getComputedTiming().iterations;
          return iterations === Infinity;
        }).length,
    );
    expect(loops).toBe(0);

    // The name is never set larger than 28px, wherever it stands on its own.
    const largestName = await page.evaluate(() => {
      const sizes = [...document.querySelectorAll("body *")]
        .filter((element) => element.childElementCount === 0)
        .filter((element) => element.textContent?.trim() === "Advanta365")
        .map((element) => Number.parseFloat(getComputedStyle(element).fontSize));
      return sizes.length ? Math.max(...sizes) : 0;
    });
    expect(largestName).toBeGreaterThan(0);
    expect(largestName).toBeLessThanOrEqual(28);

    // No product is a box with a border on all four sides: objects are paper, rows are ledgers.
    const boxed = await page.getByRole("article").evaluateAll(
      (cards) =>
        cards.filter((card) => {
          const style = getComputedStyle(card);
          return ["Top", "Right", "Bottom", "Left"].every(
            (side) =>
              Number.parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 &&
              style.getPropertyValue(`border-${side.toLowerCase()}-style`) !== "none",
          );
        }).length,
    );
    expect(boxed).toBe(0);
  });
}

for (const path of [...ROUTES, ...MISSING]) {
  test(`${path} is sent without a canvas`, async ({ request }) => {
    const response = await request.get(path);
    const html = await response.text();
    expect(html.length).toBeGreaterThan(1000);
    expect(html).not.toContain("<canvas");
  });
}

test("band grounds read the same wherever the page is scrolled to", async ({ page }) => {
  // The home page has the most bands: desk, paper, wash, black and the binder.
  await page.goto("/");
  const readGrounds = () =>
    page
      .locator("[data-band]")
      .evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).backgroundColor),
      );

  const first = await readGrounds();
  expect(new Set(first).size).toBeGreaterThanOrEqual(4);
  for (const share of [0.25, 0.5, 0.75, 1]) {
    await page.evaluate((at) => {
      const room = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: room * at, behavior: "instant" });
    }, share);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    expect(await readGrounds()).toEqual(first);
  }
});

for (const path of ["/", "/about", "/catalog"]) {
  test(`${path} is at rest five and a half seconds after it loads`, async ({ page }) => {
    await page.goto(path);
    // The clock is the page's own, from the start of the navigation, and nothing is touched.
    await expect.poll(() => pageClock(page), { timeout: 15_000 }).toBeGreaterThan(5500);
    const moving = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((animation) => animation.timeline === document.timeline)
        .filter((animation) => animation.playState === "running")
        .map((animation) => {
          const target =
            animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
          return `${target?.localName}.${target?.getAttribute("class") ?? ""}`;
        }),
    );
    expect(moving).toEqual([]);
  });
}

test.describe("home", () => {
  test("sets the headline in Besley at 73.9px on a desktop and 40px on a phone", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const wide = await computed(page, "h1", ["font-size", "font-weight", "font-family"]);
    expect(Math.abs(Number.parseFloat(wide["font-size"]) - 73.9)).toBeLessThanOrEqual(0.5);
    expect(wide["font-weight"]).toBe("600");
    expect(wide["font-family"]).toMatch(/^"?Besley"?/);

    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await computed(page, "h1", ["font-size"]);
    expect(Math.abs(Number.parseFloat(narrow["font-size"]) - 40)).toBeLessThanOrEqual(0.5);
  });

  test("puts its last words on the highlighter, in ink", async ({ page }) => {
    await page.goto("/");
    const mark = page.locator("h1 [data-mark]");
    await expect(mark).toHaveCount(1);
    await expect(mark).toHaveText("blank prompt.");
    await expect(mark).toHaveCSS("background-color", MARK);
    await expect(mark).toHaveCSS("color", INK);
  });

  test("runs product first: hero, shelves, the pitch, then the closing", async ({ page }) => {
    await page.goto("/");

    const ids = await page
      .getByRole("main")
      .locator("[id]")
      .evaluateAll((elements) => elements.map((element) => element.id));
    const sections = ["featured", "inside", "problem", "solution", "practice", "values", "closing"];
    expect(ids.filter((id) => sections.includes(id))).toEqual(sections);

    // The hero comes before the first shelf, and the line about Microsoft 365 sits between the
    // last two sections.
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

  test("the hero holds no tally and no caret", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("[data-band]").filter({ has: page.locator("h1") });
    await expect(hero).toHaveCount(1);
    await expect(hero.locator("[data-tally]")).toHaveCount(0);
    await expect(hero.locator("[data-caret]")).toHaveCount(0);
  });

  test("states the answer as a figure, a sentence and a tally of nine and one", async ({
    page,
  }) => {
    await page.goto("/");

    const answer = page.locator("#solution");
    await expect(answer).toHaveAttribute("data-band", "ink");
    await expect(answer.getByRole("heading", { level: 2 })).toHaveText(
      "90% done before you open your AI tool.",
    );
    const blocks = await answer
      .locator("[data-tally] [data-block]")
      .evaluateAll((elements) => elements.map((element) => element.getAttribute("data-block")));
    expect(blocks).toEqual([...Array<string>(9).fill("ink"), "mark"]);
  });

  test("the specimen is decoration, a sheet with a tally of nine and one", async ({
    page,
    isMobile,
  }) => {
    // From 68em the specimen stands in the margin of the shelf; below it is not shown.
    test.skip(isMobile, "the specimen only shows from 68em");
    await page.goto("/");

    const sheet = page.locator("[data-specimen]");
    await expect(sheet).toHaveCount(1);
    await expect(sheet).toHaveAttribute("aria-hidden", "true");
    await expect(sheet.locator("h1, h2, h3, h4, a, button")).toHaveCount(0);
    const blocks = await sheet
      .locator("[data-tally] [data-block]")
      .evaluateAll((elements) => elements.map((element) => element.getAttribute("data-block")));
    expect(blocks).toEqual([...Array<string>(9).fill("ink"), "mark"]);
  });

  test("the main button is solid ink with white text, and the highlighter under the pointer and the keyboard", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");

    const button = page
      .getByRole("main")
      .getByRole("link", { name: "Browse the catalog", exact: true });
    await expect(button).toHaveCSS("background-color", INK);
    await expect(button).toHaveCSS("color", ON_INK);
    await expect(button).toHaveCSS("border-top-width", "2px");
    await expect(button).toHaveCSS("border-top-color", INK);

    // Under the pointer it turns to the highlighter with ink text, inside the same ink border,
    // and back when the pointer leaves. (A phone has no pointer that hovers.)
    if (!isMobile) {
      await button.hover();
      await expect(button).toHaveCSS("background-color", MARK);
      await expect(button).toHaveCSS("color", INK);
      await expect(button).toHaveCSS("border-top-color", INK);
      await page.mouse.move(0, 0);
      await expect(button).toHaveCSS("background-color", INK);
      await expect(button).toHaveCSS("color", ON_INK);
    }

    // Under keyboard focus (a key press first, so that focus moved by script counts as such) it
    // does the same.
    await page.keyboard.press("Tab");
    await button.focus();
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
      .getByRole("link", { name: "Purchase", exact: true });
    await onBinder.focus();
    await expect(onBinder).toHaveCSS("outline-style", "solid");
    await expect(onBinder).toHaveCSS("outline-width", "3px");
    await expect(onBinder).toHaveCSS("outline-color", MARK);
  });
});

test("every link and button shows the 3px focus ring under the keyboard", async ({ page }) => {
  test.slow();
  for (const path of ["/", "/catalog", "/purchase"]) {
    await page.goto(path);
    await page.keyboard.press("Tab");
    const missing = await page.evaluate(() => {
      const found: string[] = [];
      const targets = document.querySelectorAll(
        "header a[href], header button, main a[href], main button, footer a[href]",
      );
      for (const element of targets) {
        if (!(element instanceof HTMLElement)) continue;
        // A disabled button (Checkout, until it is built) takes no keyboard focus, so it has no ring.
        if (element.matches(":disabled")) continue;
        const box = element.getBoundingClientRect();
        if (!box.width || !box.height || getComputedStyle(element).visibility === "hidden")
          continue;
        element.focus();
        // A card or a row is one link: the ring may stand on the row around its words (on the
        // element or on a layer of it that the link lights), not on the words themselves.
        const ring = (node: Element | null) => {
          if (!node) return false;
          return [undefined, "::before", "::after"].some((part) => {
            const look = getComputedStyle(node, part);
            return look.outlineStyle === "solid" && look.outlineWidth === "3px";
          });
        };
        const row = element.closest("article, li");
        if (!ring(element) && !ring(row) && !ring(row?.firstElementChild ?? null)) {
          found.push(`${element.localName}: ${(element.textContent ?? "").trim().slice(0, 30)}`);
        }
      }
      return found;
    });
    expect(missing, path).toEqual([]);
  }
});

test("the footer names the brand once, as plain text no larger than 28px", async ({ page }) => {
  await page.goto("/purchase");

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

test("the menu control stands at the right of the bar", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the Menu button only shows below 68em");
  await page.goto("/catalog");
  const control = page.getByRole("banner").getByRole("button", { name: "Menu", exact: true });
  const box = await control.boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect(box).not.toBeNull();
  // The control that opens the site stands in the right half of the bar, never in the middle.
  expect((box?.x ?? 0) + (box?.width ?? 0) / 2).toBeGreaterThan(width / 2);
});

test("the catalog draws every template as a tile with a printed page, in its own format", async ({
  page,
}) => {
  await page.goto("/catalog");

  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(24);
  await expect(page.getByRole("status")).toHaveCount(1);
  for (const card of await cards.all()) {
    // One control each: the link of a free sample, or the button of a locked template.
    await expect(card.locator("a, button")).toHaveCount(1);
    await expect(card.locator("[data-cover]")).toHaveCount(1);
  }

  // Each page is as wide over high as its format says: a document is a portrait page, a workbook
  // a landscape one, a deck a slide.
  const ratios = { docx: 5 / 7, xlsx: 4 / 3, pptx: 16 / 9 } as const;
  const measured = await cards.locator("[data-cover]").evaluateAll((covers) =>
    covers.map((cover) => {
      const box = cover.getBoundingClientRect();
      return { format: cover.getAttribute("data-format"), ratio: box.width / box.height };
    }),
  );
  const formats = new Set<string>();
  for (const { format, ratio } of measured) {
    expect(format).not.toBeNull();
    formats.add(format ?? "");
    expect(Object.keys(ratios)).toContain(format);
    expect(ratio).toBeCloseTo(ratios[format as keyof typeof ratios], 1);
  }
  expect(formats.size).toBeGreaterThan(1);
});

test("wording the site does not use is not on the pages that carried it", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator("#contact").getByRole("heading", { level: 2 })).toHaveText("Contact");
  await expect(page.getByText(RETIRED_CAPTION)).toHaveCount(0);

  await page.goto("/nope");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  await expect(page.getByText(RETIRED_LABEL)).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Index" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Next", exact: true })).toBeVisible();
});

test("at 320px no page runs past the screen, and the bar's controls and every button are 44px", async ({
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

    const controls = page.getByRole("banner").locator("button").filter({ visible: true });
    expect(await controls.count(), path).toBe(1);
    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      expect(box?.height, path).toBeGreaterThanOrEqual(44);
    }

    // Every button, and every link that is not a phrase in a sentence, is a 44px target. The
    // footer's links are rows of that height whose words are smaller.
    const rows = await page
      .locator("footer nav li")
      .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().height));
    for (const height of rows) expect(height, path).toBeGreaterThanOrEqual(44 - 0.5);
    const small = await page.evaluate(() => {
      const found: string[] = [];
      for (const element of document.querySelectorAll("main button, main a[href]")) {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        if (!box.width || !box.height || style.visibility === "hidden") continue;
        const inSentence = style.display === "inline" && element.closest("p, li, dd, span, small");
        if (inSentence) continue;
        // A link may keep the line height of its words and be a full target through a layer.
        const layer = getComputedStyle(element, "::after");
        const reach = layer.position === "absolute" ? Number.parseFloat(layer.height) : 0;
        const height = Math.max(box.height, Number.isNaN(reach) ? 0 : reach);
        if (height < 44 - 0.5) {
          found.push(
            `${element.localName}: ${(element.textContent ?? "").trim().slice(0, 30)} ${Math.round(height)}px`,
          );
        }
      }
      return found.slice(0, 8);
    });
    expect(small, path).toEqual([]);
  }
});
