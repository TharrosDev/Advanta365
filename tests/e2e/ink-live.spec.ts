import { expect, test, type Page } from "@playwright/test";
import { introSeen, NAVIGATION_TIMEOUT } from "./helpers";
import {
  BINDER,
  PAPER,
  backdropState,
  canvasPixel,
  canvases,
  collectProblems,
  inkMode,
  inkedPixels,
  introAt,
  pageClock,
  recordIntro,
  scrollToElement,
  scrollToEnd,
  withInkTest,
} from "./support/ink";

// The live ink, on a graphics card (the `gpu` project; headless Chromium gets one only with the
// arguments of the config). Where the page is not `live` after it has loaded, there is nothing to
// look at and the tests skip: ink-fallback.spec.ts is the spec of that case.
//
// Everything a clock decides is read from the page's own clock, in observers installed before the
// first script, so how busy the machine is moves when a test looks and not what it sees.

declare global {
  interface Window {
    /** The page clock when a canvas first ran, by the scene it was in. */
    __inkAt?: Record<string, number>;
    /** Every long task of the load: its start and its duration, in milliseconds. */
    __long?: Array<[number, number]>;
    /** The pause: when the press came and when the loop stopped, on the page clock. */
    __pause?: { pressed: number | null; stopped: number | null };
  }
}

const HERO = '[data-ink-backdrop][data-scene="hero"]';

/** Notes when a canvas first runs in each scene, and every long task, from before the page's scripts. */
async function watch(page: Page) {
  await page.addInitScript(() => {
    window.__inkAt = {};
    window.__long = [];
    new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target;
        if (!(target instanceof HTMLCanvasElement)) continue;
        if (target.getAttribute("data-ink-running") !== "true") continue;
        const scene = target.closest("[data-ink-backdrop]")?.getAttribute("data-scene") ?? "none";
        window.__inkAt ??= {};
        window.__inkAt[scene] ??= performance.now();
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-ink-running"],
    });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__long?.push([entry.startTime, entry.duration]);
    }).observe({ type: "longtask", buffered: true });
  });
}

/** A repeat visit with the test hook, and a page whose ink is live (or the test is skipped). */
async function openLive(page: Page, path = "/") {
  await introSeen(page);
  await withInkTest(page);
  await watch(page);
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const mode = await inkMode(page);
  test.skip(mode !== "live", `the page is "${mode}", not live: this machine has no graphics card`);
}

/** What the cover is doing: "none" before it started, its state while it plays, "gone" after it. */
const introPhase = (page: Page) =>
  page.evaluate(() => {
    const last = (window.__introLog ?? []).at(-1);
    return last ? (last[1] ?? "gone") : "none";
  });

const running = (page: Page) =>
  page.evaluate(() => document.querySelector("canvas")?.getAttribute("data-ink-running") ?? null);

/** Waits for the canvas to stand in a scene and run. */
async function expectRunningIn(page: Page, scene: string, timeout = 10_000) {
  await expect
    .poll(() => canvases(page), { timeout })
    .toMatchObject({ count: 1, inSlot: true, hidden: true, scene, running: "true" });
}

