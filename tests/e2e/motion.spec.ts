import { expect, test, type Page } from "@playwright/test";
import { hydrated, introSeen, NAVIGATION_TIMEOUT } from "./helpers";

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
/** How many blocks of the tally are filled, and what the figure reads. */
const ninety = (page: Page) =>
  page.evaluate(() => {
    const band = document.querySelector("#solution");
    const blocks = [...(band?.querySelectorAll("[data-tally] [data-block]") ?? [])];
    const filled = blocks.filter(
      (block) => getComputedStyle(block).backgroundColor !== "rgba(0, 0, 0, 0)",
    ).length;
    const figure = band?.querySelector(".type-poster")?.textContent?.trim() ?? null;
    return { filled, total: blocks.length, figure };
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

test("scrolling the ninety through the window fills its tally under a figure that never moves, with view timelines", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "view timelines are the Chromium path");
  await page.goto("/");

  // Before the band is on screen nothing is filled, and the figure already reads its value.
  expect(await ninety(page)).toEqual({ filled: 0, total: 10, figure: "90%" });

  // Through the window in steps: the fill never goes back while the page goes forward, it ends
  // with all ten blocks (nine of ink, the marked one), and the figure reads 90% at every step.
  let last = 0;
  for (const share of [0.15, 0.3, 0.45, 0.6, 0.75]) {
    await scrollBand(page, share);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const now = await ninety(page);
    expect(now.filled).toBeGreaterThanOrEqual(last);
    expect(now.figure).toBe("90%");
    last = now.filled;
  }
  await expect.poll(() => ninety(page)).toEqual({ filled: 10, total: 10, figure: "90%" });

  // And it runs back as the band goes out of the window the way it came.
  await scrollBand(page, 0);
  await expect.poll(() => ninety(page)).toEqual({ filled: 0, total: 10, figure: "90%" });
});

test("scrolling the ninety into the window fills its tally under a figure that never moves, without them", async ({
  page,
}) => {
  await withoutTimelines(page);
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-timeline");

  expect(await ninety(page)).toEqual({ filled: 0, total: 10, figure: "90%" });

  // Once the band is seen it fills by the clock, one block after another.
  await scrollBand(page, 0.5);
  await expect(page.locator("#solution")).toHaveAttribute("data-seen", /.*/);
  expect((await ninety(page)).figure).toBe("90%");
  await expect
    .poll(() => ninety(page), { timeout: 8_000 })
    .toEqual({ filled: 10, total: 10, figure: "90%" });
});

/** What the three counts of `#inside` read: their text, each time it is asked. */
const insideCounts = (page: Page) =>
  page
    .locator("#inside h3")
    .evaluateAll((headings) =>
      headings.slice(0, 3).map((heading) => heading.textContent?.trim() ?? ""),
    );

test("the counts of what is inside read their own values all the way in", async ({ page }) => {
  await page.goto("/");
  const final = await insideCounts(page);
  expect(final).toEqual([
    expect.stringMatching(/^\d+ playbooks$/),
    expect.stringMatching(/^\d+ ready-to-use templates$/),
    expect.stringMatching(/^\d+ field guides$/),
  ]);

  // Down to the ledger in small steps: at no step does a count read anything but its value.
  const top = await page.locator("#inside").evaluate((band) => band.getBoundingClientRect().top);
  for (let y = 0; y <= top + 400; y += 200) {
    await page.evaluate((at) => window.scrollTo({ top: at, behavior: "instant" }), y);
    expect(await insideCounts(page)).toEqual(final);
  }
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
  await hydrated(page);

  // On narrow screens the filters live in a dialog behind a button.
  const open = page.getByRole("button", { name: /^Filters/ });
  if (await open.isVisible()) await open.click();
  await page
    .getByRole("checkbox", { name: /^Training/ })
    .filter({ visible: true })
    .check();
  await expect(page).toHaveURL(/type=training/, { timeout: NAVIGATION_TIMEOUT });

  // The results changed under the same address: a view transition would have flown them.
  await expect(page.locator("#results-heading")).toBeVisible();
  expect((await transitions(page)).calls).toBe(0);
});

test("opening a free sample in the pop-up is a change inside the page: no view transition", async ({
  page,
}) => {
  await watchTransitions(page);
  await page.goto("/catalog");
  await hydrated(page);

  await page.locator("[data-tile][data-free]").first().getByRole("link").click();
  await expect(page).toHaveURL(/[?&]view=[a-z0-9-]+$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.locator("dialog[open]")).toBeVisible();

  // The catalog stayed where it was under the dialog: nothing of the page left or arrived.
  expect((await transitions(page)).calls).toBe(0);
});
