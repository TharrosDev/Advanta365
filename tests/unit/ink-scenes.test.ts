import { describe, expect, it } from "vitest";
import {
  armTimeline,
  makeRandom,
  runTimeline,
  SCENES,
  type SceneContext,
  type SceneInk,
} from "@/lib/ink/scenes";
import { STAGES } from "@/lib/ink/stage";
import type { InkDrop, Rect, SceneName } from "@/lib/ink/types";

// The seven scenes, run against a recorder instead of the water: what falls, where and when.

const NAMES = Object.keys(SCENES) as SceneName[];
const STEP = 1 / 60;

type Event =
  | { at: number; kind: "drop"; drop: InkDrop }
  | { at: number; kind: "clear"; duration: number | undefined };

const WIDE: SceneContext = { aspect: 1.6, portrait: false, width: 1440, height: 900, anchors: {} };
const TALL: SceneContext = {
  aspect: 390 / 844,
  portrait: true,
  width: 390,
  height: 844,
  anchors: {},
};

/** Plays a scene for some seconds in fixed steps, firing its triggers at a given moment. */
function play(name: SceneName, ctx: SceneContext, seconds: number, fireAt?: number) {
  const scene = SCENES[name](ctx);
  const rand = makeRandom(365);
  const events: Event[] = [];
  let clock = 0;
  const ink: SceneInk = {
    drop: (drop) => events.push({ at: clock, kind: "drop", drop }),
    stream: () => ({ stop() {} }),
    clear: (o) => events.push({ at: clock, kind: "clear", duration: o?.duration }),
  };
  const timeline = armTimeline(scene.timeline);
  let fired = false;
  for (let step = 0; step * STEP <= seconds; step++) {
    clock = step * STEP;
    if (fireAt !== undefined && !fired && clock >= fireAt) {
      fired = true;
      for (const entries of Object.values(scene.triggers ?? {})) {
        timeline.push(...armTimeline(entries, clock));
      }
    }
    runTimeline(timeline, clock, ink, rand);
  }
  return {
    scene,
    events,
    drops: events.flatMap((e) => (e.kind === "drop" ? [{ ...e.drop, at: e.at }] : [])),
  };
}

const near = (value: number | undefined, wanted: number, tolerance = 0.02) =>
  expect(Math.abs((value ?? NaN) - wanted)).toBeLessThanOrEqual(tolerance);

describe("every scene, wide and tall", () => {
  for (const name of NAMES) {
    for (const [shape, ctx] of [
      ["wide", WIDE],
      ["tall", TALL],
    ] as const) {
      it(`${name} (${shape}) keeps its drops in or just outside the canvas`, () => {
        const { drops } = play(name, ctx, 60, 1);
        expect(drops.length).toBeGreaterThan(0);
        for (const drop of drops) {
          expect(drop.x).toBeGreaterThanOrEqual(-0.05);
          expect(drop.x).toBeLessThanOrEqual(1.05);
          expect(drop.y).toBeGreaterThanOrEqual(-0.05);
          expect(drop.y).toBeLessThanOrEqual(1.05);
          expect(drop.radius).toBeGreaterThan(0);
          expect(drop.amount).toBeGreaterThan(0);
        }
      });
    }

    it(`${name} is the same every time it is played`, () => {
      expect(play(name, WIDE, 40, 1).events).toEqual(play(name, WIDE, 40, 1).events);
    });

    it(`${name} comes to rest by itself within thirty seconds`, () => {
      expect(STAGES[name].runMs).toBeGreaterThan(0);
      expect(STAGES[name].runMs).toBeLessThanOrEqual(30000);
    });
  }
});

describe("the load-in", () => {
  it("drops black, then light blue, then clears, and is over at 3.5 seconds", () => {
    const { scene, events } = play("intro", WIDE, 4);
    expect(scene.duration).toBe(3.5);
    expect(events.map((e) => e.kind)).toEqual(["drop", "drop", "clear"]);
    const [black, blue, clear] = events;
    near(black?.at, 0);
    near(blue?.at, 0.5);
    near(clear?.at, 2.45);
    expect(black?.kind === "drop" && black.drop.ink).toBe("black");
    expect(blue?.kind === "drop" && blue.drop.ink).toBe("blue");
    expect(clear?.kind === "clear" && clear.duration).toBe(1.05);
    if (black?.kind === "drop" && blue?.kind === "drop") {
      near(black.drop.x, 0.5 - 0.048 / WIDE.aspect, 1e-6);
      near(blue.drop.x, 0.5 + 0.12 / WIDE.aspect, 1e-6);
      near(black.drop.radius, 0.085, 1e-6);
      near(blue.drop.radius, 0.068, 1e-6);
      expect(black.drop.velocity).toEqual([0, 0.68]);
    }
  });

  it("is run by the layer for exactly as long as it lasts, the clear ending on its last frame", () => {
    const { scene, events } = play("intro", WIDE, 4);
    expect((scene.duration ?? 0) * 1000).toBe(STAGES.intro.runMs);
    const clear = events.at(-1);
    expect(clear?.kind).toBe("clear");
    if (clear?.kind === "clear")
      near(clear.at + (clear.duration ?? 0), STAGES.intro.runMs / 1000, 0.02);
  });

  it("is drawn smaller on a tall screen", () => {
    const [black] = play("intro", TALL, 1).drops;
    near(black?.radius, 0.085 * 0.72, 1e-6);
  });
});

