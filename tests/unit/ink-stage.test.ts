import { describe, expect, it } from "vitest";
import {
  chooseStage,
  coverProgress,
  NINETY_FIRE,
  NINETY_REARM,
  STAGES,
  visibleArea,
  type Candidate,
} from "@/lib/ink/stage";
import type { SceneName } from "@/lib/ink/types";

// Which backdrop gets the one canvas: the rule the ink layer applies on every scroll.

type Box = { left: number; top: number; width: number; height: number };

/** A backdrop on a page, as the layer would measure it in a window of the given size. */
function candidate(
  scene: SceneName,
  box: Box,
  viewport: { width: number; height: number },
): Candidate<SceneName> {
  const rect = { ...box, right: box.left + box.width, bottom: box.top + box.height };
  return {
    id: scene,
    scene,
    top: box.top,
    area: box.width * box.height,
    visible: visibleArea(rect, viewport),
  };
}

describe("what is in view", () => {
  const view = { width: 1000, height: 800 };

  it("is the part of a rectangle inside the window", () => {
    expect(visibleArea({ left: 0, top: 0, right: 1000, bottom: 800 }, view)).toBe(800000);
    expect(visibleArea({ left: 0, top: 600, right: 1000, bottom: 1400 }, view)).toBe(200000);
    expect(visibleArea({ left: -100, top: -100, right: 100, bottom: 100 }, view)).toBe(10000);
  });

  it("is nothing for a rectangle off screen or of no size", () => {
    expect(visibleArea({ left: 0, top: 900, right: 1000, bottom: 1700 }, view)).toBe(0);
    expect(visibleArea({ left: 0, top: -500, right: 1000, bottom: 0 }, view)).toBe(0);
    expect(visibleArea({ left: 10, top: 10, right: 10, bottom: 10 }, view)).toBe(0);
  });
});

