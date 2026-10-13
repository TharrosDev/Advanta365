import { expect, type Page } from "@playwright/test";

/**
 * Helpers for hero.spec.ts, which looks at the stage of the home page's first screen. They read
 * states and clocks in the page, on frame callbacks installed before the first script, so how busy
 * the machine is moves when a test looks and not what it sees.
 */

export const STAGE = "[data-hero-stage]";
export const DOCS = "[data-hero-doc]";

/** One frame of the stage: what a visitor could see of it then. */
export type StageFrame = {
  /** The page clock, in milliseconds from the start of the navigation. */
  at: number;
  /** How many documents were in the page, and how many of them could not be seen or reached. */
  docs: number;
  hidden: number;
  /** How many animations of the stage existed, waiting or running. */
  moving: number;
};

declare global {
  interface Window {
    /** The stage on every frame since it was first in the page. */
    __heroFrames?: StageFrame[];
  }
}

/**
 * Notes the stage on every frame, from the first frame that has a document. A state that lasts one
 * frame is in the record; nothing depends on when the test asks.
 */
export async function recordStage(page: Page): Promise<void> {
  await page.addInitScript((docs) => {
    const frames: StageFrame[] = [];
    window.__heroFrames = frames;
    const look = () => {
      const all = [...document.querySelectorAll(docs)];
      if (all.length) {
        frames.push({
          at: performance.now(),
          docs: all.length,
          hidden: all.filter((doc) => {
            const style = getComputedStyle(doc);
            return style.visibility !== "visible" || style.opacity !== "1";
          }).length,
          moving: document
            .getAnimations()
            .filter(
              (entry) => entry instanceof CSSAnimation && entry.animationName.startsWith("hero-"),
            ).length,
        });
      }
      // Half a minute of frames is more than any test here looks at.
      if (frames.length < 1800) requestAnimationFrame(look);
    };
    requestAnimationFrame(look);
  }, DOCS);
}

/** The frames recorded so far. */
export const stageFrames = (page: Page) => page.evaluate(() => window.__heroFrames ?? []);

/** The frames on which the documents were not all in sight, or anything of the stage moved. */
export const unsettledFrames = async (page: Page) =>
  (await stageFrames(page)).filter((frame) => frame.hidden > 0 || frame.moving > 0);

/**
 * Waits for the stage to be at rest: the cover gone and nothing of the documents still moving. A
 * busy machine is slow to get there, so the page is asked, not a timer.
 */
export async function settled(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate((docs) => {
          if (document.documentElement.hasAttribute("data-intro")) return "under the cover";
          const moving = [...document.querySelectorAll(docs)]
            .flatMap((element) => element.getAnimations({ subtree: true }))
            .filter((animation) => animation.playState !== "finished").length;
          return moving ? "moving" : "settled";
        }, DOCS),
      { timeout: 20_000 },
    )
    .toBe("settled");
}

/** The opacity, visibility and display of every document, as computed now. */
export const stageState = (page: Page) =>
  page.evaluate((docs) => {
    const read = (element: Element) => {
      const style = getComputedStyle(element);
      return { opacity: style.opacity, visibility: style.visibility, display: style.display };
    };
    return { docs: [...document.querySelectorAll(docs)].map(read) };
  }, DOCS);
