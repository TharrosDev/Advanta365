import { expect, test, type Page } from "@playwright/test";
import { hydrated, introSeen, NAVIGATION_TIMEOUT } from "./helpers";
import { INK_OFF } from "../../lib/boot/state";
import { INK_STORE, pageClock, recordIntro } from "./support/ink";

// The first screen of the home page: a blank prompt that turns into finished work. The sequence is
// CSS on one clock, which starts when the root element has no `data-intro`; what a clock decides is
// read from the animations themselves or polled on the page's own clock, never slept for.

/** The six free samples, by slug, with the title each cover prints and each link is named by. */
const SAMPLES: Record<string, string> = {
  "executive-sponsor-kickoff-deck": "Executive Sponsor Kickoff Deck",
  "change-management-strategy": "Change Management Strategy",
  "sharepoint-governance-framework": "SharePoint Governance Framework",
  "sharepoint-end-user-training-deck": "SharePoint End-User Training Deck",
  "master-communications-plan": "Master Communications Plan",
  "go-live-readiness-checklist": "Go/No-Go Decision Checklist",
};

declare global {
  interface Window {
    /** Each animation of the sequence as it started: its name, delay, length and start time. */
    __heroSequence?: Array<[string, number, number, number]>;
  }
}

const HERO = "[data-band]:has(h1)";
const STAGE = "[data-hero-stage]";
const PROMPT = "[data-hero-prompt]";
const DOCS = "[data-hero-doc]";

/** The opacity and visibility of the box and of every document, as computed now. */
const stageState = (page: Page) =>
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
const timings = (page: Page, selector: string, name: string) =>
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