describe("the choice", () => {
  const view = { width: 1440, height: 900 };
  const band = (scene: SceneName, top: number, height: number) =>
    candidate(scene, { left: 0, top, width: 1440, height }, view);

  it("is nothing when no backdrop is on screen", () => {
    expect(chooseStage([])).toBeNull();
    expect(chooseStage([band("wisps", 1200, 400)])).toBeNull();
  });

  it("is the topmost backdrop while at least 40% of it is in view", () => {
    // The hero has scrolled half out; the ninety below it shows more area.
    const hero = band("hero", -400, 800);
    const ninety = band("ninety", 400, 800);
    expect(hero.visible / hero.area).toBe(0.5);
    expect(chooseStage([hero, ninety])).toBe("hero");
    expect(chooseStage([ninety, hero])).toBe("hero");
  });

  it("is the largest visible area times weight once the topmost is mostly gone", () => {
    const hero = band("hero", -600, 800); // a quarter left
    const ninety = band("ninety", 200, 800);
    expect(chooseStage([hero, ninety])).toBe("ninety");
  });

  it("weighs a scene: a strip of bloom beats a larger strip of the footer", () => {
    const gone = band("ninety", -780, 800);
    const bloom = band("bloom", 20, 360);
    const wisps = band("wisps", 380, 520);
    expect(wisps.visible).toBeGreaterThan(bloom.visible);
    expect(chooseStage([gone, bloom, wisps])).toBe("bloom");
  });

  it("keeps the holder unless a challenger beats it by a quarter", () => {
    const gone = band("hero", -790, 800);
    // Same weight, visible areas 400 and 450 rows: 12.5% apart.
    const bloom = band("bloom", 10, 400);
    const title = band("title", 450, 800);
    expect(title.visible).toBeGreaterThan(bloom.visible);
    expect(chooseStage([gone, bloom, title])).toBe("title");
    expect(chooseStage([gone, bloom, title], "bloom")).toBe("bloom");
    expect(chooseStage([gone, bloom, title], "title")).toBe("title");

    // A third more: the holder gives way.
    const less = band("bloom", 10, 330);
    expect(chooseStage([gone, less, title], "bloom")).toBe("title");
  });

  it("forgets a holder that has left the screen", () => {
    const hero = band("hero", -900, 800);
    const ninety = band("ninety", -100, 300); // two thirds in view: the topmost one on screen
    const bloom = band("bloom", 300, 800);
    expect(chooseStage([hero, ninety, bloom], "hero")).toBe("ninety");
  });

  it("gives a short page on a tall window to its title, not to the footer", () => {
    // /purchase at 1440x1200: the title block's ink (the right-hand 42%, 320px tall) under the bar,
    // and the whole footer in view below it.
    const tall = { width: 1440, height: 1200 };
    const title = candidate("title", { left: 835, top: 110, width: 605, height: 320 }, tall);
    const wisps = candidate("wisps", { left: 0, top: 760, width: 1440, height: 440 }, tall);
    expect(wisps.visible * STAGES.wisps.weight).toBeGreaterThan(
      title.visible * STAGES.title.weight,
    );
    expect(chooseStage([wisps, title])).toBe("title");
    expect(chooseStage([wisps, title], "wisps")).toBe("title");
  });

  it("gives the foot of a page to the footer once it is in view whole", () => {
    // The home page scrolled to its end at 1440x900: the tail of the closing band, half of it, is
    // the topmost backdrop, and the whole footer stands under it.
    const bloom = band("bloom", -380, 760);
    const wisps = band("wisps", 380, 520);
    expect(bloom.visible / bloom.area).toBeGreaterThanOrEqual(0.4);
    expect(chooseStage([bloom, wisps])).toBe("wisps");
    expect(chooseStage([wisps, bloom], "bloom")).toBe("wisps");

    // Part of the footer is not enough: the band keeps the canvas until the footer is all there.
    const partial = band("wisps", 480, 520);
    expect(chooseStage([bloom, partial])).toBe("bloom");
  });

  it("gives the window to the cover while the cover is up", () => {
    const cover = candidate("intro", { left: 0, top: 0, width: 1440, height: 900 }, view);
    expect(chooseStage([cover])).toBe("intro");
    expect(STAGES.intro.weight).toBeGreaterThan(STAGES.hero.weight);
  });
});

describe("the stages", () => {
  it("weigh as the design says", () => {
    const weights = Object.fromEntries(
      Object.entries(STAGES).map(([name, stage]) => [name, stage.weight]),
    );
    expect(weights).toEqual({
      intro: 9,
      hero: 3,
      ninety: 3,
      spill: 3,
      bloom: 2,
      title: 2,
      wisps: 1,
    });
  });

  it("run the load-in for 3.5 seconds, the length of its scene", () => {
    expect(STAGES.intro.runMs).toBe(3500);
  });

  it("stand on paper, but for the two on the binder", () => {
    const dark = Object.entries(STAGES)
      .filter(([, stage]) => stage.ground === "binder")
      .map(([name]) => name);
    expect(dark.sort()).toEqual(["ninety", "wisps"]);
  });

  it("only the ninety waits for a trigger", () => {
    const waiting = Object.entries(STAGES)
      .filter(([, stage]) => stage.trigger)
      .map(([name, stage]) => [name, stage.trigger]);
    expect(waiting).toEqual([["ninety", "tenth"]]);
  });
});

describe("a band's way through the window", () => {
  it("runs from 0 as its top meets the foot of the window to 1 as its bottom leaves the top", () => {
    expect(coverProgress({ top: 900, height: 600 }, 900)).toBe(0);
    expect(coverProgress({ top: -600, height: 600 }, 900)).toBe(1);
    expect(coverProgress({ top: 150, height: 600 }, 900)).toBe(0.5);
  });

  it("fires the tenth at 47% and re-arms under 20%", () => {
    expect(NINETY_FIRE).toBe(0.47);
    expect(NINETY_REARM).toBe(0.2);
  });
});
