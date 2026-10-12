import { expect, test, type Page } from "@playwright/test";
import { hydrated, introSeen, NAVIGATION_TIMEOUT } from "./helpers";
import { INK_PAUSED } from "../../lib/boot/state";
import {
  DOCS,
  PROMPT,
  STAGE,
  recordSequence,
  recordStage,
  sequence,
  settled,
  stageFrames,
  stageState,
  timings,
} from "./support/hero";
import {
  BINDER,
  INK_STORE,
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
    /** The opacity of the cover's signature on every frame of the load, with the page clock. */
    __signature?: Array<[number, number]>;
    /** The pause: when the press came and when the loop stopped, on the page clock. */
    __pause?: { pressed: number | null; stopped: number | null };
  }
}

const HERO = '[data-ink-backdrop][data-scene="prompt"]';

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

test.describe("the prompt", () => {
  test.describe("in its first five seconds", () => {
    // The long-task bound below is about the page's own work, but the browser reports every task
    // of its main thread, and one that the machine held up is among them: a task of 911ms was
    // measured 46ms into the page's life, before any code of the ink had run, while other work
    // had the processor. So this one test may be tried three times; the bound itself stays.
    test.describe.configure({ retries: 2 });

    test("runs within 2.5 seconds of a repeat visit, in the hero's slot, on exact white, with no task longer than 200ms", async ({
      page,
    }) => {
      const problems = collectProblems(page);
      await openLive(page);

      await expectRunningIn(page, "prompt");
      const started = await page.evaluate(() => window.__inkAt?.prompt ?? null);
      expect(started).not.toBeNull();
      expect(started ?? Infinity).toBeLessThan(2500);

      // Empty water is the ground exactly: the corners of the canvas hold no ink.
      expect(await canvasPixel(page, "top-left")).toBe(PAPER);
      expect(await canvasPixel(page, "bottom-left")).toBe(PAPER);
      expect(await page.locator(`${HERO} [data-ink-slot] canvas`).count()).toBe(1);

      // No task in the first five seconds is longer than 200ms (the probe, the longest, included).
      await expect.poll(() => pageClock(page), { timeout: 10_000 }).toBeGreaterThan(5000);
      const long = await page.evaluate(() => window.__long ?? []);
      for (const [at, duration] of long.filter(([start]) => start < 5000)) {
        expect(duration, `a task at ${Math.round(at)}ms`).toBeLessThanOrEqual(200);
      }
      expect(problems).toEqual([]);
    });
  });

  test("a frame costs at most 6ms at the high tier", async ({ page }) => {
    await openLive(page);
    await expectRunningIn(page, "prompt");
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
    await expectRunningIn(page, "prompt");
    await holdCaps(page, 20);
  });

  test("leaves the box empty for 0.7 seconds, opens over it, is clean at 3.5 seconds, and ink arrives again from 6 seconds", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await openLive(page);
    await expectRunningIn(page, "prompt");
    const clock = () => page.evaluate(() => window.__inkTest?.stats()?.time ?? -1);
    const kinds = () =>
      page.evaluate(() => (window.__inkTest?.zoneExtremes() ?? []).map((zone) => zone.kind));

    // The bloom: a great deal of ink on the canvas before the clear begins.
    await expect.poll(() => inkedPixels(page), { timeout: 5_000 }).toBeGreaterThan(20_000);
    await expect.poll(clock, { timeout: 10_000 }).toBeGreaterThan(3.6);
    // The words are the only calm water: the headline with the lead, and the buttons. The stage
    // is open, so ink lives behind and beside the documents.
    expect((await kinds()).sort()).toEqual(["text", "veil"]);

    // The script went on after its own clear: from 6 seconds ink arrives again, and it stays.
    await expect.poll(clock, { timeout: 20_000 }).toBeGreaterThan(6.5);
    await expect.poll(() => inkedPixels(page), { timeout: 10_000 }).toBeGreaterThan(1000);
    await expect.poll(clock, { timeout: 20_000 }).toBeGreaterThan(14);
    expect(await inkedPixels(page)).toBeGreaterThan(3000);

    // The page's sequence and the scene began together: the scene's start is the canvas's first
    // running frame, the sequence's is the first paint of a page with no cover. On a repeat visit
    // the engine is fetched and compiled after that paint, so the scene is the later of the two:
    // by 95 to 603ms as measured on a quiet machine, the high end in a browser that has just
    // started. 600 would sit on the top of that range, so the bound is 800.
    const offset = await page.evaluate(() => {
      const painted = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
      return (window.__inkAt?.prompt ?? Infinity) - painted;
    });
    expect(offset).toBeGreaterThan(-50);
    expect(offset).toBeLessThan(800);

    // The two moments of the script that a late look would miss are read from the scene stepped
    // by hand, from its start, in its own backdrop: fixed steps of a sixtieth of a second draw the
    // same picture every time, so they are read whenever the test gets here.
    const stepTo = (seconds: number) =>
      page.evaluate((until) => {
        const ink = window.__inkTest?.engine();
        if (!ink) return -1;
        for (let i = 0; i < 1200 && ink.stats().time < until; i += 1) ink.step(1);
        return ink.stats().time;
      }, seconds);
    expect(await page.evaluate(() => window.__inkTest?.hold("prompt") ?? false)).toBe(true);
    expect(await clock()).toBe(0);

    // The blank prompt: for the first 0.7 seconds of the scene nothing has fallen.
    const blank = await stepTo(0.6);
    expect(blank).toBeGreaterThanOrEqual(0.6);
    expect(blank).toBeLessThan(0.7);
    expect(await inkedPixels(page)).toBe(0);

    // Then the drops, and the bloom.
    expect(await stepTo(2.4)).toBeLessThan(2.6);
    expect(await inkedPixels(page)).toBeGreaterThan(20_000);

    // The clear ends at 3.5 seconds of the scene's own clock: clean water, exactly the ground.
    const clean = await stepTo(3.6);
    expect(clean).toBeGreaterThanOrEqual(3.6);
    expect(clean).toBeLessThan(5.8);
    expect(await inkedPixels(page)).toBe(0);
    expect(await canvasPixel(page, "top-left")).toBe(PAPER);
  });

  test("stops by itself within 40 seconds and starts again on a pointer move", async ({ page }) => {
    test.setTimeout(120_000);
    await openLive(page);
    await expectRunningIn(page, "prompt");

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

test.describe("the hero's sequence", () => {
  // The page's half of the prompt scene (app/motion.css): it plays where the ink is live, which in
  // this project it is. hero.spec.ts is the spec of the stage where the ink is still.

  /** The six documents that are still waiting to land, and how many frames are recorded so far. */
  const midway = (page: Page, then: "pause" | "still") =>
    page.evaluate((act) => {
      const waiting = document
        .getAnimations()
        .filter(
          (entry) =>
            entry instanceof CSSAnimation &&
            entry.animationName === "hero-doc-in" &&
            Number(entry.currentTime ?? Infinity) <
              Number(entry.effect?.getComputedTiming().delay ?? 0),
        ).length;
      const frames = (window.__heroFrames ?? []).length;
      if (act === "pause") document.querySelector<HTMLElement>("[data-ink-toggle]")?.click();
      else document.documentElement.setAttribute("data-ink", "still");
      return { waiting, frames };
    }, then);

  /** Waits for a dozen more frames, then returns every frame since `from` that was not at rest. */
  async function unsettledSince(page: Page, from: number) {
    await expect
      .poll(async () => (await stageFrames(page)).length, { timeout: 10_000 })
      .toBeGreaterThan(from + 12);
    return (await stageFrames(page))
      .slice(from)
      .filter((frame) => frame.box || frame.hidden > 0 || frame.moving > 0);
  }

  test("plays once: the box stands empty, dissolves from 1100ms to 2300ms, and the documents land from 3700ms", async ({
    page,
  }) => {
    await recordSequence(page);
    await openLive(page);
    await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
    // The box is decoration: a caret and two keys, hidden from assistive technology.
    await expect(page.locator(PROMPT)).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(`${PROMPT} [data-caret]`)).toHaveCount(1);
    await expect(page.locator(`${PROMPT} a, ${PROMPT} button, ${PROMPT} input`)).toHaveCount(0);

    // When the sequence is over, the box is gone and every document stands.
    await settled(page);
    const state = await stageState(page);
    expect(state.prompt).toMatchObject({ opacity: "0", visibility: "hidden" });
    expect(state.docs).toHaveLength(6);
    for (const doc of state.docs)
      expect(doc).toMatchObject({ opacity: "1", visibility: "visible" });
    // Nothing of the sequence is left running or repeating, and it ran to its own end.
    expect(await timings(page, PROMPT, "hero-prompt-out")).toEqual([null]);
    expect(await timings(page, DOCS, "hero-doc-in")).toEqual(Array(6).fill(null));
    await expect(page.locator(STAGE)).not.toHaveAttribute("data-landed");

    // What ran: the box once, from 1100ms for 1200ms, so it stood whole for the 700ms before the
    // first drop and 400ms more; its caret, which is on at the start; the six documents once
    // each, from 3700ms (the scene's water is clean by 3500ms), 110ms apart, 560ms each, the
    // middle two first; and with each its showing, which takes 90ms: a document never fades
    // through ink. All of it was set going at one moment.
    const ran = await sequence(page);
    const box = ran.filter(([name]) => name === "hero-prompt-out");
    const caret = ran.filter(([name]) => name === "hero-caret-blink");
    const docs = ran.filter(([name]) => name === "hero-doc-in");
    const shown = ran.filter(([name]) => name === "hero-doc-show");
    expect(box.map(([, delay, duration]) => [delay, duration])).toEqual([[1100, 1200]]);
    expect(caret.map(([, delay, duration]) => [delay, duration])).toEqual([[0, 1500]]);
    expect(docs.map(([, delay, duration]) => [delay, duration])).toEqual(
      [0, 1, 2, 3, 4, 5].map((index) => [3700 + index * 110, 560]),
    );
    expect(shown.map(([, delay, duration]) => [delay, duration])).toEqual(
      [0, 1, 2, 3, 4, 5].map((index) => [3700 + index * 110, 90]),
    );
    const starts = [...box, ...docs].map(([, , , start]) => start);
    expect(Math.max(...starts) - Math.min(...starts)).toBeLessThanOrEqual(50);
  });

  test("on a first visit it waits under the cover with its box, and starts its clock when the cover has gone", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await recordIntro(page);
    await recordSequence(page);
    await recordStage(page);
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("[data-intro-cover]")).toBeVisible();
    const mode = await inkMode(page);
    test.skip(mode !== "live", `the page is "${mode}", not live`);

    await expect.poll(() => introPhase(page), { timeout: 15_000 }).toBe("gone");
    const gone = await page.evaluate(() => (window.__introLog ?? []).at(-1)?.[0] ?? Infinity);

    // Under the cover, on every frame: the opening state, with nothing of the sequence running.
    await settled(page);
    const frames = (await stageFrames(page)).filter((frame) => frame.docs === 6);
    const under = frames.filter((frame) => frame.at < gone);
    expect(under.length).toBeGreaterThan(10);
    expect(under.filter((frame) => !frame.box || frame.hidden !== 6 || frame.moving > 0)).toEqual(
      [],
    );

    // The sequence was set going as the cover went (within a few frames of a busy machine), with
    // the delays it always has; so no document showed in the 3.6 seconds after that.
    const ran = await sequence(page);
    const docs = ran.filter(([name]) => name === "hero-doc-in");
    expect(docs.map(([, delay]) => delay)).toEqual(
      [0, 1, 2, 3, 4, 5].map((index) => 3700 + index * 110),
    );
    for (const [, , , start] of docs) {
      expect(start - gone).toBeGreaterThanOrEqual(-20);
      expect(start - gone).toBeLessThanOrEqual(250);
    }
    const early = frames.filter((frame) => frame.at > gone && frame.at < gone + 3600);
    expect(early.length).toBeGreaterThan(30);
    expect(early.filter((frame) => frame.hidden !== 6)).toEqual([]);

    // And it ran to its end.
    const state = await stageState(page);
    expect(state.prompt).toMatchObject({ opacity: "0" });
    for (const doc of state.docs)
      expect(doc).toMatchObject({ opacity: "1", visibility: "visible" });
  });

  test("a pause half-way lands the documents at once, and playing the ink again leaves them standing", async ({
    page,
  }) => {
    await recordStage(page);
    await openLive(page);
    await expectRunningIn(page, "prompt");
    await expect(page.getByRole("button", { name: "Pause ink" })).toHaveCount(1);

    // The button is pressed in the task that reads how far the sequence is.
    const { waiting, frames } = await midway(page, "pause");
    test.skip(waiting !== 6, "the documents had begun to land before the ink could be paused");
    await expect(page.locator(STAGE)).toHaveAttribute("data-landed", "");
    expect(await unsettledSince(page, frames)).toEqual([]);

    // Playing the ink again starts the water, not the sequence.
    const from = (await stageFrames(page)).length;
    await page.getByRole("button", { name: "Play ink" }).click();
    await expectRunningIn(page, "prompt");
    expect(await unsettledSince(page, from)).toEqual([]);
    for (const doc of await page.locator(DOCS).all()) await expect(doc).toBeVisible();
    await expect(page.locator(PROMPT)).toBeHidden();
  });

  test("ink that falls to still half-way lands the documents, and ink that is live again leaves them", async ({
    page,
  }) => {
    await recordStage(page);
    await openLive(page);

    // What the layer does when the engine fails: the root element says `still`.
    const { waiting, frames } = await midway(page, "still");
    test.skip(waiting !== 6, "the documents had begun to land before the ink could be stopped");
    await expect(page.locator(STAGE)).toHaveAttribute("data-landed", "");
    expect(await unsettledSince(page, frames)).toEqual([]);

    const from = (await stageFrames(page)).length;
    await page.evaluate(() => document.documentElement.setAttribute("data-ink", "live"));
    expect(await unsettledSince(page, from)).toEqual([]);
    for (const doc of await page.locator(DOCS).all()) await expect(doc).toBeVisible();
    await expect(page.locator(PROMPT)).toBeHidden();
  });

  test("ink that a paused session plays again leaves the documents standing", async ({ page }) => {
    await introSeen(page);
    await withInkTest(page);
    await recordStage(page);
    await page.addInitScript(
      ([key, paused]) => {
        // Only on the load: the layer's own later choice is not written over on a reload.
        if (window.sessionStorage.getItem(key) === null) window.sessionStorage.setItem(key, paused);
      },
      [INK_STORE, INK_PAUSED] as const,
    );
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-ink", "paused");
    await hydrated(page);
    await expect(page.locator(STAGE)).toHaveAttribute("data-landed", "");
    for (const doc of await page.locator(DOCS).all()) await expect(doc).toBeVisible();

    // The visitor plays the ink: the root element says `live` from that moment.
    const from = (await stageFrames(page)).length;
    await page.getByRole("button", { name: "Play ink" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-ink", "live");
    const mode = await inkMode(page);
    test.skip(
      mode !== "live",
      `the page is "${mode}", not live: this machine has no graphics card`,
    );
    // The scene runs from its start behind documents that never left.
    await expectRunningIn(page, "prompt");
    expect(await unsettledSince(page, from)).toEqual([]);
    expect(await unsettledSince(page, 0)).toEqual([]);
    await expect(page.locator(PROMPT)).toBeHidden();
    for (const doc of await page.locator(DOCS).all()) await expect(doc).toBeVisible();
  });

  test("plays again, with the scene, on a return to the home page inside the site", async ({
    page,
  }) => {
    await recordStage(page);
    await openLive(page);
    await settled(page);
    await page
      .locator("[data-band]:has(h1)")
      .getByRole("link", { name: "Get the toolkit", exact: true })
      .click();
    await expect(page).toHaveURL(/\/purchase$/, { timeout: NAVIGATION_TIMEOUT });
    await expect(page.locator(STAGE)).toHaveCount(0);
    const from = (await stageFrames(page)).length;

    await page.goBack();
    await expect(page).toHaveURL(/\/$/, { timeout: NAVIGATION_TIMEOUT });
    // The new stage opens as a load does: the box there, the documents waiting.
    await expect
      .poll(
        async () =>
          (await stageFrames(page))
            .slice(from)
            .some((frame) => frame.box && frame.hidden === 6 && frame.moving > 0),
        { timeout: 10_000 },
      )
      .toBe(true);
    await expectRunningIn(page, "prompt");
    await settled(page);
    await expect(page.locator(STAGE)).not.toHaveAttribute("data-landed");
    for (const doc of await page.locator(DOCS).all()) await expect(doc).toBeVisible();
  });
});

test.describe("the pause button", () => {
  test("is in the hero, reachable by keyboard, stops the loop within 100ms and survives a reload", async ({
    page,
  }) => {
    await openLive(page);
    await expectRunningIn(page, "prompt");

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
    await expectRunningIn(page, "prompt");
    await expect(page.getByRole("button", { name: "Pause ink" })).toHaveCount(1);
  });

  test("a resize while the loop is stopped leaves the ink on the canvas", async ({ page }) => {
    await openLive(page);
    await expectRunningIn(page, "prompt");
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
    await expectRunningIn(page, "prompt");

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
    await expectRunningIn(page, "prompt");
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
    await expectRunningIn(page, "prompt");

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
    await expectRunningIn(page, "prompt");

    await page.evaluate(() => window.__inkTest?.loseContext());
    await expect.poll(() => backdropState(page, "prompt"), { timeout: 5_000 }).toBe("rest");
    await expect(page.locator(`${HERO} [data-ink-still]`)).not.toHaveCSS("display", "none");

    await page.evaluate(() => window.__inkTest?.restoreContext());
    await expect.poll(() => backdropState(page, "prompt"), { timeout: 10_000 }).toBe("live");
    await expectRunningIn(page, "prompt");
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
  test("is taken over within 1.6 seconds, gone 3.5 seconds later, and the hero runs 600ms after that", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const problems = collectProblems(page);
    await withInkTest(page);
    await watch(page);
    await recordIntro(page);
    // The signature (the mark and the name) on every frame, with the page clock.
    await page.addInitScript(() => {
      const frames: Array<[number, number]> = [];
      window.__signature = frames;
      const frame = () => {
        const mark = document.querySelector("[data-intro-cover] svg")?.parentElement;
        if (mark) frames.push([performance.now(), Number(getComputedStyle(mark).opacity)]);
        if (frames.length < 700) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
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
    // With ink the cover is taken over and leaves later than without it, still inside its budget:
    // taken over by 1600ms, and gone 3500ms after that, as the clear of the scene ends. A few
    // frames of a busy machine are allowed on each, and the backstop (5500ms) must not be what
    // took it off.
    expect(states).toEqual(["play", "ink", null]);
    const taken = await introAt(page, "ink");
    expect(taken).not.toBeNull();
    expect((taken ?? Infinity) - painted).toBeLessThanOrEqual(1700);
    expect(gone - (taken ?? 0)).toBeGreaterThanOrEqual(3450);
    expect(gone - (taken ?? 0)).toBeLessThanOrEqual(3900);
    expect(gone - painted).toBeLessThanOrEqual(5300);

    // Whenever the ink came, the finished mark stays whole until 2500ms and only then fades.
    const frames = await page.evaluate(() => window.__signature ?? []);
    const early = frames.filter(([at]) => at - painted <= 2450);
    expect(early.length).toBeGreaterThan(20);
    expect(early.filter(([, opacity]) => opacity < 1)).toEqual([]);
    expect(Math.min(...frames.map(([, opacity]) => opacity))).toBeLessThan(0.01);

    await expectRunningIn(page, "prompt", 10_000);
    const heroAt = await page.evaluate(() => window.__inkAt?.prompt ?? Infinity);
    expect(heroAt - gone).toBeLessThanOrEqual(600);
    expect(problems).toEqual([]);
  });

  test("ends within 500ms of a key", async ({ page }) => {
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
    // The skip animation takes 200ms; the bound is that of intro.spec.ts.
    expect((end?.[0] ?? Infinity) - (leave?.[0] ?? 0)).toBeLessThan(500);
  });
});
