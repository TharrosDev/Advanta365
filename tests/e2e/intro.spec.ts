import { expect, test, type Page } from "@playwright/test";
import { NAVIGATION_TIMEOUT } from "./helpers";
import { introAt, introStates, recordIntro } from "./support/ink";

// The cover of a first visit. The first page load of a browser session, if it is the home page,
// opens under a white sheet on which the mark is signed; the page under it is complete all along.
// No other load has it: not a second one, not an inner page, not one with reduced motion, blocked
// storage or no JavaScript. Every test starts a session of its own, so here the first `goto` is a
// first visit.
//
// The default projects render in software, so the ink does not join the cover here and it leaves
// the way it does for a visitor without a graphics card: by itself, in 2.95 seconds. The cover
// with ink is in ink-live.spec.ts. Every time below is read from the page's own clock, so a busy
// machine moves the moment the test asks, not the moment it measures.

declare global {
  interface Window {
    /** What the first press of this page load landed on. */
    introPress?: Promise<"cover" | "page">;
    /** The page clock at the first input of this page load. */
    introInput?: number;
    /** The largest contentful paint of this page load, once the browser has reported one. */
    introPaint?: number;
    /** The cover's opacity on every frame of this page load, with the page clock. */
    introOpacity?: Array<[number, number]>;
  }
}

const HEADLINE = "Don’t start your M365 rollout from a blank prompt.";

const root = (page: Page) => page.locator("html");
const cover = (page: Page) => page.locator("[data-intro-cover]");
const headline = (page: Page) => page.getByRole("heading", { level: 1 });

/** The page clock at the first input of the load, kept from before the first script of the page. */
async function noteInput(page: Page) {
  await page.addInitScript(() => {
    for (const type of ["pointerdown", "keydown", "wheel"]) {
      window.addEventListener(
        type,
        () => {
          window.introInput ??= performance.now();
        },
        { capture: true, once: true, passive: true },
      );
    }
  });
}

/** Keeps the largest contentful paint of the load, from before the first script of the page. */
async function notePaint(page: Page) {
  await page.addInitScript(() => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) window.introPaint = last.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
}

