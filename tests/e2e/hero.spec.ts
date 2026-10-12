import { expect, test, type Page } from "@playwright/test";
import { hydrated, introSeen, NAVIGATION_TIMEOUT } from "./helpers";
import { INK_OFF } from "../../lib/boot/state";
import {
  DOCS,
  PROMPT,
  STAGE,
  recordStage,
  settled,
  stageFrames,
  stageState,
  unsettledFrames,
} from "./support/hero";
import { INK_STORE, recordIntro } from "./support/ink";

// The first screen of the home page: a blank prompt that turns into finished work. The sequence is
// the page's half of the prompt ink scene and plays to live ink only. These projects have no
// graphics card, so the ink here is still: the documents stand from the first frame and there is no
// box. The sequence itself is the subject of ink-live.spec.ts, in the `gpu` project.

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

/** Sets the session's ink choice before any script of the page runs. */
const storeInk = (page: Page, value: string) =>
  page.addInitScript(
    ([key, stored]) => {
      try {
        window.sessionStorage.setItem(key, stored);
      } catch {
        // No storage: the boot script asks the graphics card, and these projects have none.
      }
    },
    [INK_STORE, value] as const,
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
      "One purchase",
    ]);

    // The old right-hand column of open water is gone: the stage is the ink's anchor now.
    await expect(hero.locator("[data-ink-anchor]")).toHaveCount(1);
    await expect(hero.locator(STAGE)).toHaveAttribute("data-ink-anchor", "open");
    // The documents are paper: the stage asks for no calm water behind them.
    await expect(hero.locator(STAGE)).not.toHaveAttribute("data-ink-calm");
    await expect(hero.locator("[data-ink-calm]")).toHaveCount(2);
    await expect(hero.locator('[data-ink-backdrop][data-scene="prompt"]')).toHaveCount(1);
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

  test("with still ink the documents stand from the first frame, within reach of the keyboard, and there is no box", async ({
    page,
  }) => {
    await recordStage(page);
    await page.goto("/");
    // Movement is wanted; it is the ink that is still (no graphics card here).
    await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
    await expect(page.locator("html")).toHaveAttribute("data-ink", "still");

    // The box is in the page, as decoration: a caret and two keys, hidden from assistive
    // technology, and not displayed.
    await expect(page.locator(PROMPT)).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(`${PROMPT} [data-caret]`)).toHaveCount(1);
    await expect(page.locator(`${PROMPT} a, ${PROMPT} button, ${PROMPT} input`)).toHaveCount(0);
    await expect(page.locator(PROMPT)).toBeHidden();

    // The documents can be focused at once, and the keyboard goes from one to the next.
    const docs = page.locator(DOCS);
    await expect(docs).toHaveCount(6);
    for (const doc of await docs.all()) await expect(doc).toBeVisible();
    await docs.first().focus();
    await expect(docs.first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(docs.nth(1)).toBeFocused();

    // The stage is marked as landed once the page's script has run, and stays so.
    await hydrated(page);
    await expect(page.locator(STAGE)).toHaveAttribute("data-landed", "");

    // On no frame since the first, from the load into the seconds the sequence would take, was a
    // document out of sight, the box displayed, or anything of the sequence set going.
    await expect
      .poll(async () => (await stageFrames(page)).at(-1)?.at ?? 0, { timeout: 15_000 })
      .toBeGreaterThan(5000);
    const frames = await stageFrames(page);
    expect(frames.length).toBeGreaterThan(20);
    expect(frames.every((frame) => frame.docs === 6)).toBe(true);
    expect(await unsettledFrames(page)).toEqual([]);
  });

  test("a return to the home page inside the site finds the documents standing", async ({
    page,
  }) => {
    await recordStage(page);
    await page.goto("/");
    await hydrated(page);
    await page.locator(HERO).getByRole("link", { name: "Get the toolkit", exact: true }).click();
    await expect(page).toHaveURL(/\/purchase$/, { timeout: NAVIGATION_TIMEOUT });
    await expect(page.locator(STAGE)).toHaveCount(0);
    const from = (await stageFrames(page)).length;

    await page.goBack();
    await expect(page).toHaveURL(/\/$/, { timeout: NAVIGATION_TIMEOUT });
    await expect(page.locator(STAGE)).toHaveAttribute("data-landed", "");
    await expect
      .poll(async () => (await stageFrames(page)).length, { timeout: 10_000 })
      .toBeGreaterThan(from + 12);
    expect(await unsettledFrames(page)).toEqual([]);
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
        // Everything the band holds ends where the band does (the ink's own layers apart, which
        // the backdrop clips).
        const past = [...band.querySelectorAll("*")]
          .filter((element) => !element.closest("[data-ink-backdrop]"))
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
  });

  test("keeps the headline's contrast over the still", async ({ page }) => {
    // The ink is off for the session, so the still is the picture behind the words.
    await storeInk(page, INK_OFF);
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
  test("with still ink the documents already stand under the cover, and nothing starts when it has gone", async ({
    page,
  }) => {
    await recordIntro(page);
    await recordStage(page);
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("[data-intro-cover]")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-ink", "still");

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

    // A second later the stage is as it was on every frame under the cover and since: the
    // documents in place, no box, nothing of the sequence.
    await expect
      .poll(async () => (await stageFrames(page)).at(-1)?.at ?? 0, { timeout: 10_000 })
      .toBeGreaterThan(gone + 1000);
    const frames = await stageFrames(page);
    expect(frames.filter((frame) => frame.at < gone).length).toBeGreaterThan(10);
    expect(await unsettledFrames(page)).toEqual([]);
    await expect(page.locator(PROMPT)).toBeHidden();
    for (const doc of await page.locator(DOCS).all()) await expect(doc).toBeVisible();
  });
});
