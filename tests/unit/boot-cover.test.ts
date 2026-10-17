import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IntroCover } from "@/components/intro/intro-cover";
import { INTRO_BACKSTOP_MS, INTRO_CLICK_GUARD_MS } from "@/lib/boot/state";
import { MARK_HUE_D, MARK_INK_D } from "@/lib/brand/mark";
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

  it("draws the mark from the brand's own shapes: the leg first, then the arm over it", () => {
    expect(count(cover, "<path")).toBe(2);
    const leg = cover.indexOf(`d="${MARK_HUE_D}"`);
    const arm = cover.indexOf(`d="${MARK_INK_D}"`);
    expect(leg).toBeGreaterThan(0);
    expect(arm).toBeGreaterThan(leg);
    // Filled shapes, not pen strokes.
    expect(cover).not.toContain("stroke");
    expect(cover).not.toContain("pathLength");
  });

  it("carries the name once, the line under it, and the hint", () => {
    expect(count(cover, SITE.name)).toBe(1);
    expect(count(cover, `An ${SITE.parent} product`)).toBe(1);
    // The name comes before the line under it.
    expect(cover.indexOf(SITE.name)).toBeLessThan(cover.indexOf(`An ${SITE.parent} product`));
    expect(count(cover, ">Skip<")).toBe(1);
  });

  it("holds no picture and no canvas", () => {
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

  it("holds the finished signature until 2500ms and is gone 2950ms after first paint", () => {
    expect(ms("leave-at")).toBe(2500);
    expect(ms("leave-at") + ms("leave")).toBe(2950);
    // The line under the name is written by 1400ms, and the signature stands there for 1100ms.
    const written = ms("byline-at") + ms("byline-in");
    expect(written).toBe(1400);
    expect(ms("leave-at") - written).toBe(1100);
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

  it("signs before the cover leaves: the arm rises, the leg drops, the name, then the line under it", () => {
    expect([ms("arm-rise-at"), ms("arm-rise-at") + ms("arm-rise")]).toEqual([120, 620]);
    // The leg drops as the arm arrives, and the mark is whole at 1000ms.
    expect([ms("leg-drop-at"), ms("leg-drop-at") + ms("leg-drop")]).toEqual([620, 1000]);
    expect([ms("name-at"), ms("name-at") + ms("name-in")]).toEqual([900, 1150]);
    expect([ms("byline-at"), ms("byline-at") + ms("byline-in")]).toEqual([1100, 1400]);
    expect(ms("hint-at")).toBe(600);
  });

  it("drops the leg fast and lets it land with weight: it speeds up, then squashes and springs back", () => {
    const frames = css.match(/@keyframes leg-drop\s*\{([\s\S]*?)\n\}/);
    expect(frames).not.toBeNull();
    // A fall accelerates: the first stretch eases in.
    expect(frames?.[1]).toMatch(
      /0%\s*\{[^}]*animation-timing-function:\s*cubic-bezier\(0\.55,\s*0,\s*1,/,
    );
    // It squashes against the ground, then overshoots a little on the way back.
    const scales = [...(frames?.[1] ?? "").matchAll(/scaleY\(([\d.]+)\)/g)].map((m) =>
      Number(m[1]),
    );
    expect(Math.min(...scales)).toBeLessThan(1);
    expect(Math.max(...scales)).toBeGreaterThan(1);
    expect(scales[scales.length - 1]).toBe(1);
    // The squash happens on its foot.
    expect(css).toMatch(/\.leg\s*\{[^}]*transform-origin:\s*50% 100%/);
  });

  it("writes the name and the line under it from the left", () => {
    expect(css).toMatch(/@keyframes write\s*\{\s*from\s*\{\s*clip-path:\s*inset\([^)]*100%/);
    expect(css).toMatch(/:root\[data-intro\]\s+\.name\s+\.write\s*\{/);
    expect(css).toMatch(/:root\[data-intro\]\s+\.byline\s+\.write\s*\{/);
    expect(css).not.toMatch(/:root\[data-intro="[a-z]+"\]\s+\.(arm|leg|write)\b/);
  });

  it("is displayed only while the root element carries the state", () => {
    expect(css).toMatch(/\.cover\s*\{[^}]*display:\s*none/);
    expect(css).toMatch(/:root\[data-intro\]\s+\.cover\s*\{\s*display:\s*grid/);
    // The strokes do not name a state, so a change of state never restarts them.
    expect(css).toMatch(/:root\[data-intro\]\s+\.arm\s*\{/);
    expect(css).toMatch(/:root\[data-intro\]\s+\.leg\s*\{/);
    expect(css).not.toMatch(/:root\[data-intro="[a-z]+"\]\s+\.(arm|leg|name|byline)\b/);
  });
});