test.describe("the hero", () => {
  test.beforeEach(async ({ page }) => {
    await introSeen(page);
  });

  test("is the headline, the lead, two buttons, the stage and the proof strip", async ({
    page,
  }) => {
    await page.goto("/");
    const hero = page.locator(HERO);
    await expect(hero).toHaveCount(1);
    await expect(hero).toHaveAttribute("data-band", "paper");
    await expect(hero.getByRole("heading", { level: 1 })).toHaveText(
      "Don’t start your M365 rollout from a blank prompt.",
    );
    await expect(hero.locator("h1 [data-mark]")).toHaveText("blank prompt.");

    // The lead keeps what the offer rests on.
    const lead = hero.locator("p").first();
    for (const words of [
      "real SharePoint Online rollouts",
      "30+ years",
      "Prosci-certified practitioner",
      "ready to use as is or tailor with AI",
    ]) {
      await expect(lead).toContainText(words);
    }

    const buy = hero.getByRole("link", { name: "Get the toolkit", exact: true });
    const samples = hero.getByRole("link", { name: "See the free samples", exact: true });
    await expect(buy).toHaveAttribute("href", "/purchase");
    await expect(samples).toHaveAttribute("href", "/catalog?free=1");

    // The proof strip is a list of four facts, with the toolkit's own numbers.
    const proof = hero.getByRole("list", { name: "The toolkit in numbers" });
    await expect(proof.getByRole("listitem")).toHaveText([
      "30+ years",
      "59 playbooks",
      "130 templates",
      "One purchase",
    ]);

    // The old right-hand column of open water is gone: the stage is the ink's anchor now.
    await expect(hero.locator("[data-ink-anchor]")).toHaveCount(1);
    await expect(hero.locator(STAGE)).toHaveAttribute("data-ink-anchor", "open");
    await expect(hero.locator(STAGE)).toHaveAttribute("data-ink-calm", "display");
    await expect(hero.locator('[data-ink-backdrop][data-scene="prompt"]')).toHaveCount(1);
  });

  test("holds the six free samples as six links, named by their titles, left to right", async ({
    page,
  }) => {
    await page.goto("/");
    const docs = page.locator(`${STAGE} ${DOCS}`);
    await expect(docs).toHaveCount(6);

    const found = await docs.evaluateAll((links) =>
      links.map((link) => ({
        name: link.getAttribute("aria-label"),
        href: link.getAttribute("href"),
        // The cover prints the same title the link is named by.
        printed: link
          .querySelector("[data-cover]")
          ?.textContent?.includes(link.getAttribute("aria-label") ?? "\u0000"),
        lit: link.querySelector("[data-cover]")?.hasAttribute("data-lit"),
        centre: link.getBoundingClientRect().left + link.getBoundingClientRect().width / 2,
      })),
    );
    expect(found.map((doc) => doc.name).sort()).toEqual(Object.values(SAMPLES).sort());
    for (const doc of found) {
      const slug = Object.keys(SAMPLES).find((key) => SAMPLES[key] === doc.name);
      expect(doc.href, doc.name ?? "").toBe(`/catalog?view=${slug}`);
      expect(doc.printed, doc.name ?? "").toBe(true);
      expect(doc.lit, doc.name ?? "").toBe(true);
    }
    // The order in the document, which is the tab order, is the order on the page.
    const centres = found.map((doc) => doc.centre);
    expect(centres).toEqual([...centres].sort((a, b) => a - b));

    // They are fanned: −9, −5, −2, 2, 5 and 9 degrees, the middle two standing highest.
    const hand = await page.locator(`${STAGE} li`).evaluateAll((items) =>
      items.map((item) => {
        const box = item.getBoundingClientRect();
        return { turn: getComputedStyle(item).rotate, middle: box.top + box.height / 2 };
      }),
    );
    expect(hand.map((item) => item.turn)).toEqual([
      "-9deg",
      "-5deg",
      "-2deg",
      "2deg",
      "5deg",
      "9deg",
    ]);
    const middles = hand.map((item) => item.middle);
    expect(Math.max(middles[2] ?? 0, middles[3] ?? 0)).toBeLessThan(
      Math.min(middles[0] ?? 0, middles[1] ?? 0, middles[4] ?? 0, middles[5] ?? 0),
    );
    // And they overlap: each begins before the one to its left has ended.
    const edges = await docs.evaluateAll((links) =>
      links.map((link) => {
        const box = link.getBoundingClientRect();
        return [box.left, box.right];
      }),
    );
    for (let index = 1; index < edges.length; index += 1) {
      expect(edges[index]?.[0] ?? Infinity).toBeLessThan(edges[index - 1]?.[1] ?? -Infinity);
    }
  });

  test("every document opens its sample's pop-up in the catalog", async ({ page }) => {
    // Six navigations to the catalog and back in one test.
    test.slow();
    for (const [slug, title] of Object.entries(SAMPLES)) {
      await page.goto("/");
      await hydrated(page);
      const doc = page.getByRole("link", { name: title, exact: true }).and(page.locator(DOCS));
      // By the keyboard: a document may lie half under its neighbour, and focus brings it forward.
      await expect(doc).toBeVisible();
      await doc.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/catalog\\?view=${slug}$`), {
        timeout: NAVIGATION_TIMEOUT,
      });
      await expect(page.getByRole("dialog", { name: title })).toBeVisible();
    }
  });

  test("the document on top opens under the pointer too, and a focused one comes to the front", async ({
    page,
  }) => {
    await page.goto("/");
    await hydrated(page);
    const docs = page.locator(DOCS);
    await expect(docs.last()).toBeVisible();

    // A key press first, so that focus moved by script counts as keyboard focus.
    await page.keyboard.press("Tab");
    await docs.first().focus();
    const first = page.locator(`${STAGE} li`).first();
    await expect(first).toHaveCSS("z-index", "6");
    await expect(docs.first()).toHaveCSS("outline-style", "solid");
    await expect(docs.first()).toHaveCSS("outline-width", "3px");

    const title = (await docs.last().getAttribute("aria-label")) ?? "";
    await docs.last().click();
    await expect(page).toHaveURL(/\/catalog\?view=[a-z0-9-]+$/, { timeout: NAVIGATION_TIMEOUT });
    await expect(page.getByRole("dialog", { name: title })).toBeVisible();
  });

  test("plays its sequence once: the box holds 400ms and dissolves by 1600ms, the documents settle from 2400ms", async ({
    page,
  }) => {
    // Every animation of the sequence is noted as it starts, with its own delay and length and
    // the moment on the document's timeline it was set going: no clock of the machine is in them,
    // and a test that gets round to looking late still sees them.
    await page.addInitScript(() => {
      const seen: Array<[string, number, number, number]> = [];
      window.__heroSequence = seen;
      document.addEventListener(
        "animationstart",
        (event) => {
          if (!(event.target instanceof Element)) return;
          const animation = event.target
            .getAnimations()
            .find(
              (entry) =>
                entry instanceof CSSAnimation && entry.animationName === event.animationName,
            );
          const timing = animation?.effect?.getComputedTiming();
          if (!animation || !timing) return;
          seen.push([
            event.animationName,
            Number(timing.delay),
            Number(timing.duration),
            Number(animation.startTime),
          ]);
        },
        true,
      );
    });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
    // The box is decoration: a caret and two keys, hidden from assistive technology.
    await expect(page.locator(PROMPT)).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(`${PROMPT} [data-caret]`)).toHaveCount(1);
    await expect(page.locator(`${PROMPT} a, ${PROMPT} button, ${PROMPT} input`)).toHaveCount(0);

    // 4500ms after the page began, the box is gone and every document stands.
    await expect.poll(() => pageClock(page), { timeout: 15_000 }).toBeGreaterThan(4500);
    const state = await stageState(page);
    expect(state.prompt).toMatchObject({ opacity: "0", visibility: "hidden" });
    expect(state.docs).toHaveLength(6);
    for (const doc of state.docs)
      expect(doc).toMatchObject({ opacity: "1", visibility: "visible" });
    // Nothing of the sequence is left running or repeating.
    expect(await timings(page, PROMPT, "hero-prompt-out")).toEqual([null]);
    expect(await timings(page, DOCS, "hero-doc-in")).toEqual(Array(6).fill(null));

    // What ran: the box once, from 400ms for 1200ms; the six documents once each, from 2400ms,
    // 110ms apart, 560ms each. All of it was set going at one moment.
    const sequence = await page.evaluate(() => window.__heroSequence ?? []);
    const box = sequence.filter(([name]) => name === "hero-prompt-out");
    const docs = sequence.filter(([name]) => name === "hero-doc-in");
    expect(box.map(([, delay, duration]) => [delay, duration])).toEqual([[400, 1200]]);
    expect(docs.map(([, delay, duration]) => [delay, duration])).toEqual(
      [0, 1, 2, 3, 4, 5].map((index) => [2400 + index * 110, 560]),
    );
    const starts = [...box, ...docs].map(([, , , start]) => start);
    expect(Math.max(...starts) - Math.min(...starts)).toBeLessThanOrEqual(50);
  });

  test("fills the first screen at 1440 by 900, with the proof strip above the fold", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a desktop window");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect.poll(() => pageClock(page), { timeout: 15_000 }).toBeGreaterThan(4500);
    const measured = await page.evaluate((selector) => {
      const band = document.querySelector(selector);
      const strip = band?.querySelector("ul[aria-label]");
      const hand = band?.querySelector("[data-hero-stage] ul");
      const titles = [...(band?.querySelectorAll("[data-hero-doc] [data-cover]") ?? [])].map(
        (cover) => {
          const title = cover.querySelector("span > span > span");
          return title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0;
        },
      );
      return {
        window: window.innerHeight,
        band: band?.getBoundingClientRect().height ?? 0,
        stripBottom: strip?.getBoundingClientRect().bottom ?? Infinity,
        handBottom: hand?.getBoundingClientRect().bottom ?? Infinity,
        titles,
      };
    }, HERO);
    expect(measured.band).toBeGreaterThanOrEqual(0.85 * measured.window);
    // Nothing of the first screen is cut off by the fold.
    expect(measured.handBottom).toBeLessThanOrEqual(measured.window);
    expect(measured.stripBottom).toBeLessThanOrEqual(measured.window);
    // The titles on the covers are large enough to read.
    expect(measured.titles).toHaveLength(6);
    for (const size of measured.titles) expect(size).toBeGreaterThanOrEqual(11);
  });

  test("at 320px nothing in it runs past the screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/");
    await expect.poll(() => pageClock(page), { timeout: 15_000 }).toBeGreaterThan(4500);
    const outside = await page.evaluate((selector) => {
      const band = document.querySelector(selector);
      const width = document.documentElement.clientWidth;
      return [...(band?.querySelectorAll("*") ?? [])]
        .filter((element) => {
          if (element.closest("[data-ink-backdrop]")) return false;
          const box = element.getBoundingClientRect();
          if (!box.width || !box.height) return false;
          return box.left < -0.5 || box.right > width + 0.5;
        })
        .map((element) => `${element.localName}.${element.getAttribute("class") ?? ""}`);
    }, HERO);
    expect(outside).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    // Each document is still a target of 44px and more.
    const sizes = await page.locator(DOCS).evaluateAll((links) =>
      links.map((link) => {
        const box = link.getBoundingClientRect();
        return Math.min(box.width, box.height);
      }),
    );
    for (const size of sizes) expect(size).toBeGreaterThanOrEqual(44);
  });

  test("keeps the headline's contrast over the still", async ({ page }) => {
    // The ink is off for the session, so the still is the picture behind the words.
    await page.addInitScript(
      ([key, off]) => {
        try {
          window.sessionStorage.setItem(key, off);
        } catch {
          // No storage: the default projects have no graphics card, so the still shows anyway.
        }
      },
      [INK_STORE, INK_OFF] as const,
    );
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-ink", "still");
    const image = page.locator('[data-ink-backdrop][data-scene="prompt"] img');
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThan(0);

    const contrast = await page.evaluate(async () => {
      const img = document.querySelector<HTMLImageElement>(
        '[data-ink-backdrop][data-scene="prompt"] img',
      );
      const heading = document.querySelector("h1");
      if (!img || !heading) return null;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return null;
      context.drawImage(img, 0, 0);
      const shown = img.getBoundingClientRect();
      const words = heading.getBoundingClientRect();
      const scale = img.naturalWidth / shown.width;
      const x0 = Math.max(0, Math.floor((words.left - shown.left) * scale));
      const y0 = Math.max(0, Math.floor((words.top - shown.top) * scale));
      const x1 = Math.min(img.naturalWidth, Math.ceil((words.right - shown.left) * scale));
      const y1 = Math.min(img.naturalHeight, Math.ceil((words.bottom - shown.top) * scale));
      const linear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const luminance = (r: number, g: number, b: number) =>
        0.2126 * linear(r / 255) + 0.7152 * linear(g / 255) + 0.0722 * linear(b / 255);
      // Where the frame does not reach, the ground of the band shows: paper.
      let darkest = 1;
      if (x1 > x0 && y1 > y0) {
        const { data } = context.getImageData(x0, y0, x1 - x0, y1 - y0);
        for (let i = 0; i < data.length; i += 4) {
          darkest = Math.min(
            darkest,
            luminance(data[i] ?? 255, data[i + 1] ?? 255, data[i + 2] ?? 255),
          );
        }
      }
      const [r = 0, g = 0, b = 0] = (getComputedStyle(heading).color.match(/\d+/g) ?? []).map(
        Number,
      );
      return (darkest + 0.05) / (luminance(r, g, b) + 0.05);
    });
    expect(contrast).not.toBeNull();
    // Large text needs 3 to 1; the calm zone promises far more.
    expect(contrast ?? 0).toBeGreaterThanOrEqual(7);
  });
});

test.describe("the hero without movement", () => {
  test("under reduced motion the documents stand from the start and there is no box", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "on");
    const state = await stageState(page);
    expect(state.prompt).toMatchObject({ display: "none" });
    expect(state.docs).toHaveLength(6);
    for (const doc of state.docs)
      expect(doc).toMatchObject({ opacity: "1", visibility: "visible" });
    await expect(page.locator(PROMPT)).toBeHidden();
    await expect(page.locator(DOCS).first()).toBeVisible();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });

  test("without JavaScript the documents stand and are links", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      await page.goto("/");
      await expect(page.locator(PROMPT)).toBeHidden();
      const docs = page.locator(DOCS);
      await expect(docs).toHaveCount(6);
      for (const doc of await docs.all()) await expect(doc).toBeVisible();
      await expect(docs.first()).toHaveAttribute("href", /^\/catalog\?view=/);
    } finally {
      await context.close();
    }
  });
});

test.describe("the hero on a first visit", () => {
  test("waits under the cover with its box, and starts its clock when the cover has gone", async ({
    page,
  }) => {
    await recordIntro(page);
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("[data-intro-cover]")).toBeVisible();

    // Under the cover: the opening state, with nothing of the sequence running.
    const under = await page.evaluate(
      ([prompt, docs]) => {
        if (!document.documentElement.hasAttribute("data-intro")) return null;
        const box = document.querySelector(prompt);
        return {
          box: box ? getComputedStyle(box).opacity : null,
          docs: [...document.querySelectorAll(docs)].map((doc) => getComputedStyle(doc).visibility),
          running: [...document.querySelectorAll(`${prompt}, ${docs}`)].flatMap((element) =>
            element.getAnimations(),
          ).length,
        };
      },
      [PROMPT, DOCS] as const,
    );
    test.skip(under === null, "the cover had already gone when the page was first read");
    expect(under).toEqual({ box: "1", docs: Array(6).fill("hidden"), running: 0 });

    // When the cover has gone the sequence runs, from that moment: 4500ms later it is over.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const last = (window.__introLog ?? []).at(-1);
            return last ? last[1] === null : false;
          }),
        { timeout: 15_000 },
      )
      .toBe(true);
    const gone = await page.evaluate(() => (window.__introLog ?? []).at(-1)?.[0] ?? 0);
    const early = await stageState(page);
    if ((await pageClock(page)) - gone < 2300) {
      // Still inside the first 2.4 seconds: no document has shown yet.
      for (const doc of early.docs) expect(doc.opacity).toBe("0");
    }
    await expect.poll(() => pageClock(page), { timeout: 15_000 }).toBeGreaterThan(gone + 4500);
    const state = await stageState(page);
    expect(state.prompt).toMatchObject({ opacity: "0" });
    for (const doc of state.docs)
      expect(doc).toMatchObject({ opacity: "1", visibility: "visible" });
  });
});
