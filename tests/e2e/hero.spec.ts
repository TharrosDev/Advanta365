import { expect, type Page, test } from "@playwright/test";
import { hydrated, introSeen, NAVIGATION_TIMEOUT } from "./helpers";
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
import { recordIntro } from "./support/intro";

// The first screen of the home page: a blank prompt that turns into finished work. Where movement is
// wanted the box stands empty, dissolves, and the six documents land; under reduced motion or
// without a script there is no box and the documents stand from the first frame.

/** The headline's last word, a split-flap board. */
const BOARD = "[data-split-flap]";

/** The word the board shows, without the zero-width blanks of its empty cells or its full stop. */
const boardWord = (page: Page) =>
  page.locator(BOARD).evaluate((board) => (board.textContent ?? "").replace(/[\u200b.]/g, ""));

/** The six free samples, by slug, with the title each cover prints and each link is named by. */
const SAMPLES: Record<string, string> = {
  "executive-sponsor-kickoff-deck": "Executive Sponsor Kickoff Deck",
  "change-management-strategy": "Change Management Strategy",
  "sharepoint-governance-framework": "SharePoint Governance Framework",
  "sharepoint-end-user-training-deck": "SharePoint End-User Training Deck",
  "master-communications-plan": "Master Communications Plan",
  "go-live-readiness-checklist": "Go/No-Go Decision Checklist",
};

