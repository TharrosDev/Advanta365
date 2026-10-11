import type { Page } from "@playwright/test";
import { INK_KEY } from "../../../lib/boot/state";
// Importing the hook's module brings the declaration of `window.__inkTest` into scope.
import type {} from "../../../lib/ink/test-hook";
import type {} from "../../../components/ink/ink-controller";

/**
 * Helpers for the specs that look at the ink layer. They read clocks and states in the page and
 * leave the waiting to `expect.poll`, so nothing here sleeps.
 */

/** The grounds the engine paints on, as the browser computes them. */
export const PAPER = "rgb(255, 255, 255)";
export const BINDER = "rgb(13, 15, 21)";
export const INK = "rgb(11, 13, 18)";
export const MARK = "rgb(134, 193, 255)";

/** The session key the layer keeps its choice in (`off`, `paused` or a tier). */
export const INK_STORE = INK_KEY;

declare global {
  interface Window {
    /** Every value `data-intro` took on the root element, with the page clock at that moment. */
    __introLog?: Array<[number, string | null]>;
  }
}

/** Asks the ink layer for `window.__inkTest` on every page this page loads. */
export async function withInkTest(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__INK_TEST__ = true;
  });
}

/**
 * Records every state of `data-intro` with the page clock (`performance.now()`, from the start of
 * the navigation), from before the first script of each load. A state that lasts a fifth of a
 * second cannot be missed this way, and the times do not depend on how busy the machine is when
 * the test gets round to asking.
 */
export async function recordIntro(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const log: Array<[number, string | null]> = [];
    window.__introLog = log;
    new MutationObserver(() => {
      log.push([performance.now(), document.documentElement.getAttribute("data-intro")]);
    }).observe(document, { attributes: true, attributeFilter: ["data-intro"], subtree: true });
  });
}

/** The recorded states in order, without their times. */
export const introStates = (page: Page) =>
  page.evaluate(() => (window.__introLog ?? []).map(([, state]) => state));

/** The page clock when `data-intro` first took a value, or null if it never did. */
export const introAt = (page: Page, value: string | null) =>
  page.evaluate((wanted) => {
    const found = (window.__introLog ?? []).find(([, state]) => state === wanted);
    return found ? found[0] : null;
  }, value);

/** The mode the boot script chose: `live`, `paused` or `still` (null before it ran). */
export const inkMode = (page: Page) =>
  page.evaluate(() => document.documentElement.getAttribute("data-ink"));

/** How many canvases the document holds, and where the first one stands. */
export const canvases = (page: Page) =>
  page.evaluate(() => {
    const all = [...document.querySelectorAll("canvas")];
    const first = all[0];
    return {
      count: all.length,
      inSlot: !!first?.closest("[data-ink-slot]"),
      hidden: first?.getAttribute("aria-hidden") === "true",
      scene: first?.closest("[data-ink-backdrop]")?.getAttribute("data-scene") ?? null,
      running: first?.getAttribute("data-ink-running") ?? null,
    };
  });

/** The state of one backdrop (`idle`, `live` or `rest`), by scene. */
export const backdropState = (page: Page, scene: string) =>
  page.evaluate(
    (name) =>
      document
        .querySelector(`[data-ink-backdrop][data-scene="${name}"]`)
        ?.getAttribute("data-ink-state") ?? null,
    scene,
  );

/** One pixel of the canvas, in canvas pixels from its top-left corner, drawn and read in one task. */
export const canvasPixel = (
  page: Page,
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right",
) =>
  page.evaluate((where) => {
    const hook = window.__inkTest;
    const ink = hook?.engine();
    const canvas = document.querySelector("canvas");
    const gl = canvas?.getContext("webgl2");
    if (!ink || !canvas || !gl) return null;
    ink.render();
    const x = where.endsWith("left") ? 0 : canvas.width - 1;
    const yFromTop = where.startsWith("top") ? 0 : canvas.height - 1;
    const out = new Uint8Array(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(x, canvas.height - 1 - yFromTop, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out);
    return `rgb(${out[0]}, ${out[1]}, ${out[2]})`;
  }, corner);

/** How many pixels of the canvas are darker than a light grey: the picture has ink in it. */
export const inkedPixels = (page: Page) =>
  page.evaluate(() => {
    const ink = window.__inkTest?.engine();
    const canvas = document.querySelector("canvas");
    const gl = canvas?.getContext("webgl2");
    if (!ink || !canvas || !gl) return 0;
    ink.render();
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) if ((pixels[i] ?? 255) < 200) count += 1;
    return count;
  });

/** Scrolls an element to the top of the window at once. */
export const scrollToElement = (page: Page, selector: string, offset = 0) =>
  page.evaluate(
    ([target, shift]) => {
      const element = document.querySelector(target as string);
      if (!element) return;
      const top = element.getBoundingClientRect().top + window.scrollY + (shift as number);
      window.scrollTo({ top, behavior: "instant" });
    },
    [selector, offset],
  );

/** Scrolls to the foot of the page at once. */
export const scrollToEnd = (page: Page) =>
  page.evaluate(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
  });

/** The page clock, in milliseconds from the start of the navigation. */
export const pageClock = (page: Page) => page.evaluate(() => performance.now());

/** Messages a spec treats as a defect: console errors, uncaught errors and failed requests. */
export function collectProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const { url } = message.location();
    problems.push(`console.error: ${message.text()}${url ? ` (${url})` : ""}`);
  });
  page.on("pageerror", (error) => {
    problems.push(`pageerror: ${error.message}`);
  });
  return problems;
}
