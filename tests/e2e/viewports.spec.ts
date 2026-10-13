import { expect, test } from "@playwright/test";
import { hydrated, introSeen } from "./helpers";
import { settled } from "./support/hero";

// One geometry check for every page at every window the site is built for: phones, tablets and the
// computer monitors from a 1280 laptop to a 3840 4K panel. It measures, it does not photograph:
//   - nothing that is drawn runs past the window's edge (the frame clips sideways, so scrollWidth
//     cannot tell, and the elements themselves are measured);
//   - the words of the page span a good share of the window, so a large monitor is used and not
//     left as a narrow column in the middle of a wide desk;
//   - the page has its one title and no console error.
// A visually hidden element is a clipped 1px box and a row that scrolls sideways on purpose (the
// phones' phase strip) is measured as the row, not by what scrolls inside it.

const ROUTES = [
  "/",
  "/catalog",
  "/phases/plan",
  "/purchase",
  "/why-advanta",
  "/contact",
  "/privacy",
  "/terms",
  "/refunds",
  "/accessibility",
  "/sample",
  "/nope",
];

const SIZES: ReadonlyArray<readonly [number, number]> = [
  [320, 640],
  [390, 844],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1087, 800],
  [1088, 800],
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1536, 864],
  [1680, 1050],
  [1920, 1080],
  [2560, 1440],
  [3440, 1440],
  [3840, 2160],
];

/** The least share of the window the words of a page span, from 1280 up. */
const MIN_SPAN = 0.5;

/** The 404 sets its few words in six columns on purpose, so it has no span to hold. */
const NARROW_BY_DESIGN = new Set(["/nope"]);

for (const [width, height] of SIZES) {
  for (const route of ROUTES) {
    test(`${route} at ${width}x${height}`, async ({ page, isMobile }) => {
      test.skip(isMobile, "the sizes are set here, the desktop project runs them");
      await introSeen(page);
      await page.setViewportSize({ width, height });
      const problems: string[] = [];
      page.on("pageerror", (error) => problems.push(String(error)));
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        // The 404's own document answers 404, and the browser logs that.
        if (route === "/nope" && /status of 404/.test(message.text())) return;
        problems.push(message.text());
      });

      await page.goto(route);
      await hydrated(page);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      // The page is measured at rest: the hero's documents land from a little large, and the
      // first of them is clipped by its band while it does.
      if (route === "/") await settled(page);

      const measure = await page.evaluate(() => {
        const window_ = document.documentElement.clientWidth;
        // A visually hidden box is a clipped pixel.
        const hidden = (element: Element) => !!element.closest(".visually-hidden");
        const scrolls = (element: Element) =>
          ["auto", "scroll"].includes(getComputedStyle(element).overflowX);

        const outside: string[] = [];
        for (const element of document.querySelectorAll("header *, main *, footer *")) {
          const box = element.getBoundingClientRect();
          if (!box.width || !box.height || hidden(element)) continue;
          if (box.left >= -0.5 && box.right <= window_ + 0.5) continue;
          let parent = element.parentElement;
          while (parent && !scrolls(parent)) parent = parent.parentElement;
          if (parent && parent !== document.documentElement && parent !== document.body) continue;
          outside.push(`${element.localName}.${element.getAttribute("class") ?? ""}`);
        }

        let left = Infinity;
        let right = -Infinity;
        const walker = document.createTreeWalker(
          document.querySelector("main") as Node,
          NodeFilter.SHOW_TEXT,
        );
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const parent = node.parentElement;
          if (!node.textContent?.trim() || !parent || hidden(parent)) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const box of range.getClientRects()) {
            if (box.width < 2) continue;
            left = Math.min(left, box.left);
            right = Math.max(right, box.right);
          }
        }
        return { window: window_, outside: outside.slice(0, 5), span: (right - left) / window_ };
      });

      expect(measure.outside, `${route} at ${width}`).toEqual([]);
      if (width >= 1280 && !NARROW_BY_DESIGN.has(route)) {
        expect(
          measure.span,
          `${route} at ${width}: share of the window the words span`,
        ).toBeGreaterThan(MIN_SPAN);
      }
      expect(problems).toEqual([]);
    });
  }
}
