import { expect, test, type Page } from "@playwright/test";
import { introSeen, NAVIGATION_TIMEOUT } from "./helpers";

// The motion system: entrances that follow the scroll, the ninety that fills as its band goes by,
// and the change of page that carries a sheet or a folder across. Each of them has two paths, one
// with view timelines (Chromium) and one without (the observer of `MotionRoot`, Firefox). The
// second is exercised here in every browser by stubbing the one question the boot script asks,
// `CSS.supports("animation-timeline: view()")`, and for real by the firefox project where it starts.

test.beforeEach(async ({ page }) => {
  await introSeen(page);
});

/** Answers "no" to the support question for view timelines, before any script of the page runs. */
async function withoutTimelines(page: Page) {
  await page.addInitScript(() => {
    const supports = CSS.supports.bind(CSS);
    CSS.supports = ((property: string, value?: string) => {
      if (property.includes("animation-timeline")) return false;
      return value === undefined ? supports(property) : supports(property, value);
    }) as typeof CSS.supports;
  });
}

declare global {
  interface Window {
    /** Calls of `document.startViewTransition` and the groups of the transitions that started. */
    __vt?: { calls: number; groups: string[] };
  }
}

/** Counts view transitions and records the groups each one animates. */
async function watchTransitions(page: Page) {
  await page.addInitScript(() => {
    const record = { calls: 0, groups: [] as string[] };
    window.__vt = record;
    const original = document.startViewTransition;
    if (typeof original !== "function") return;
    document.startViewTransition = function (this: Document, ...args: Parameters<typeof original>) {
      record.calls += 1;
      const transition = Reflect.apply(original, this, args) as ViewTransition;
      transition.ready
        .then(() => {
          for (const animation of document.getAnimations()) {
            const effect = animation.effect as KeyframeEffect | null;
            const name = effect?.pseudoElement ?? "";
            const match = /^::view-transition-group\((.+)\)$/.exec(name);
            if (match?.[1]) record.groups.push(match[1]);
          }
        })
        .catch(() => undefined);
      return transition;
    } as typeof original;
  });
}

const transitions = (page: Page) =>
  page.evaluate(() => window.__vt ?? { calls: -1, groups: [] as string[] });

// ---------------------------------------------------------------------------------------------
// Entrances
// ---------------------------------------------------------------------------------------------
async function entrance(page: Page) {
  await page.goto("/");
  // The entrances are armed once the page has hydrated: from then on an element below the fold
  // waits to be shown.
  await expect(page.locator("html")).toHaveAttribute("data-io", "armed");

  // An element that waits below the fold, marked so that it can be found again.
  const marked = await page.evaluate(() => {
    const below = [...document.querySelectorAll<HTMLElement>("[data-move]")].find((element) => {
      const box = element.getBoundingClientRect();
      return box.top > window.innerHeight + 300 && getComputedStyle(element).opacity !== "1";
    });
    below?.setAttribute("data-probe", "");
    return !!below;
  });
  expect(marked).toBe(true);

  const probe = page.locator("[data-probe]");
  await expect(probe).toHaveCSS("opacity", "0");

  // Scrolled to the middle of the window it is drawn: nothing is left transparent.
  await probe.evaluate((element) => {
    const box = element.getBoundingClientRect();
    window.scrollTo({
      top: window.scrollY + box.top - window.innerHeight / 2,
      behavior: "instant",
    });
  });
  await expect(probe).toHaveCSS("opacity", "1", { timeout: 5_000 });
  await expect(probe).toHaveCSS("filter", "none");
}

test("an entrance below the fold is transparent until it is scrolled in, with view timelines", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "view timelines are the Chromium path");
  await entrance(page);
  await expect(page.locator("html")).toHaveAttribute("data-timeline", "on");
});

test("an entrance below the fold is transparent until it is scrolled in, without them", async ({
  page,
}) => {
  await withoutTimelines(page);
  await entrance(page);
  await expect(page.locator("html")).not.toHaveAttribute("data-timeline");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
});

// ---------------------------------------------------------------------------------------------
// The ninety
// ---------------------------------------------------------------------------------------------
/** How many blocks of the tally are filled and which place the odometer's wheel stands at. */
const ninety = (page: Page) =>
  page.evaluate(() => {
    const band = document.querySelector("#solution");
    const blocks = [...(band?.querySelectorAll("[data-tally] [data-block]") ?? [])];
    const filled = blocks.filter(
      (block) => getComputedStyle(block).backgroundColor !== "rgba(0, 0, 0, 0)",
    ).length;
    const wheel = band?.querySelector("[data-odometer-wheel]");
    const glyph = wheel?.firstElementChild?.getBoundingClientRect().height || 1;
    const shift = Number.parseFloat(
      wheel ? (getComputedStyle(wheel).translate.split(" ")[1] ?? "0") : "0",
    );
    // (A wheel at rest has a shift of zero, which negated is -0: "|| 0" says it plainly.)
    return { filled, total: blocks.length, place: Math.round((-shift / glyph) * 100) / 100 || 0 };
  });