const HERO = "[data-band]:has(h1)";

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
    // The heading is read with its first blank, whichever word the split-flap board shows.
    await expect(hero.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      "Don’t start your M365 rollout from a blank prompt.",
    );
    await expect(hero.locator(`h1 [data-mark] ${BOARD}`)).toHaveAttribute("aria-hidden", "true");
    expect(await boardWord(page)).toBe("prompt");

    // The lead keeps what the offer rests on.
    const lead = hero.locator("p").first();
    for (const words of [
      "change management and user adoption toolkit",
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
      "58 job aids",
    ]);

    // Nothing lies behind the words: no canvas. The stage holds one prompt box.
    await expect(hero.locator(STAGE)).toHaveCount(1);
    await expect(hero.locator(PROMPT)).toHaveCount(1);
    await expect(hero.locator("canvas")).toHaveCount(0);
  });

  test("holds the six free samples as six links, named by their titles, left to right", async ({
    page,
    isMobile,
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
    // What follows is the one long hand of a window from 40em.
    if (isMobile) return;

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
      await settled(page);
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
    await settled(page);
    await expect(docs.last()).toBeVisible();

    // A key press first, so that focus moved by script counts as keyboard focus.
    await page.keyboard.press("Tab");
    await docs.first().focus();
    const first = page.locator(`${STAGE} li`).first();
    await expect(first).toHaveCSS("z-index", "7");
    await expect(docs.first()).toHaveCSS("outline-style", "solid");
    await expect(docs.first()).toHaveCSS("outline-width", "3px");

    const title = (await docs.last().getAttribute("aria-label")) ?? "";
    await docs.last().click();
    await expect(page).toHaveURL(/\/catalog\?view=[a-z0-9-]+$/, { timeout: NAVIGATION_TIMEOUT });
    await expect(page.getByRole("dialog", { name: title })).toBeVisible();
  });

  test("plays once: the box stands empty, dissolves from 700ms to 1500ms, and the documents land from 1300ms", async ({
    page,
  }) => {
    await recordSequence(page);
    await page.goto("/");
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

    // What ran: the box once, from 700ms for 800ms; its caret, which is on at the start; the six
    // documents once each, from 1300ms, 110ms apart, 560ms each, the middle two first; and with
    // each its showing, which takes 90ms. All of it was set going at one moment.
    const ran = await sequence(page);
    const box = ran.filter(([name]) => name === "hero-prompt-out");
    const caret = ran.filter(([name]) => name === "hero-caret-blink");
    const docs = ran.filter(([name]) => name === "hero-doc-in");
    const shown = ran.filter(([name]) => name === "hero-doc-show");
    expect(box.map(([, delay, duration]) => [delay, duration])).toEqual([[700, 800]]);
    expect(caret.map(([, delay, duration]) => [delay, duration])).toEqual([[0, 1500]]);
    expect(docs.map(([, delay, duration]) => [delay, duration])).toEqual(
      [0, 1, 2, 3, 4, 5].map((index) => [1300 + index * 110, 560]),
    );
    expect(shown.map(([, delay, duration]) => [delay, duration])).toEqual(
      [0, 1, 2, 3, 4, 5].map((index) => [1300 + index * 110, 90]),
    );
    const starts = [...box, ...docs].map(([, , , start]) => start);
    expect(Math.max(...starts) - Math.min(...starts)).toBeLessThanOrEqual(50);

    // The documents can then be focused, and the keyboard goes from one to the next.
    const links = page.locator(DOCS);
    await links.first().focus();
    await expect(links.first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(links.nth(1)).toBeFocused();
  });

  test("plays again on a return to the home page inside the site", async ({ page }) => {
    await recordStage(page);
    await page.goto("/");
    await hydrated(page);
    await settled(page);
    await page.locator(HERO).getByRole("link", { name: "Get the toolkit", exact: true }).click();
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
    await settled(page);
    for (const doc of await page.locator(DOCS).all()) await expect(doc).toBeVisible();
  });

  for (const [width, height] of [
    [1366, 768],
    [1280, 720],
    [1536, 864],
    [1440, 770],
    [1920, 1080],
  ] as const) {
    test(`the whole first screen fits a window of ${width} by ${height}`, async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "a desktop window");
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await settled(page);
      const fit = await page.evaluate((selector) => {
        const band = document.querySelector(selector);
        const box = (element: Element | null | undefined) => element?.getBoundingClientRect();
        const heading = band?.querySelector("h1");
        const docs = [...(band?.querySelectorAll("[data-hero-doc]") ?? [])].map(box);
        return {
          window: window.innerHeight,
          bandTop: box(band)?.top ?? -1,
          headingLines:
            (box(heading)?.height ?? 0) /
            Number.parseFloat(heading ? getComputedStyle(heading).lineHeight : "1"),
          leadBottom: box(band?.querySelector("p"))?.bottom ?? Infinity,
          buttonsTop: box(band?.querySelector("a[href='/purchase']"))?.top ?? -Infinity,
          buttonsBottom: box(band?.querySelector("a[href='/purchase']"))?.bottom ?? Infinity,
          docsTop: Math.min(...docs.map((doc) => doc?.top ?? -Infinity)),
          docsBottom: Math.max(...docs.map((doc) => doc?.bottom ?? Infinity)),
          stripTop: box(band?.querySelector("ul[aria-label]"))?.top ?? -Infinity,
          stripBottom: box(band?.querySelector("ul[aria-label]"))?.bottom ?? Infinity,
        };
      }, HERO);
      // The headline keeps to two lines, and each part stands clear of the next, in order.
      expect(fit.headingLines).toBeLessThan(2.3);
      expect(fit.bandTop).toBeGreaterThanOrEqual(0);
      expect(fit.buttonsTop).toBeGreaterThanOrEqual(fit.leadBottom);
      expect(fit.docsTop).toBeGreaterThanOrEqual(fit.buttonsBottom);
      expect(fit.stripTop).toBeGreaterThanOrEqual(fit.docsBottom);
      // And the last of them, the proof strip, ends above the fold.
      expect(fit.stripBottom).toBeLessThanOrEqual(fit.window);
    });
  }

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 640],
  ] as const) {
    test(`at ${width}px no title and no tag is cut by a neighbour, and each document keeps 44px of its own`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await settled(page);
      await page.locator(STAGE).scrollIntoViewIfNeeded();
      await page.evaluate(() => {
        const stage = document.querySelector("[data-hero-stage]");
        stage?.scrollIntoView({ block: "center", behavior: "instant" });
      });
      const report = await page.locator(DOCS).evaluateAll((links) => {
        const owner = (x: number, y: number) =>
          document.elementFromPoint(x, y)?.closest("[data-hero-doc]") ?? null;
        return links.map((link) => {
          const name = link.getAttribute("aria-label") ?? "";
          // The words as they are drawn: every line box of the title, and the tag.
          const title = [...link.querySelectorAll("[data-cover] span")].find(
            (span) => span.textContent === name && span.children.length === 0,
          );
          const tag = [...link.querySelectorAll("[data-cover] span")].find((span) =>
            /^(DOCX|PPTX|XLSX|PDF)$/.test(span.textContent ?? ""),
          );
          const range = document.createRange();
          const covered: string[] = [];
          const probe = (label: string, rects: Iterable<DOMRect>) => {
            for (const rect of rects) {
              if (rect.width < 1 || rect.height < 1) continue;
              for (const [fx, fy] of [
                [0.02, 0.5],
                [0.5, 0.5],
                [0.98, 0.5],
                [0.5, 0.1],
                [0.5, 0.9],
              ] as const) {
                const x = rect.left + rect.width * fx;
                const y = rect.top + rect.height * fy;
                if (owner(x, y) !== link)
                  covered.push(`${label} at ${Math.round(x)},${Math.round(y)}`);
              }
            }
          };
          if (title?.firstChild) {
            range.selectNodeContents(title);
            probe("title", range.getClientRects());
            // And the title is not cut by its own box either: every word of it is laid out.
            const line = Number.parseFloat(getComputedStyle(title).fontSize);
            if (title.scrollHeight > title.clientHeight + line / 2) covered.push("title clamped");
          } else covered.push("no title");
          if (tag && getComputedStyle(tag).display !== "none")
            probe("tag", [tag.getBoundingClientRect()]);

          // The widest run of points, along any of five lines across the document, that are the
          // document's own: what a finger has to aim at.
          const box = link.getBoundingClientRect();
          let own = 0;
          for (const fy of [0.15, 0.3, 0.5, 0.7, 0.85]) {
            let run = 0;
            for (let x = box.left; x <= box.right; x += 1) {
              run = owner(x, box.top + box.height * fy) === link ? run + 1 : 0;
              own = Math.max(own, run);
            }
          }
          return { name, covered, own, height: box.height };
        });
      });
      expect(report).toHaveLength(6);
      for (const doc of report) {
        expect(doc.covered, doc.name).toEqual([]);
        expect(doc.own, doc.name).toBeGreaterThanOrEqual(44);
        expect(doc.height, doc.name).toBeGreaterThanOrEqual(44);
      }
    });
  }

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ] as const) {
    test(`at ${width}px the band ends at its own bottom edge: the section after it is not covered`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await settled(page);
      const heading = page.locator("#featured").getByRole("heading").first();
      await expect(heading).toHaveText("The six free samples, one by one");
      const hit = await page.evaluate((selector) => {
        const band = document.querySelector(selector);
        const title = document.querySelector("#featured h2, #featured h3");
        if (!band || !title) return null;
        // The foot of the band and the head of the next one in the middle of the window.
        const edge = band.getBoundingClientRect().bottom + window.scrollY;
        window.scrollTo({ top: edge - window.innerHeight / 2, behavior: "instant" });
        const bottom = band.getBoundingClientRect().bottom;
        const box = title.getBoundingClientRect();
        const at = (x: number, y: number) => document.elementFromPoint(x, y);
        const centre = at(box.left + box.width / 2, box.top + box.height / 2);
        // Everything the band holds ends where the band does.
        const past = [...band.querySelectorAll("*")]
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.height > 0 && rect.bottom > bottom + 0.5;
          })
          .map((element) => `${element.localName}.${element.getAttribute("class") ?? ""}`);
        // And nothing drawn by it lies under its bottom edge: at five points across the window,
        // 2px, 24px and 120px below the edge, the page is some other band's.
        const under: string[] = [];
        for (const share of [0.02, 0.25, 0.5, 0.75, 0.98]) {
          for (const below of [2, 24, 120]) {
            const found = at(window.innerWidth * share, bottom + below);
            if (found && band.contains(found)) under.push(`${share} +${below}: ${found.localName}`);
          }
        }
        return {
          titleIsHit: !!centre && (centre === title || title.contains(centre)),
          hitBy: centre ? `${centre.localName}.${centre.getAttribute("class") ?? ""}` : "nothing",
          past,
          under,
        };
      }, HERO);
      expect(hit).not.toBeNull();
      expect(hit?.titleIsHit, hit?.hitBy).toBe(true);
      expect(hit?.past).toEqual([]);
      expect(hit?.under).toEqual([]);
    });
  }

  test("below 40em the six are two hands of three, one under the other", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const boxes = await page.locator(DOCS).evaluateAll((links) =>
      links.map((link) => {
        const box = link.getBoundingClientRect();
        return {
          left: box.left,
          middle: box.top + box.height / 2,
          bottom: box.bottom,
          top: box.top,
        };
      }),
    );
    const first = boxes.slice(0, 3);
    const second = boxes.slice(3);
    expect(Math.max(...first.map((box) => box.bottom))).toBeLessThanOrEqual(
      Math.min(...second.map((box) => box.top)) + 1,
    );
    for (const row of [first, second]) {
      const lefts = row.map((box) => box.left);
      expect(lefts).toEqual([...lefts].sort((a, b) => a - b));
    }
  });

  test("fills the first screen at 1440 by 900, with the proof strip above the fold", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a desktop window");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await settled(page);
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
    for (const size of measured.titles) expect(size).toBeGreaterThanOrEqual(13);
  });

  test("at 320px nothing in it runs past the screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/");
    await settled(page);
    const outside = await page.evaluate((selector) => {
      const band = document.querySelector(selector);
      const width = document.documentElement.clientWidth;
      return [...(band?.querySelectorAll("*") ?? [])]
        .filter((element) => {
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
  });

  test("turns the headline's blank, letter by letter, from prompt to sheet", async ({ page }) => {
    await page.goto("/");
    await hydrated(page);
    expect(await boardWord(page)).toBe("prompt");
    // A letter mid-fall is drawn twice: its falling flap and the half it uncovers.
    await expect(page.locator(`${BOARD} [data-flap]`).first()).toBeAttached({ timeout: 10_000 });
    await expect.poll(() => boardWord(page), { timeout: 10_000 }).toBe("sheet");
    // The heading is still read with its first blank.
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      "Don’t start your M365 rollout from a blank prompt.",
    );
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
    // Polled, as in reduced-motion.spec.ts: the safety net in globals.css shortens any transition
    // to 0.01ms, and one may be caught in flight.
    await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
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

  test("keeps the headline's blank still under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await hydrated(page);
    // The board is only measured, and only turns, where movement is wanted.
    await expect(page.locator(`${BOARD} [data-flap-cell][style]`)).toHaveCount(0);
    expect(await boardWord(page)).toBe("prompt");
  });
});

