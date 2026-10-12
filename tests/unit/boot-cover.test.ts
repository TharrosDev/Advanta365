import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InkBackdrop } from "@/components/ink/ink-backdrop";
import { IntroCover } from "@/components/intro/intro-cover";
import { MARK_BAR_D, MARK_DIGITS, MARK_LEGS_D, MARK_TAIL_D } from "@/lib/brand/mark";
import { STILLS, stillPath } from "@/lib/ink/stills";
import { SITE } from "@/lib/site";

// The cover of a first visit as markup, the budget its timeline keeps, and the backdrop contract
// the ink layer relies on.

const cover = renderToStaticMarkup(createElement(IntroCover));
const count = (text: string, part: string) => text.split(part).length - 1;

describe("the cover's markup", () => {
  it("is one decorative element, hidden from assistive technology", () => {
    expect(cover.startsWith("<div")).toBe(true);
    expect(cover).toMatch(/^<div[^>]*data-intro-cover=""/);
    expect(cover).toMatch(/^<div[^>]*aria-hidden="true"/);
  });

  it("holds nothing that can take focus", () => {
    expect(cover).not.toMatch(/<(a|button|input|select|textarea|summary|iframe)\b/);
    expect(cover).not.toContain("tabindex");
    expect(cover).not.toContain("contenteditable");
    expect(cover).toContain('focusable="false"');
  });

  it("writes the mark from the brand's own paths: the tail first, three strokes, then the 365", () => {
    expect(count(cover, "<path")).toBe(6);
    const order = [MARK_TAIL_D, MARK_LEGS_D, MARK_BAR_D, ...MARK_DIGITS].map((d) =>
      cover.indexOf(`d="${d}"`),
    );
    expect(order.every((index) => index > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(count(cover, 'pathLength="1"')).toBe(6);
    // The "A" is written with the broad pen, the digits with the fine one.
    expect(count(cover, 'stroke-width="4.2"')).toBe(3);
    expect(count(cover, 'stroke-width="1.1"')).toBe(3);
  });

  it("carries the name once, and the hint", () => {
    expect(count(cover, SITE.name)).toBe(1);
    expect(count(cover, ">Skip<")).toBe(1);
  });

  it("holds the intro backdrop with an empty slot and no still", () => {
    expect(count(cover, "data-ink-backdrop")).toBe(1);
    expect(cover).toContain('data-scene="intro"');
    expect(cover).toContain('data-ink-state="idle"');
    expect(count(cover, "data-ink-slot")).toBe(1);
    expect(cover).not.toContain("<img");
    expect(cover).not.toContain("<canvas");
  });
});

describe("the cover's timeline", () => {
  const css = readFileSync(
    fileURLToPath(new URL("../../components/intro/intro-cover.module.css", import.meta.url)),
    "utf8",
  );
  const ms = (name: string) => {
    const match = css.match(new RegExp(`--${name}:\\s*(\\d+)ms`));
    expect(match, name).not.toBeNull();
    return Number(match?.[1]);
  };

  it("is gone 1650ms after first paint without ink", () => {
    expect(ms("leave-at")).toBe(1200);
    expect(ms("leave-at") + ms("leave")).toBe(1650);
  });

  it("is gone 2800ms after the ink took it over, so at most 3850ms in", () => {
    expect(ms("ink-leave-at")).toBe(2000);
    expect(ms("ink-leave-at") + ms("ink-leave")).toBe(2800);
    expect(1050 + ms("ink-leave-at") + ms("ink-leave")).toBe(3850);
    expect(ms("ink-sign-at") + ms("ink-sign")).toBe(550);
  });

  it("is gone 200ms after an input", () => {
    expect(ms("skip")).toBe(200);
  });

  it("signs the mark before the cover leaves: legs, crossbar, tail, then the name", () => {
    expect([ms("pen-legs-at"), ms("pen-legs-at") + ms("pen-legs")]).toEqual([120, 480]);
    expect([ms("pen-bar-at"), ms("pen-bar-at") + ms("pen-bar")]).toEqual([420, 600]);
    expect([ms("pen-tail-at"), ms("pen-tail-at") + ms("pen-tail")]).toEqual([560, 800]);
    expect([ms("name-at"), ms("name-at") + ms("name-in")]).toEqual([500, 900]);
    expect(ms("hint-at")).toBe(600);
  });

  it("writes the 365 last, one digit after another, from 800 to 1000ms", () => {
    const first = ms("pen-digits-at");
    const last = first + 2 * ms("pen-digit-step");
    expect(first).toBe(ms("pen-tail-at") + ms("pen-tail"));
    expect([first, last + ms("pen-digit")]).toEqual([800, 1000]);
    // Done before the cover starts to leave.
    expect(last + ms("pen-digit")).toBeLessThanOrEqual(ms("leave-at"));
    expect(css).toMatch(/:root\[data-intro\]\s+\.digit\s*\{/);
    expect(css).not.toMatch(/:root\[data-intro="[a-z]+"\]\s+\.digit\b/);
  });

  it("is displayed only while the root element carries the state", () => {
    expect(css).toMatch(/\.cover\s*\{[^}]*display:\s*none/);
    expect(css).toMatch(/:root\[data-intro\]\s+\.cover\s*\{\s*display:\s*grid/);
    // The strokes do not name a state, so a change of state never restarts them.
    expect(css).toMatch(/:root\[data-intro\]\s+\.legs\s*\{/);
    expect(css).not.toMatch(/:root\[data-intro="[a-z]+"\]\s+\.(legs|bar|tail|name)\b/);
  });
});

describe("a backdrop's markup", () => {
  const html = renderToStaticMarkup(
    createElement(InkBackdrop, {
      scene: "hero",
      still: { wide: "hero-wide", tall: "hero-tall" },
      edges: "bottom",
    }),
  );

  it("is a hidden layer with a still, a slot, and the holder of the pause button after it", () => {
    expect(html).toMatch(
      /^<div[^>]*data-ink-backdrop=""[^>]*data-scene="hero"[^>]*data-edges="bottom"[^>]*data-ink-state="idle"[^>]*aria-hidden="true"/,
    );
    expect(html).toMatch(
      /<div data-ink-slot=""[^>]*><\/div><\/div><div data-ink-control=""[^>]*><\/div>$/,
    );
    expect(html).not.toContain("<canvas");
  });

  it("serves the wide still from 68em and the tall one below, lazily and without a description", () => {
    expect(html).toContain('<source media="(min-width: 68em)" srcSet="/ink/hero-wide.webp"/>');
    expect(html).toMatch(/<img[^>]*src="\/ink\/hero-tall\.webp"/);
    expect(html).toMatch(/<img[^>]*alt=""/);
    expect(html).toMatch(/<img[^>]*loading="lazy"/);
    expect(html).toMatch(/<img[^>]*decoding="async"/);
    expect(html).toMatch(/<img[^>]*fetchPriority="low"/i);
  });

  it("uses one image when a scene has one still", () => {
    const one = renderToStaticMarkup(
      createElement(InkBackdrop, { scene: "title", still: { wide: "title" } }),
    );
    expect(one).not.toContain("<source");
    expect(one).toMatch(/<img[^>]*src="\/ink\/title\.webp"/);
  });
});

describe("the stills manifest", () => {
  it("names the eleven stills, each once, with its page and window", () => {
    expect(STILLS.map((still) => still.name)).toEqual([
      "hero-wide",
      "hero-tall",
      "ninety-wide",
      "ninety-tall",
      "bloom-wide",
      "bloom-tall",
      "wisps-wide",
      "wisps-tall",
      "title",
      "spill-wide",
      "spill-tall",
    ]);
    for (const still of STILLS) {
      expect(still.route.startsWith("/")).toBe(true);
      expect(still.name.startsWith(still.scene)).toBe(true);
      const tall = still.name.endsWith("-tall");
      // A tall frame is captured in a phone's window at twice its density, a wide one in a desktop
      // window (the narrowest, the usual or the widest width the frame is shown in) at one.
      expect(tall ? [320, 390] : [1088, 1440, 1920]).toContain(still.viewport[0]);
      expect(still.ratio).toBe(tall ? 2 : 1);
      expect(stillPath(still.name)).toBe(`/ink/${still.name}.webp`);
    }
  });
});