/** Samples the calm zones of the stage the canvas is in, once a quarter second, for a while. */
async function holdCaps(page: Page, seconds: number) {
  const worst = await page.evaluate(async (duration) => {
    const hook = window.__inkTest;
    if (!hook) return null;
    const stop = performance.now() + duration * 1000;
    let samples = 0;
    let miss = -Infinity;
    let where = "";
    while (performance.now() < stop) {
      for (const zone of hook.zoneExtremes()) {
        samples += 1;
        const short = zone.dark ? zone.extreme - zone.cap : zone.cap - zone.extreme;
        if (short > miss) {
          miss = short;
          where = `${zone.kind} ${zone.dark ? "highest" : "lowest"} ${zone.extreme.toFixed(3)} against ${zone.cap}`;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return { samples, miss, where };
  }, seconds);
  expect(worst).not.toBeNull();
  expect(worst?.samples ?? 0).toBeGreaterThan(0);
  expect(worst?.where ?? "").not.toBe("");
  // Every cap holds within 0.02 for the whole time.
  expect(worst?.miss ?? Infinity, worst?.where).toBeLessThanOrEqual(0.02);
}

test.describe("the hero", () => {
  test("runs within 2.5 seconds of a repeat visit, in the hero's slot, on exact white", async ({
    page,
  }) => {
    const problems = collectProblems(page);
    await openLive(page);

    await expectRunningIn(page, "hero");
    const started = await page.evaluate(() => window.__inkAt?.hero ?? null);
    expect(started).not.toBeNull();
    expect(started ?? Infinity).toBeLessThan(2500);

    // Empty water is the ground exactly: the corners of the canvas hold no ink.
    expect(await canvasPixel(page, "top-left")).toBe(PAPER);
    expect(await canvasPixel(page, "bottom-left")).toBe(PAPER);
    expect(await page.locator(`${HERO} [data-ink-slot] canvas`).count()).toBe(1);

    // No task in the first five seconds is longer than 200ms (the probe, the longest, included).
    await expect.poll(() => pageClock(page), { timeout: 10_000 }).toBeGreaterThan(5000);
    const long = await page.evaluate(() => window.__long ?? []);
    for (const [at, duration] of long) {
      if (at < 5000) expect(duration, `a task at ${Math.round(at)}ms`).toBeLessThanOrEqual(200);
    }
    expect(problems).toEqual([]);
  });

  test("a frame costs at most 6ms at the high tier", async ({ page }) => {
    await openLive(page);
    await expectRunningIn(page, "hero");
    await page.getByRole("button", { name: "Pause ink" }).click();
    const best = await page.evaluate(() => {
      const hook = window.__inkTest;
      const ink = hook?.engine();
      if (!hook || !ink) return null;
      ink.setQuality("high");
      return Math.min(...[1, 2, 3].map(() => hook.cost(30) ?? Infinity));
    });
    expect(best).not.toBeNull();
    expect(best ?? Infinity).toBeLessThanOrEqual(6);
  });

  test("keeps every cap under its calm zones for twenty seconds", async ({ page }) => {
    test.setTimeout(90_000);
    await openLive(page);
    await expectRunningIn(page, "hero");
    await holdCaps(page, 20);
  });

  test("stops by itself within 40 seconds and starts again on a pointer move", async ({ page }) => {
    test.setTimeout(120_000);
    await openLive(page);
    await expectRunningIn(page, "hero");

    // With no input the water comes to rest and the loop stops.
    await expect.poll(() => running(page), { timeout: 40_000, intervals: [500] }).toBe("false");
    const steps = await page.evaluate(() => window.__inkTest?.stats()?.steps ?? -1);
    await expect.poll(() => pageClock(page)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.__inkTest?.stats()?.steps ?? -2)).toBe(steps);

    // A pointer move over the stage starts it again.
    const box = await page.locator(HERO).boundingBox();
    if (!box) throw new Error("the hero has no box");
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
    await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.55, { steps: 4 });
    await expect.poll(() => running(page), { timeout: 2_000 }).toBe("true");
  });
});

test.describe("the pause button", () => {
  test("is in the hero, reachable by keyboard, stops the loop within 100ms and survives a reload", async ({
    page,
  }) => {
    await openLive(page);
    await expectRunningIn(page, "hero");

    // The button stands in the hero's control holder.
    const button = page.getByRole("button", { name: "Pause ink" });
    await expect(button).toHaveCount(1);
    await expect(page.locator(`${HERO} + [data-ink-control]`).getByRole("button")).toHaveCount(1);

    // It is reached with the keyboard, before the words of the stage it belongs to.
    let reached = false;
    for (let i = 0; i < 40 && !reached; i += 1) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(
        () => document.activeElement?.hasAttribute("data-ink-toggle") ?? false,
      );
    }
    expect(reached).toBe(true);
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS("outline-width", "3px");
    await expect(button).toHaveCSS("outline-style", "solid");

    // A press stops the loop within 100ms, by the page's own clock.
    await page.evaluate(() => {
      const record: NonNullable<Window["__pause"]> = { pressed: null, stopped: null };
      window.__pause = record;
      document.addEventListener(
        "click",
        () => {
          record.pressed ??= performance.now();
        },
        { capture: true, once: true },
      );
      const canvas = document.querySelector("canvas");
      if (canvas) {
        new MutationObserver(() => {
          if (canvas.getAttribute("data-ink-running") === "false") {
            record.stopped ??= performance.now();
          }
        }).observe(canvas, { attributes: true, attributeFilter: ["data-ink-running"] });
      }
    });
    await page.keyboard.press("Enter");
    await expect
      .poll(() => page.evaluate(() => window.__pause?.stopped ?? null), { timeout: 2_000 })
      .not.toBeNull();
    const times = await page.evaluate(() => window.__pause);
    expect((times?.stopped ?? Infinity) - (times?.pressed ?? 0)).toBeLessThan(100);

    // It is renamed, and nothing steps while it is stopped.
    await expect(page.getByRole("button", { name: "Play ink" })).toHaveCount(1);
    const before = await page.evaluate(() => window.__inkTest?.stats()?.steps ?? -1);
    const mark = await pageClock(page);
    await expect.poll(() => pageClock(page)).toBeGreaterThan(mark + 400);
    expect(await page.evaluate(() => window.__inkTest?.stats()?.steps ?? -2)).toBe(before);

    // The choice lasts the session: after a reload the page is paused, with stills and no canvas.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(() => inkMode(page)).toBe("paused");
    expect((await canvases(page)).count).toBe(0);
    await expect(page.locator(`${HERO} [data-ink-still]`)).not.toHaveCSS("display", "none");
    await expect(page.locator(`${HERO} [data-ink-still] img`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Play ink" })).toHaveCount(1);

    // And it starts the ink again.
    await page.getByRole("button", { name: "Play ink" }).click();
    await expectRunningIn(page, "hero");
    await expect(page.getByRole("button", { name: "Pause ink" })).toHaveCount(1);
  });

  test("a resize while the loop is stopped leaves the ink on the canvas", async ({ page }) => {
    await openLive(page);
    await expectRunningIn(page, "hero");
    // Let some ink fall, then stop the loop.
    await expect.poll(() => inkedPixels(page), { timeout: 15_000 }).toBeGreaterThan(500);
    await page.getByRole("button", { name: "Pause ink" }).click();
    await expect.poll(() => running(page)).toBe("false");

    await page.setViewportSize({ width: 1200, height: 800 });
    await expect.poll(() => inkedPixels(page), { timeout: 5_000 }).toBeGreaterThan(500);
  });
});

test.describe("one canvas, many stages", () => {
  test("moves between the stages of the home page and ends on the footer, on exact ground", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const problems = collectProblems(page);
    await openLive(page);
    await expectRunningIn(page, "hero");

    // Down the page: the ninety (it waits for its tenth block, so the water is clear until then),
    // the closing and the footer. There is one canvas all the way.
    await scrollToElement(page, "#solution", 0);
    await expect
      .poll(() => canvases(page), { timeout: 10_000 })
      .toMatchObject({ count: 1, inSlot: true, hidden: true, scene: "ninety" });
    await scrollToElement(page, "#closing", 0);
    await expectRunningIn(page, "bloom");
    await scrollToEnd(page);
    await expectRunningIn(page, "wisps");

    // Empty water on the binder is the binder exactly.
    expect(await canvasPixel(page, "bottom-left")).toBe(BINDER);
    expect(await backdropState(page, "wisps")).toBe("live");
    expect(problems).toEqual([]);
  });

  test("the ninety fires its tenth drop when the band goes by", async ({ page }) => {
    test.setTimeout(60_000);
    await openLive(page);
    await expectRunningIn(page, "hero");
    await scrollToElement(page, "#solution", 0);
    // Through the band in small steps, as a hand on the wheel would.
    for (const share of [0.3, 0.45, 0.6, 0.75]) {
      await page.evaluate((at) => {
        const band = document.querySelector("#solution");
        if (!band) return;
        const box = band.getBoundingClientRect();
        window.scrollTo({
          top:
            box.top + window.scrollY - window.innerHeight + at * (box.height + window.innerHeight),
          behavior: "instant",
        });
      }, share);
      await expect.poll(() => pageClock(page)).toBeGreaterThan(0);
    }
    await expectRunningIn(page, "ninety", 15_000);
    expect(await page.evaluate(() => window.__inkTest?.stats()?.preset ?? null)).toBe("ninety");
  });

  test("keeps its caps in the closing and the footer for twenty seconds each", async ({ page }) => {
    test.setTimeout(120_000);
    await openLive(page);
    await scrollToElement(page, "#closing", 0);
    await expectRunningIn(page, "bloom");
    await holdCaps(page, 20);
    await scrollToEnd(page);
    await expectRunningIn(page, "wisps");
    await holdCaps(page, 20);
  });

  test("stays one canvas into /about and leaves none on /catalog", async ({ page, isMobile }) => {
    test.skip(isMobile, "the inline navigation is the desktop one");
    await openLive(page);
    await expectRunningIn(page, "hero");

    await page.getByRole("banner").getByRole("link", { name: "About", exact: true }).click();
    await expect(page).toHaveURL(/\/about$/, { timeout: NAVIGATION_TIMEOUT });
    // The title block's ink is the first stage of the page; one canvas serves it.
    await expect.poll(async () => (await canvases(page)).count, { timeout: 10_000 }).toBe(1);
    expect((await canvases(page)).inSlot).toBe(true);

    await page.getByRole("banner").getByRole("link", { name: "Catalog", exact: true }).click();
    await expect(page).toHaveURL(/\/catalog$/, { timeout: NAVIGATION_TIMEOUT });
    await expect.poll(async () => (await canvases(page)).count, { timeout: 10_000 }).toBe(0);
    await expect(page.locator("html")).toHaveAttribute("data-ink-route", "calm");
    await expect(page.locator("[data-ink-toggle]")).toHaveCount(0);
  });
});

test.describe("when the graphics card lets go", () => {
  test("a lost context shows the still and a restored one brings the ink back", async ({
    page,
  }) => {
    await openLive(page);
    await expectRunningIn(page, "hero");

    await page.evaluate(() => window.__inkTest?.loseContext());
    await expect.poll(() => backdropState(page, "hero"), { timeout: 5_000 }).toBe("rest");
    await expect(page.locator(`${HERO} [data-ink-still]`)).not.toHaveCSS("display", "none");

    await page.evaluate(() => window.__inkTest?.restoreContext());
    await expect.poll(() => backdropState(page, "hero"), { timeout: 10_000 }).toBe("live");
    await expectRunningIn(page, "hero");
  });
});

test.describe("the 404 page", () => {
  test("spills ink and keeps its caps for twenty seconds", async ({ page }) => {
    test.setTimeout(90_000);
    const problems = collectProblems(page);
    await introSeen(page);
    await withInkTest(page);
    await page.goto("/nope");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    const mode = await inkMode(page);
    test.skip(mode !== "live", `the page is "${mode}", not live`);

    await expectRunningIn(page, "spill");
    expect(await canvasPixel(page, "bottom-left")).toBe(PAPER);
    await holdCaps(page, 20);
    // A 404 answered by the server logs its status as a resource error: nothing else may appear.
    expect(problems.filter((problem) => !/404/.test(problem))).toEqual([]);
  });
});

test.describe("the cover of a first visit", () => {
  test("is gone within 4.1 seconds and the hero runs 600ms later", async ({ page }) => {
    test.setTimeout(60_000);
    const problems = collectProblems(page);
    await withInkTest(page);
    await watch(page);
    await recordIntro(page);
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("[data-intro-cover]")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("opacity", "1");
    const mode = await inkMode(page);
    test.skip(mode !== "live", `the page is "${mode}", not live`);

    await expect
      .poll(() => introPhase(page), {
        timeout: 15_000,
      })
      .toBe("gone");
    const painted = await page.evaluate(
      () => performance.getEntriesByName("first-paint")[0]?.startTime ?? 0,
    );
    const states = await page.evaluate(() => (window.__introLog ?? []).map(([, state]) => state));
    const gone = await page.evaluate(() => (window.__introLog ?? []).at(-1)?.[0] ?? Infinity);
    // With ink the cover is taken over and leaves later than without it, still inside its budget.
    expect(states).toEqual(["play", "ink", null]);
    expect(gone - painted).toBeLessThanOrEqual(4100);
    expect(await introAt(page, "ink")).not.toBeNull();

    await expectRunningIn(page, "hero", 10_000);
    const heroAt = await page.evaluate(() => window.__inkAt?.hero ?? Infinity);
    expect(heroAt - gone).toBeLessThanOrEqual(600);
    expect(problems).toEqual([]);
  });

  test("ends within 400ms of a key", async ({ page }) => {
    await withInkTest(page);
    await recordIntro(page);
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("[data-intro-cover]")).toBeVisible();
    test.skip((await inkMode(page)) !== "live", "the page is not live");

    await page.keyboard.press("Shift");
    await expect
      .poll(() => introPhase(page), {
        timeout: 4_000,
      })
      .toBe("gone");
    const log = await page.evaluate(() => window.__introLog ?? []);
    const leave = log.find(([, state]) => state === "leave");
    const end = log.at(-1);
    expect(leave).toBeTruthy();
    expect((end?.[0] ?? Infinity) - (leave?.[0] ?? 0)).toBeLessThan(400);
  });
});