/** Scrolls so that a share of the band has gone through the window: 0 as it enters, 1 as it leaves. */
const scrollBand = (page: Page, share: number) =>
  page.evaluate((at) => {
    const band = document.querySelector("#solution");
    if (!band) return;
    const box = band.getBoundingClientRect();
    const top = box.top + window.scrollY;
    window.scrollTo({
      top: top - window.innerHeight + at * (box.height + window.innerHeight),
      behavior: "instant",
    });
  }, share);

test("scrolling the ninety through the window fills its tally and rolls its figure, with view timelines", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "view timelines are the Chromium path");
  await page.goto("/");

  // Before the band is on screen nothing is filled and the wheel stands at the blank.
  expect(await ninety(page)).toEqual({ filled: 0, total: 10, place: 0 });

  // Through the window in steps: the fill never goes back while the page goes forward, and it ends
  // with all ten blocks (nine of ink, the marked one) and the figure at nine.
  let last = { filled: 0, place: 0 };
  for (const share of [0.15, 0.3, 0.45, 0.6, 0.75]) {
    await scrollBand(page, share);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const now = await ninety(page);
    expect(now.filled).toBeGreaterThanOrEqual(last.filled);
    expect(now.place).toBeGreaterThanOrEqual(last.place);
    last = now;
  }
  await expect.poll(() => ninety(page)).toEqual({ filled: 10, total: 10, place: 9 });

  // And it runs back as the band goes out of the window the way it came.
  await scrollBand(page, 0);
  await expect.poll(() => ninety(page)).toEqual({ filled: 0, total: 10, place: 0 });
});

test("scrolling the ninety into the window fills its tally and rolls its figure, without them", async ({
  page,
}) => {
  await withoutTimelines(page);
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-timeline");

  expect(await ninety(page)).toEqual({ filled: 0, total: 10, place: 0 });

  // Once the band is seen it fills by the clock, one block after another, and the wheel rolls.
  await scrollBand(page, 0.5);
  await expect(page.locator("#solution")).toHaveAttribute("data-seen", /.*/);
  await expect
    .poll(() => ninety(page), { timeout: 8_000 })
    .toEqual({ filled: 10, total: 10, place: 9 });
});

// ---------------------------------------------------------------------------------------------
// The change of page
// ---------------------------------------------------------------------------------------------
test("a change of page runs a view transition", async ({ page, browserName }) => {
  test.skip(browserName === "firefox", "the browser has no view transitions to run");
  await watchTransitions(page);
  await page.goto("/catalog");
  expect((await transitions(page)).calls).toBe(0);

  await page.getByRole("contentinfo").getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect.poll(async () => (await transitions(page)).calls).toBeGreaterThanOrEqual(1);
});

test("a change of page still works where the browser has no view transitions", async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(document, "startViewTransition");
    Object.defineProperty(Document.prototype, "startViewTransition", {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto("/catalog");
  expect(await page.evaluate(() => typeof document.startViewTransition)).toBe("undefined");

  await page.getByRole("contentinfo").getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Proven change content/);
});

test("a filter change on the catalog starts no view transition", async ({ page, browserName }) => {
  test.skip(browserName === "firefox", "the browser has no view transitions to run");
  await watchTransitions(page);
  await page.goto("/catalog");

  // On narrow screens the filters live in a dialog behind a button.
  const open = page.getByRole("button", { name: /^Filters/ });
  if (await open.isVisible()) await open.click();
  await page
    .getByRole("checkbox", { name: /^Training/ })
    .filter({ visible: true })
    .check();
  await expect(page).toHaveURL(/type=training/);

  // The results changed under the same address: a view transition would have flown them.
  await expect(page.getByRole("status")).toBeVisible();
  expect((await transitions(page)).calls).toBe(0);
});

test("a click on a catalog row runs a view transition with a group named for its cover", async ({
  page,
  browserName,
}) => {
  test.skip(browserName === "firefox", "the browser has no view transitions to run");
  await watchTransitions(page);
  await page.goto("/catalog");

  const row = page.getByRole("article").first();
  const link = row.getByRole("link");
  const slug = (await link.getAttribute("href"))?.split("/").pop();
  expect(slug).toBeTruthy();
  await link.click();

  await expect(page).toHaveURL(new RegExp(`/templates/${slug}$`), { timeout: NAVIGATION_TIMEOUT });
  await expect.poll(async () => (await transitions(page)).groups).toContain(`cover-${slug}`);
});