test.describe("the hero on a first visit", () => {
  test("waits under the cover with its box, and starts its clock when the cover has gone", async ({
    page,
  }) => {
    await recordIntro(page);
    await recordSequence(page);
    await recordStage(page);
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("[data-intro-cover]")).toBeVisible();

    // The cover plays and leaves.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const log = window.__introLog ?? [];
            return log.length > 0 && log.at(-1)?.[1] === null;
          }),
        { timeout: 15_000 },
      )
      .toBe(true);
    const gone = await page.evaluate(() => (window.__introLog ?? []).at(-1)?.[0] ?? Infinity);

    // Under the cover, on every frame: the opening state, the box there and the documents out of
    // sight, with nothing of the sequence running.
    await settled(page);
    const frames = (await stageFrames(page)).filter((frame) => frame.docs === 6);
    const under = frames.filter((frame) => frame.at < gone);
    expect(under.length).toBeGreaterThan(10);
    expect(under.filter((frame) => !frame.box || frame.hidden !== 6 || frame.moving > 0)).toEqual(
      [],
    );

    // The sequence was set going as the cover went, with the delays it always has.
    const docs = (await sequence(page)).filter(([name]) => name === "hero-doc-in");
    expect(docs.map(([, delay]) => delay)).toEqual(
      [0, 1, 2, 3, 4, 5].map((index) => 1300 + index * 110),
    );
    for (const [, , , start] of docs) {
      expect(start - gone).toBeGreaterThanOrEqual(-20);
      expect(start - gone).toBeLessThanOrEqual(375);
    }

    // And it ran to its end.
    const state = await stageState(page);
    expect(state.prompt).toMatchObject({ opacity: "0" });
    for (const doc of state.docs)
      expect(doc).toMatchObject({ opacity: "1", visibility: "visible" });
  });
});
