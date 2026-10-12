import { expect, type Page } from "@playwright/test";

/**
 * Helpers for the specs that look at the stage of the home page's first screen: hero.spec.ts, where
 * the ink is still (the default projects have no graphics card), and ink-live.spec.ts, where the
 * sequence plays. They read states and clocks in the page, on observers and frame callbacks
 * installed before the first script, so how busy the machine is moves when a test looks and not
 * what it sees.
 */

export const STAGE = "[data-hero-stage]";
export const PROMPT = "[data-hero-prompt]";
export const DOCS = "[data-hero-doc]";

/** One frame of the stage: what a visitor could see of it then. */
export type StageFrame = {
  /** The page clock, in milliseconds from the start of the navigation. */
  at: number;
  /** Whether the box is displayed (it may still be transparent). */
  box: boolean;
  /** How many documents were in the page, and how many of them could not be seen or reached. */
  docs: number;
  hidden: number;
  /** How many animations of the sequence existed, waiting or running. */
  moving: number;
};

declare global {
  interface Window {
    /** Each animation of the sequence as it started: its name, delay, length and start time. */
    __heroSequence?: Array<[string, number, number, number]>;
    /** The stage on every frame since it was first in the page. */
    __heroFrames?: StageFrame[];
    /** Every value `data-ink` took on the root element, in order. */
    __inkModes?: Array<string | null>;
  }
}

/**
 * Notes the stage on every frame, from the first frame that has a document, and every value of
 * `data-ink`. A state that lasts one frame is in the record; nothing depends on when the test asks.
 */
export async function recordStage(page: Page): Promise<void> {
  await page.addInitScript(
    ([prompt, docs]) => {
      const frames: StageFrame[] = [];
      const modes: Array<string | null> = [];
      window.__heroFrames = frames;
      window.__inkModes = modes;
      new MutationObserver(() => {
        modes.push(document.documentElement.getAttribute("data-ink"));
      }).observe(document, { attributes: true, attributeFilter: ["data-ink"], subtree: true });
      const look = () => {
        const all = [...document.querySelectorAll(docs)];
        if (all.length) {
          const box = document.querySelector(prompt);
          frames.push({
            at: performance.now(),
            box: !!box && getComputedStyle(box).display !== "none",
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
    },
    [PROMPT, DOCS] as const,
  );
}

/** The frames recorded so far. */
export const stageFrames = (page: Page) => page.evaluate(() => window.__heroFrames ?? []);

/** The frames on which the documents were not all in sight, the box showed, or anything moved. */
export const unsettledFrames = async (page: Page) =>
  (await stageFrames(page)).filter((frame) => frame.box || frame.hidden > 0 || frame.moving > 0);

/**
 * Notes every animation of the sequence on the first frame that has them started, while all of
 * them are still waiting or under way, with its own delay and length and the moment on the
 * document's timeline it was set going (the same clock as `performance.now()`): no clock of the
 * machine is in them, and a test that gets round to looking late still sees them.
 */
export async function recordSequence(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const seen: Array<[string, number, number, number]> = [];
    window.__heroSequence = seen;
    const look = () => {
      const found = document
        .getAnimations()
        .filter(
          (entry): entry is CSSAnimation =>
            entry instanceof CSSAnimation && entry.animationName.startsWith("hero-"),
        );
      // An animation has no start time on the frame that made it: it is noted on the next one.
      if (!found.length || found.some((animation) => animation.startTime === null)) {
        requestAnimationFrame(look);
        return;
      }
      for (const animation of found) {
        const timing = animation.effect?.getComputedTiming();
        if (!timing) continue;
        seen.push([
          animation.animationName,
          Math.round(Number(timing.delay)),
          Number(timing.duration),
          Number(animation.startTime),
        ]);
      }
      seen.sort((a, b) => a[1] - b[1]);
    };
    requestAnimationFrame(look);
  });
}

/** The recorded animations of the sequence, by delay. */
export const sequence = (page: Page) => page.evaluate(() => window.__heroSequence ?? []);

/**
 * Waits for the stage to be at rest: the cover gone, the box out of sight (dissolved at the end of
 * the sequence, or never displayed where there is none), and nothing of the stage still moving.
 * The sequence ends 4810ms after it began, on its own clock; a busy machine begins it late, so the
 * page is asked, not a timer.
 */
export async function settled(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(
          ([prompt, docs]) => {
            if (document.documentElement.hasAttribute("data-intro")) return "under the cover";
            const box = document.querySelector(prompt);
            const style = box ? getComputedStyle(box) : null;
            if (!style || (style.display !== "none" && style.opacity !== "0")) {
              return "the box is there";
            }
            const moving = [...document.querySelectorAll(`${prompt}, ${prompt} *, ${docs}`)]
              .flatMap((element) => element.getAnimations({ subtree: true }))
              .filter((animation) => animation.playState !== "finished").length;
            return moving ? "moving" : "settled";
          },
          [PROMPT, DOCS] as const,
        ),
      { timeout: 20_000 },
    )
    .toBe("settled");
}

/** The opacity, visibility and display of the box and of every document, as computed now. */
export const stageState = (page: Page) =>
  page.evaluate(
    ([prompt, docs]) => {
      const read = (element: Element) => {
        const style = getComputedStyle(element);
        return { opacity: style.opacity, visibility: style.visibility, display: style.display };
      };
      const box = document.querySelector(prompt);
      return {
        prompt: box ? read(box) : null,
        docs: [...document.querySelectorAll(docs)].map(read),
      };
    },
    [PROMPT, DOCS] as const,
  );

/** The delay and the length of the animation an element runs, by the animation's name. */
export const timings = (page: Page, selector: string, name: string) =>
  page.evaluate(
    ([target, wanted]) =>
      [...document.querySelectorAll(target)].map((element) => {
        const animation = element
          .getAnimations()
          .find((entry) => entry instanceof CSSAnimation && entry.animationName === wanted);
        const timing = animation?.effect?.getComputedTiming();
        return timing ? [Number(timing.delay), Number(timing.duration)] : null;
      }),
    [selector, name] as const,
  );