describe("the prompt", () => {
  const open: Rect = { x: 0.12, y: 0.6, width: 0.76, height: 0.3 };

  it("has replaced the hero: no scene and no stage is called that any more", () => {
    expect(NAMES).toEqual(["intro", "prompt", "title", "ninety", "bloom", "wisps", "spill"]);
    expect(Object.keys(STAGES)).not.toContain("hero");
  });

  it("drops black in the middle of the box, light blue half a second later, then clears", () => {
    const { scene, events } = play("prompt", { ...WIDE, anchors: { open } }, 8);
    expect(scene.duration).toBeUndefined();
    expect(events.map((e) => e.kind)).toEqual(["drop", "drop", "clear"]);
    const [black, blue, clear] = events;
    near(black?.at, 0);
    near(blue?.at, 0.5);
    near(clear?.at, 2.2);
    expect(clear?.kind === "clear" && clear.duration).toBe(1.2);
    if (black?.kind === "drop" && blue?.kind === "drop") {
      expect(black.drop.ink).toBe("black");
      expect(blue.drop.ink).toBe("blue");
      // The centre of the rectangle the page marked.
      near(black.drop.x, 0.5, 1e-9);
      near(black.drop.y, 0.75, 1e-9);
      // The blue one lands beside it, inside the box.
      expect(blue.drop.x).toBeGreaterThan(0.5);
      expect(blue.drop.x).toBeLessThan(open.x + open.width);
      near(blue.drop.y, 0.75, 0.05);
    }
  });

  it("without a box aims at the middle of the lower half", () => {
    const [black] = play("prompt", WIDE, 1).drops;
    near(black?.x, 0.5, 1e-9);
    near(black?.y, 0.7, 1e-9);
  });

  it("leaves the water clean from the end of the clear until the first drip, at 9 seconds", () => {
    const { drops } = play("prompt", { ...WIDE, anchors: { open } }, 60);
    expect(drops.filter((drop) => drop.at > 0.6 && drop.at < 9 - STEP)).toEqual([]);
    near(drops[2]?.at, 9);
  });

  it("then drips behind the documents: two black to each blue, 5.5 to 8.5 seconds apart", () => {
    const drips = play("prompt", { ...WIDE, anchors: { open } }, 120).drops.slice(2);
    expect(drips.length).toBeGreaterThan(9);
    drips.forEach((drop, index) => {
      expect(drop.ink).toBe(index % 3 === 1 ? "blue" : "black");
      expect(drop.x).toBeGreaterThanOrEqual(open.x);
      expect(drop.x).toBeLessThanOrEqual(open.x + open.width);
      expect(drop.y).toBeGreaterThanOrEqual(open.y);
      expect(drop.y).toBeLessThanOrEqual(open.y + open.height);
      const previous = drips[index - 1];
      if (previous) {
        const gap = drop.at - previous.at;
        expect(gap).toBeGreaterThanOrEqual(5.5 - STEP);
        expect(gap).toBeLessThanOrEqual(8.5 + STEP);
        // Never the same quarter of the box twice running.
        const quarter = (x: number | undefined) =>
          Math.floor((((x ?? 0) - open.x) / open.width) * 4);
        expect(quarter(drop.x)).not.toBe(quarter(previous.x));
      }
    });
  });

  it("is a smaller picture on a tall canvas, with slower drips", () => {
    const wide = play("prompt", { ...WIDE, anchors: { open } }, 1).drops[0];
    const { drops } = play("prompt", { ...TALL, anchors: { open } }, 120);
    expect(drops[0]?.radius).toBeLessThan(wide?.radius ?? 0);
    const drips = drops.slice(2);
    drips.slice(1).forEach((drop, index) => {
      const gap = drop.at - (drips[index]?.at ?? 0);
      expect(gap).toBeGreaterThanOrEqual(7.5 - STEP);
      expect(gap).toBeLessThanOrEqual(11 + STEP);
    });
  });
});

