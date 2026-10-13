import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IntroCover } from "@/components/intro/intro-cover";
import { INTRO_BACKSTOP_MS, INTRO_CLICK_GUARD_MS } from "@/lib/boot/state";
import { MARK_BAR_D, MARK_DIGITS, MARK_LEGS_D, MARK_TAIL_D } from "@/lib/brand/mark";
import { SITE } from "@/lib/site";

// The cover of a first visit as markup, and the budget its timeline keeps.

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
    expect(count(cover, 'stroke-width="3.8"')).toBe(3);
    expect(count(cover, 'stroke-width="1.4"')).toBe(3);
  });

  it("carries the name once, and the hint", () => {
    expect(count(cover, SITE.name)).toBe(1);
    expect(count(cover, ">Skip<")).toBe(1);
  });

  it("holds no picture and no canvas", () => {
    expect(cover).not.toContain("data-ink");
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

  it("holds the finished mark from 1000 to 2500ms and is gone 2950ms after first paint", () => {
    expect(ms("leave-at")).toBe(2500);
    expect(ms("leave-at") + ms("leave")).toBe(2950);
    // The mark is complete at 1000ms (the last digit) and stands there for a second and a half.
    const written = ms("pen-digits-at") + 2 * ms("pen-digit-step") + ms("pen-digit");
    expect(ms("leave-at") - written).toBe(1500);
    expect(ms("leave-at") + ms("leave")).toBeLessThan(INTRO_BACKSTOP_MS);
  });

  it("takes the signature off the paper before the paper clears, so the mark never lies over the page", () => {
    expect(ms("sign-leave-at")).toBe(ms("leave-at"));
    // The paper holds opaque for the first part of its own way out: as long as the signature takes.
    const hold = css.match(/@keyframes cover-leave\s*\{[\s\S]*?(\d+)%\s*\{\s*opacity:\s*1;\s*\}/);
    expect(hold).not.toBeNull();
    const clearsAt = ms("leave-at") + (Number(hold?.[1]) / 100) * ms("leave");
    expect(ms("sign-leave-at") + ms("sign-leave")).toBeLessThanOrEqual(clearsAt);
    expect(css).toMatch(
      /:root\[data-intro="play"\]\s+\.signature\s*\{\s*animation:\s*sign-leave\b/,
    );
    expect(css).toMatch(/:root\[data-intro="play"\]\s+\.hint\s*\{[^}]*sign-leave\b/);
  });

  it("is gone 200ms after an input", () => {
    expect(ms("skip")).toBe(200);
  });

  it("keeps the pointer through the whole skip: a touch's click is aimed when the finger lifts", () => {
    const frames = (name: string) =>
      css.match(new RegExp(`@keyframes ${name}\\s*\\{([\\s\\S]*?)\\n\\}`));
    // The skip never turns the pointer off (a discrete property would flip halfway through the
    // easing), and visibility ends the hit-testing on its last frame.
    const skip = frames("cover-skip");
    expect(skip).not.toBeNull();
    expect(skip?.[1]).not.toMatch(/pointer-events/);
    expect(skip?.[1]).toMatch(/visibility:\s*hidden/);
    // The cover's own ways out do turn it off while the paper fades: the page is then the visitor's.
    expect(frames("cover-leave")?.[1]).toMatch(/pointer-events:\s*none/);
    // And a touch held past the skip is covered by the boot script's click guard.
    expect(INTRO_CLICK_GUARD_MS).toBeGreaterThan(ms("skip"));
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
