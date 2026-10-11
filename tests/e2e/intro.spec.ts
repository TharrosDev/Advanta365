import { expect, test, type Page } from "@playwright/test";
import { introSeen, NAVIGATION_TIMEOUT } from "./helpers";

// The cover of a first visit. The first page load of a browser session, if it is the home page,
// opens under an ink sheet that is signed and then lifted off; the page under it is complete all
// along. No other load has it: not a second one, not an inner page, not one with reduced motion.
// Every test starts a session of its own, so here the first `goto` is a first visit.

declare global {
  interface Window {
    /** Every value `data-intro` took on the root element during this page load, in order. */
    introStates?: Array<string | null>;
    /** What the first press of this page load landed on. */
    introPress?: Promise<"cover" | "page">;
  }
}

const HEADLINE = "Don’t start your M365 rollout from a blank prompt.";

// The three colours of the cover: the ink of the sheet, the white it is written in and the
// highlighter.
const INK = "rgb(11, 13, 18)";
const ON_INK = "rgb(255, 255, 255)";
const MARK = "rgb(134, 193, 255)";

const root = (page: Page) => page.locator("html");
const cover = (page: Page) => page.locator("[data-intro-cover]");
const headline = (page: Page) => page.getByRole("heading", { level: 1 });

/**
 * Keeps a list of the states the root element goes through, from before the first script of each
 * page load. A state that lasts a fifth of a second cannot be missed this way.
 */
async function recordStates(page: Page) {
  await page.addInitScript(() => {
    const states: Array<string | null> = [];
    window.introStates = states;
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.target === document.documentElement) {
          states.push(document.documentElement.getAttribute("data-intro"));
        }
      }
    }).observe(document, { attributes: true, attributeFilter: ["data-intro"], subtree: true });
  });
}

const states = (page: Page) => page.evaluate(() => window.introStates ?? []);

/**
 * Opens the home page as a first visit and returns as soon as the cover is showing. The page is not
 * waited for: the cover is up from the first paint and gone 2.3 seconds later.
 */
async function firstVisit(page: Page) {
  await recordStates(page);
  await page.goto("/", { waitUntil: "commit" });
  await expect(cover(page)).toBeVisible();
}

/**
 * The latest end, in seconds, of the animations of one element, from its computed delay and
 * duration. Each is a list ("1.12s" and "0.14s, 0.28s"), and a shorter list repeats.
 */
function endOf(delay: string, duration: string): number {
  const seconds = (list: string) =>
    list
      .split(",")
      .map((part) => Number.parseFloat(part) * (part.trim().endsWith("ms") ? 0.001 : 1));
  const delays = seconds(delay);
  const durations = seconds(duration);
  const ends = Array.from(
    { length: Math.max(delays.length, durations.length) },
    (_, index) => (delays[index % delays.length] ?? 0) + (durations[index % durations.length] ?? 0),
  );
  return Math.max(...ends);
}

/** The root element went from playing to skipped to gone. */
async function expectSkipped(page: Page) {
  await expect.poll(async () => (await states(page)).slice(0, 3)).toEqual(["play", "skip", "done"]);
}

test("a first visit opens under the cover, with the whole page beneath it, and the cover is gone within four seconds", async ({
  page,
}) => {
  await firstVisit(page);

  // The cover is decoration over a finished page: hidden from assistive technology, with nothing
  // in it to focus, and the page under it neither hidden nor locked.
  await expect(cover(page)).toHaveAttribute("aria-hidden", "true");
  await expect(cover(page).locator("a, button, input, select, [tabindex]")).toHaveCount(0);
  await expect(cover(page).getByText("Advanta365", { exact: true })).toHaveCount(1);
  await expect(headline(page)).toHaveText(HEADLINE);
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  const main = page.getByRole("main");
  await expect(main).not.toHaveAttribute("inert");
  await expect(main).not.toHaveAttribute("aria-hidden");
  await expect(root(page)).not.toHaveCSS("overflow-y", "hidden");
  await expect(page.locator("body")).not.toHaveCSS("overflow-y", "hidden");

  // It leaves by itself, and what was under it can be seen and clicked.
  await expect(cover(page)).toBeHidden({ timeout: 4_000 });
  await expect(headline(page)).toBeVisible();
  await headline(page).click();
  await expect(cover(page)).toHaveCSS("display", "none");

  // The root element said so all the way: playing, gone, and then nothing once the hero sheet's
  // own fill and blink, which waited for the cover, have ended.
  await expect(root(page)).not.toHaveAttribute("data-intro", { timeout: 6_000 });
  await expect.poll(() => states(page)).toEqual(["play", "done", null]);
});