describe("the title block", () => {
  it("drops black at the centre, then light blue to its right, then a slow alternating drip", () => {
    const { drops } = play("title", WIDE, 60);
    near(drops[0]?.at, 0);
    near(drops[1]?.at, 1.6);
    expect([drops[0]?.ink, drops[1]?.ink]).toEqual(["black", "blue"]);
    expect([drops[0]?.x, drops[1]?.x]).toEqual([0.5, 0.74]);
    const drips = drops.slice(2);
    near(drips[0]?.at, 9);
    drips.forEach((drop, index) => {
      expect(drop.ink).toBe(index % 2 ? "blue" : "black");
      expect(drop.x).toBeGreaterThanOrEqual(0.35);
      expect(drop.x).toBeLessThanOrEqual(0.85);
      expect(drop.radius).toBeGreaterThanOrEqual(0.07);
      expect(drop.radius).toBeLessThanOrEqual(0.09);
    });
  });
});

describe("the ninety", () => {
  it("holds empty water until it is fired", () => {
    expect(play("ninety", WIDE, 30).events).toEqual([]);
  });

  it("then lets one light-blue drop fall from under the tenth block, and a smaller one after it", () => {
    const tenth: Rect = { x: 0.8, y: 0.4, width: 0.08, height: 0.03 };
    const { drops } = play("ninety", { ...WIDE, anchors: { tenth } }, 20, 4);
    expect(drops).toHaveLength(2);
    const [first, second] = drops;
    near(first?.at, 4);
    near(second?.at, 4.5);
    expect([first?.ink, second?.ink]).toEqual(["blue", "blue"]);
    near(first?.x, 0.84, 1e-9);
    near(first?.y, 0.45, 1e-9);
    near(second?.x, 0.84 - 0.1 / WIDE.aspect, 1e-9);
    near(second?.y, 0.43, 1e-9);
    expect([first?.radius, second?.radius]).toEqual([0.09, 0.05]);
  });
});

describe("the bloom", () => {
  it("rises from the foot of the canvas in light blue only", () => {
    const { drops } = play("bloom", WIDE, 60);
    near(drops[0]?.at, 0);
    near(drops[1]?.at, 2.2);
    near(drops[2]?.at, 4);
    near(drops[3]?.at, 9);
    for (const drop of drops) {
      expect(drop.ink).toBe("blue");
      expect(drop.y).toBe(0.985);
      expect(drop.velocity?.[1]).toBeLessThan(0);
      expect(drop.x).toBeGreaterThanOrEqual(0.3);
      expect(drop.x).toBeLessThanOrEqual(0.7);
    }
  });
});

describe("the wisps", () => {
  it("start as four drops across the footer, alternately light blue and pale, then drift up from below", () => {
    const { scene, drops } = play("wisps", WIDE, 60);
    expect(scene.look.dark).toBe(true);
    expect(scene.look.ground).toBe("binder");
    const first = drops.slice(0, 4);
    expect(first.map((d) => d.ink)).toEqual(["blue", "pale", "blue", "pale"]);
    first.forEach((drop, index) => {
      near(drop.at, 0);
      near(drop.x, 0.14 + 0.24 * index, 0.05);
    });
    near(drops[4]?.at, 3);
    for (const drop of drops.slice(4)) {
      expect(drop.y).toBeGreaterThanOrEqual(0.8);
      expect(drop.velocity?.[1]).toBeLessThan(0);
    }
  });
});

describe("the spill", () => {
  const TIMES = [0, 0.7, 1.5, 2.6, 4.2, 6.4];
  const LANE = [0.8, 0.52, 0.97, 0.28, 0.66, 0.08];

  it("is six black drops at their times, each leaning left, then a slow drip", () => {
    const { drops } = play("spill", WIDE, 40);
    TIMES.forEach((time, index) => {
      const drop = drops[index];
      near(drop?.at, time);
      near(drop?.x, 0.74 + ((LANE[index] ?? 0) - 0.5) * 0.36, 1e-9);
      expect(drop?.ink).toBe("black");
      expect(drop?.velocity?.[0]).toBeLessThan(0);
    });
    near(drops[6]?.at, 10);
  });

  it("is one leaning arc: its first three drops are not mirrored about the lane's centre", () => {
    for (const ctx of [WIDE, TALL]) {
      const centre = ctx.portrait ? 0.56 : 0.74;
      const offsets = play("spill", ctx, 2)
        .drops.slice(0, 3)
        .map((drop) => (drop.x ?? 0) - centre);
      expect(offsets).toHaveLength(3);
      const mirrored = offsets.map((offset) => -offset).sort((a, b) => a - b);
      const sorted = [...offsets].sort((a, b) => a - b);
      const distance = sorted.reduce((sum, v, i) => sum + Math.abs(v - (mirrored[i] ?? 0)), 0);
      expect(distance).toBeGreaterThan(0.05);
      // And the weight sits to one side of the centre.
      expect(Math.abs(offsets.reduce((sum, v) => sum + v, 0))).toBeGreaterThan(0.05);
    }
  });
});