/** Keeps the cover's opacity on every frame of the load, from before the first script of the page. */
async function noteOpacity(page: Page) {
  await page.addInitScript(() => {
    const samples: Array<[number, number]> = [];
    window.introOpacity = samples;
    const frame = () => {
      const element = document.querySelector("[data-intro-cover]");
      if (element) samples.push([performance.now(), Number(getComputedStyle(element).opacity)]);
      if (samples.length < 600) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

/** Resolves once the page clock stands `ms` after the first paint. */
const afterPaint = (page: Page, ms: number) =>
  page.waitForFunction(
    (wanted) => {
      const painted = performance.getEntriesByName("first-paint")[0]?.startTime;
      return painted !== undefined && performance.now() - painted >= wanted;
    },
    ms,
    { polling: 20, timeout: 8_000 },
  );

/**
 * Opens the home page as a first visit and returns as soon as the cover is showing. The page is not
 * waited for: the cover is up from the first paint.
 */
async function firstVisit(page: Page) {
  await recordIntro(page);
  await page.goto("/", { waitUntil: "commit" });
  await expect(cover(page)).toBeVisible();
}

/** The page clock when the attribute went, or null while it is still there. */
const goneAt = (page: Page) =>
  page.evaluate(() => {
    const log = window.__introLog ?? [];
    const last = log[log.length - 1];
    return last && last[1] === null ? last[0] : null;
  });

test("a first visit opens under the cover, with the whole page beneath it", async ({ page }) => {
  await firstVisit(page);

  // The attribute is there before the first paint: it is the first thing the log holds, and the
  // cover is up.
  await expect(root(page)).toHaveAttribute("data-intro", /./);
  expect((await introStates(page))[0]).toBe("play");

  // The cover is decoration over a finished page: hidden from assistive technology, with nothing
  // in it to focus, and the page under it neither hidden nor locked.
  await expect(cover(page)).toHaveAttribute("aria-hidden", "true");
  await expect(cover(page).locator("a, button, input, select, [tabindex]")).toHaveCount(0);
  await expect(cover(page).getByText("Advanta365", { exact: true })).toHaveCount(1);
  await expect(headline(page)).toHaveText(HEADLINE);
  // Under the cover the headline is opaque and painted: it is not waiting to be shown.
  await expect(headline(page)).toHaveCSS("opacity", "1");
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  const main = page.getByRole("main");
  await expect(main).not.toHaveAttribute("inert");
  await expect(main).not.toHaveAttribute("aria-hidden");
  await expect(root(page)).not.toHaveCSS("overflow-y", "hidden");
  await expect(page.locator("body")).not.toHaveCSS("overflow-y", "hidden");
});

test("the cover does not hold back the page: its largest paint is under a second", async ({
  page,
}) => {
  // The first request a server answers after a build is a cold one; the page is asked for once
  // first, so that the number below is the page's and not the server's warming up.
  await page.request.get("/");
  await notePaint(page);
  await firstVisit(page);

  // The browser reports the largest paint once it has one; the headline is painted under the
  // cover, so it is the cover that has to wait for it, not the other way round.
  await expect.poll(() => page.evaluate(() => window.introPaint ?? null)).not.toBeNull();
  const paint = await page.evaluate(() => window.introPaint ?? Infinity);
  expect(paint).toBeLessThan(1000);
});

test("without ink the finished mark is held until 2.5 seconds and the cover is gone by 3.4", async ({
  page,
}) => {
  await noteOpacity(page);
  await firstVisit(page);

  await expect.poll(() => goneAt(page), { timeout: 8_000 }).not.toBeNull();
  const start = await introAt(page, "play");
  const end = await goneAt(page);
  expect(start).not.toBeNull();
  expect(end).not.toBeNull();
  // The cover's own clock starts at the first paint, which a slow start of the page (the network,
  // the first request of a run) moves later than the navigation.
  const painted = await page.evaluate(
    () => performance.getEntriesByName("first-paint")[0]?.startTime ?? 0,
  );
  expect(painted).toBeGreaterThan(0);
  // It leaves from 2500 to 2950 after the paint; a frame or two of a busy machine is allowed.
  expect((end ?? Infinity) - painted).toBeLessThanOrEqual(3400);
  expect((end ?? 0) - painted).toBeGreaterThanOrEqual(2900);

  // Every frame up to 2450 shows the cover whole: nothing fades before its hour. The frames are
  // the page's own, so a busy machine thins them out; it must still have drawn one after 2000.
  const frames = await page.evaluate(() => window.introOpacity ?? []);
  const held = frames.filter(([at]) => at - painted <= 2450);
  expect(held.length).toBeGreaterThan(20);
  expect(held.map(([, opacity]) => opacity).filter((opacity) => opacity < 1)).toEqual([]);
  expect(Math.max(...held.map(([at]) => at - painted))).toBeGreaterThan(2000);
  // And the fade happens: the frames after it are lighter.
  expect(Math.min(...frames.map(([, opacity]) => opacity))).toBeLessThan(0.5);

  // The cover is out of the way, and what is under it can be seen and clicked.
  await expect(cover(page)).toBeHidden();
  await headline(page).click();
  await expect(page).toHaveURL(/\/$/);
  // Playing, then gone: nothing else in between.
  expect(await introStates(page)).toEqual(["play", null]);
});

/**
 * How soon after a press the cover is gone, in milliseconds. Its skip animation takes 200; the
 * rest is the room a busy machine needs between the press and the frame that ends it (402.6 was
 * measured under load).
 */
const SKIP_WITHIN = 500;

test("a click on the cover ends it within 500ms and does not navigate", async ({ page }) => {
  await noteInput(page);
  await firstVisit(page);

  // The middle of the main button of the page, which lies under the cover.
  const button = page
    .locator("[data-band]:has(h1)")
    .getByRole("link", { name: "Get the toolkit", exact: true });
  const box = await button.boundingBox();
  if (!box) throw new Error("the button has no box");
  await page.evaluate(() => {
    window.introPress = new Promise((resolve) => {
      window.addEventListener(
        "pointerdown",
        (event) => {
          const onCover =
            event.target instanceof Element && event.target.closest("[data-intro-cover]");
          resolve(onCover ? "cover" : "page");
        },
        { capture: true, once: true },
      );
    });
  });
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // The press lands on the cover, not on the page under it.
  expect(await page.evaluate(() => window.introPress)).toBe("cover");
  await expect.poll(() => goneAt(page), { timeout: 4_000 }).not.toBeNull();
  const pressed = await page.evaluate(() => window.introInput ?? null);
  expect(pressed).not.toBeNull();
  expect((await goneAt(page)) ?? Infinity).toBeLessThan((pressed ?? 0) + SKIP_WITHIN);

  // A press that began on the cover is not a click on the link under it.
  await expect(headline(page)).toHaveText(HEADLINE);
  await expect(page).toHaveURL(/\/$/);
  await expect(cover(page)).toBeHidden();
  expect(await introStates(page)).toContain("leave");
});

test("a key press ends it within 500ms", async ({ page }) => {
  await noteInput(page);
  await firstVisit(page);

  await page.keyboard.press("Shift");
  await expect.poll(() => goneAt(page), { timeout: 4_000 }).not.toBeNull();
  const pressed = await page.evaluate(() => window.introInput ?? null);
  expect(pressed).not.toBeNull();
  expect((await goneAt(page)) ?? Infinity).toBeLessThan((pressed ?? 0) + SKIP_WITHIN);
  expect(await introStates(page)).toEqual(["play", "leave", null]);
  await headline(page).click();
  await expect(page).toHaveURL(/\/$/);
});

for (const at of [500, 1500]) {
  test(`a key press ${at}ms in ends it within 500ms`, async ({ page }) => {
    await noteInput(page);
    await firstVisit(page);

    // 500 is in the middle of the writing, 1500 in the hold of the finished mark (it runs to 2500).
    await afterPaint(page, at);
    expect(await introStates(page)).toEqual(["play"]);
    await page.keyboard.press("Shift");
    await expect.poll(() => goneAt(page), { timeout: 4_000 }).not.toBeNull();
    const pressed = await page.evaluate(() => window.introInput ?? null);
    expect(pressed).not.toBeNull();
    expect((await goneAt(page)) ?? Infinity).toBeLessThan((pressed ?? 0) + SKIP_WITHIN);
    expect(await introStates(page)).toEqual(["play", "leave", null]);
    await headline(page).click();
    await expect(page).toHaveURL(/\/$/);
  });
}

test("the wheel ends it and scrolls the page: nothing is locked", async ({ page }) => {
  await firstVisit(page);

  // A phone has no wheel, but the page answers one all the same.
  await page.mouse.move(100, 100);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => goneAt(page), { timeout: 4_000 }).not.toBeNull();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test("a reload in the same session has no cover", async ({ page }) => {
  await firstVisit(page);
  await expect.poll(() => goneAt(page), { timeout: 8_000 }).not.toBeNull();

  await page.reload();
  await expect(headline(page)).toBeVisible();
  await expect(cover(page)).toBeHidden();
  await expect(root(page)).not.toHaveAttribute("data-intro");
  // The list starts again with each load: the root element is not marked on this one.
  expect(await introStates(page)).toEqual([]);
});

test("an inner page has no cover, and neither has the home page in a session that started there", async ({
  page,
}) => {
  await recordIntro(page);
  await page.goto("/purchase");
  await expect(headline(page)).toHaveText("Purchase");
  await expect(cover(page)).toHaveCount(0);
  await expect(root(page)).not.toHaveAttribute("data-intro");
  expect(await introStates(page)).toEqual([]);

  // Home by the brand link: a change of page, not a load.
  await page.getByRole("banner").getByRole("link", { name: "Advanta365", exact: true }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(headline(page)).toHaveText(HEADLINE);
  await expect(cover(page)).toHaveCount(1);
  await expect(cover(page)).toBeHidden();
  expect(await introStates(page)).toEqual([]);

  // And loaded outright: still not the first load of the session.
  await page.reload();
  await expect(headline(page)).toHaveText(HEADLINE);
  await expect(cover(page)).toBeHidden();
  expect(await introStates(page)).toEqual([]);
});

test("with reduced motion there is no cover", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await recordIntro(page);
  await page.goto("/");

  await expect(headline(page)).toBeVisible();
  await expect(cover(page)).toBeHidden();
  await expect(root(page)).not.toHaveAttribute("data-intro");
  expect(await introStates(page)).toEqual([]);
  await headline(page).click();
});

test("with storage blocked there is no cover", async ({ page }) => {
  // A browser that refuses storage cannot remember that the cover played, so it never plays it.
  await page.addInitScript(() => {
    const refuse = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    Object.defineProperty(window, "sessionStorage", { get: refuse, configurable: true });
    Object.defineProperty(window, "localStorage", { get: refuse, configurable: true });
  });
  await recordIntro(page);
  await page.goto("/");

  await expect(headline(page)).toBeVisible();
  await expect(cover(page)).toBeHidden();
  await expect(root(page)).not.toHaveAttribute("data-intro");
  expect(await introStates(page)).toEqual([]);
  await headline(page).click();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("there is no cover", async ({ page }) => {
    await page.goto("/");
    await expect(headline(page)).toHaveText(HEADLINE);
    await expect(root(page)).not.toHaveAttribute("data-intro");
    await expect(cover(page)).toBeHidden();
    await headline(page).click();
  });
});