test("the timeline is CSS alone: switched on by hand, the cover leaves by itself, inside its budget", async ({
  page,
}) => {
  // A later load: the script decides not to play and sets up nothing. Setting the attribute is all
  // it would have done to start the cover, so from here on there is no script behind it.
  await introSeen(page);
  await recordStates(page);
  await page.goto("/");
  await expect(cover(page)).toBeHidden();
  await page.evaluate(() => document.documentElement.setAttribute("data-intro", "play"));
  await expect(cover(page)).toBeVisible();

  // An ink sheet written in white. The highlighter is its trailing edge and the tail of the mark,
  // which is the first of the three strokes in the document.
  await expect(cover(page)).toHaveCSS("background-color", INK);
  await expect(cover(page)).toHaveCSS("color", ON_INK);
  await expect(cover(page)).toHaveCSS("border-bottom-color", MARK);
  const strokes = cover(page).locator("path");
  await expect(strokes).toHaveCount(3);
  await expect(strokes.nth(0)).toHaveCSS("stroke", MARK);
  await expect(strokes.nth(1)).toHaveCSS("stroke", ON_INK);
  await expect(strokes.nth(2)).toHaveCSS("stroke", ON_INK);

  // The lift starts after every part of the signature has been written, ends within three
  // seconds, and holds its last frame.
  const lift = await cover(page).evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      delay: style.animationDelay,
      duration: style.animationDuration,
      fill: style.animationFillMode,
      position: style.position,
    };
  });
  expect(lift.position).toBe("fixed");
  expect(lift.fill).toBe("forwards");
  const liftStart = Number.parseFloat(lift.delay);
  expect(liftStart).toBeGreaterThan(1);
  expect(endOf(lift.delay, lift.duration)).toBeLessThanOrEqual(3);

  const parts = await cover(page)
    .locator("path, span")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return {
          name: style.animationName,
          delay: style.animationDelay,
          duration: style.animationDuration,
        };
      }),
    );
  const moving = parts.filter((part) => part.name !== "none");
  // Three strokes, ten blocks and the name.
  expect(moving).toHaveLength(14);
  for (const part of moving) expect(endOf(part.delay, part.duration)).toBeLessThan(liftStart);

  // The hero sheet waits for the cover: its tally starts as the cover lifts, and its last blink
  // still ends within five seconds.
  const sheet = await page
    .locator("[data-hero-sheet]")
    .locator("[data-block], [data-caret]")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return {
          delay: Number.parseFloat(style.animationDelay),
          end:
            Number.parseFloat(style.animationDelay) +
            Number.parseFloat(style.animationDuration) * Number(style.animationIterationCount),
        };
      }),
    );
  expect(sheet).toHaveLength(11);
  for (const step of sheet) {
    expect(step.delay).toBeGreaterThanOrEqual(liftStart);
    expect(step.end).toBeLessThanOrEqual(5);
  }

  // Left to itself the sheet goes: out of the layout, hidden and deaf to the pointer, although
  // nothing has moved the state on.
  await expect(cover(page)).toBeHidden({ timeout: 4_000 });
  await expect(cover(page)).toHaveCSS("display", "none");
  await expect(cover(page)).toHaveCSS("visibility", "hidden");
  await expect(cover(page)).toHaveCSS("pointer-events", "none");
  await headline(page).click();
  await expect(root(page)).toHaveAttribute("data-intro", "play");
  expect(await states(page)).toEqual(["play"]);
});

test("a second load in the same session has no cover", async ({ page }) => {
  await firstVisit(page);

  await page.reload();
  await expect(headline(page)).toBeVisible();
  await expect(cover(page)).toBeHidden();
  await expect(root(page)).not.toHaveAttribute("data-intro");
  // The list starts again with each load: the root element was never marked on this one.
  expect(await states(page)).toEqual([]);
});

test("an inner page has no cover, and neither has the home page in a session that started there", async ({
  page,
}) => {
  await recordStates(page);
  await page.goto("/pricing");
  await expect(headline(page)).toHaveText("Pricing");
  await expect(cover(page)).toHaveCount(0);
  await expect(root(page)).not.toHaveAttribute("data-intro");
  expect(await states(page)).toEqual([]);

  // Home by the brand link: a change of page, not a load.
  await page.getByRole("banner").getByRole("link", { name: "Advanta365", exact: true }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: NAVIGATION_TIMEOUT });
  await expect(headline(page)).toHaveText(HEADLINE);
  await expect(cover(page)).toHaveCount(1);
  await expect(cover(page)).toBeHidden();
  expect(await states(page)).toEqual([]);

  // And loaded outright: still not the first load of the session.
  await page.reload();
  await expect(headline(page)).toHaveText(HEADLINE);
  await expect(cover(page)).toBeHidden();
  expect(await states(page)).toEqual([]);
});

test("with reduced motion there is no cover", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await recordStates(page);
  await page.goto("/");

  await expect(headline(page)).toBeVisible();
  await expect(cover(page)).toBeHidden();
  await expect(root(page)).not.toHaveAttribute("data-intro");
  expect(await states(page)).toEqual([]);
  await headline(page).click();
});

// The three tests below act on the cover while it is up. They do it straight after it shows, which
// leaves them the 1.7 seconds before it starts to lift by itself.

test("a key press lifts the cover at once", async ({ page }) => {
  await firstVisit(page);

  await page.keyboard.press("Shift");
  await expect(cover(page)).toBeHidden({ timeout: 1_500 });
  await expectSkipped(page);
  await headline(page).click();
});

test("a press lifts it too, and lands on the cover, not on the page under it", async ({ page }) => {
  await firstVisit(page);

  // The middle of the main button of the page, which lies under the cover.
  const button = page
    .getByRole("main")
    .getByRole("link", { name: "Browse the catalog", exact: true });
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

  expect(await page.evaluate(() => window.introPress)).toBe("cover");
  await expect(cover(page)).toBeHidden({ timeout: 1_500 });
  await expectSkipped(page);
  // A press that began on the cover is not a click on the link under it.
  await expect(headline(page)).toHaveText(HEADLINE);
  await expect(page).toHaveURL(/\/$/);
});

test("the wheel lifts it and scrolls the page: nothing is locked", async ({ page }) => {
  await firstVisit(page);

  // A phone has no wheel, but the page answers one all the same.
  await page.mouse.move(100, 100);
  await page.mouse.wheel(0, 400);
  await expect(cover(page)).toBeHidden({ timeout: 1_500 });
  await expectSkipped(page);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});
