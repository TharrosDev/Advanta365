import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IntroCover } from "@/components/intro/intro-cover";
import {
  INTRO_ATTRIBUTE,
  INTRO_BACKSTOP_MS,
  INTRO_COVER_ATTRIBUTE,
  INTRO_FLAG,
  INTRO_PATH,
  INTRO_SCRIPT,
  INTRO_SEEN,
  INTRO_SKIP_EVENTS,
  shouldPlayIntro,
} from "@/components/intro/intro-script";
import { IntroScript } from "@/components/intro/intro-script-tag";
import { MARK_BAR_D, MARK_LEGS_D, MARK_TAIL_D } from "@/lib/brand/mark";
import { SITE } from "@/lib/site";

// The cover of a first visit: the decision to play it, the inline script that makes that decision
// in the browser (run here against stand-ins for the few globals it touches) and the way it is
// printed into the page, the budget its timeline has to keep, and its markup.

const PATHS = [INTRO_PATH, "/pricing", "/catalog", "/phases/prepare"];
const YES_NO = [true, false];

describe("the decision to play the cover", () => {
  it("plays on the home page, on the first load of a session, with motion allowed", () => {
    expect(shouldPlayIntro({ path: "/", seen: false, reducedMotion: false })).toBe(true);
  });

  it("does not play on a later load, on an inner page or under reduced motion", () => {
    expect(shouldPlayIntro({ path: "/", seen: true, reducedMotion: false })).toBe(false);
    expect(shouldPlayIntro({ path: "/pricing", seen: false, reducedMotion: false })).toBe(false);
    expect(shouldPlayIntro({ path: "/", seen: false, reducedMotion: true })).toBe(false);
  });

  it("names the home page, and a flag in the site's own storage namespace", () => {
    expect(INTRO_PATH).toBe("/");
    expect(INTRO_FLAG).toBe("advanta365.intro.v1");
    expect(INTRO_ATTRIBUTE).toBe("data-intro");
  });
});

type Listener = (event: { type: string; target: unknown }) => void;

/** An element as far as the script looks at one: it is the cover, or it is not. */
const element = (isCover: boolean) => ({
  hasAttribute: (name: string) => isCover && name === INTRO_COVER_ATTRIBUTE,
});

/** Lets the promise callbacks that are already due run. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Runs the inline script the way a page load does, with stand-ins for the globals it reads, and
 * hands back what it did and the means to send it events.
 */
function load({
  path = INTRO_PATH,
  seen = false,
  reducedMotion = false,
  storage = "works",
  animations = [],
}: {
  path?: string;
  seen?: boolean;
  reducedMotion?: boolean;
  storage?: "works" | "throws";
  animations?: Array<{ finished: Promise<unknown> }>;
} = {}) {
  const attributes = new Map<string, string>();
  const stored = new Map<string, string>(seen ? [[INTRO_FLAG, INTRO_SEEN]] : []);
  const listeners = new Map<string, Set<Listener>>();
  const timers: Array<{ run: () => void; after: number } | undefined> = [];
  const frames: Array<() => void> = [];
  const denied = () => {
    throw new Error("storage is not available");
  };

  const globals = {
    document: {
      documentElement: {
        setAttribute: (name: string, value: string) => attributes.set(name, value),
        removeAttribute: (name: string) => attributes.delete(name),
      },
      getAnimations: () => animations,
    },
    sessionStorage: {
      getItem: (key: string) => (storage === "throws" ? denied() : (stored.get(key) ?? null)),
      setItem: (key: string, value: string) =>
        storage === "throws" ? denied() : stored.set(key, value),
    },
    location: { pathname: path },
    matchMedia: (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" && reducedMotion,
    }),
    addEventListener: (type: string, listener: Listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(listener);
    },
    removeEventListener: (type: string, listener: Listener) => {
      listeners.get(type)?.delete(listener);
    },
    setTimeout: (run: () => void, after: number) => timers.push({ run, after }),
    clearTimeout: (id?: number) => {
      if (id) timers[id - 1] = undefined;
    },
    requestAnimationFrame: (run: () => void) => frames.push(run),
  };

  // The script is one expression that calls itself; its free names become the parameters.
  new Function(...Object.keys(globals), INTRO_SCRIPT)(...Object.values(globals));

  return {
    state: () => attributes.get(INTRO_ATTRIBUTE),
    flag: () => stored.get(INTRO_FLAG),
    listening: (type: string) => listeners.get(type)?.size ?? 0,
    fire: (type: string, target: unknown = element(false)) => {
      for (const listener of [...(listeners.get(type) ?? [])]) listener({ type, target });
    },
    frame: () => {
      for (const run of frames.splice(0)) run();
    },
    timers: () => timers.filter((timer) => timer !== undefined),
  };
}

describe("the inline script", () => {
  it("makes the same decision as shouldPlayIntro, for every kind of page load", () => {
    for (const path of PATHS) {
      for (const seen of YES_NO) {
        for (const reducedMotion of YES_NO) {
          const page = load({ path, seen, reducedMotion });
          const expected = shouldPlayIntro({ path, seen, reducedMotion }) ? "play" : undefined;
          expect(page.state(), JSON.stringify({ path, seen, reducedMotion })).toBe(expected);
        }
      }
    }
  });

  it("sets the session flag on whichever page the session starts", () => {
    for (const path of PATHS) {
      for (const reducedMotion of YES_NO) {
        expect(load({ path, reducedMotion }).flag(), path).toBe(INTRO_SEEN);
      }
    }
  });

  it("does nothing more on a load that does not play: no listener, no timer", () => {
    for (const page of [load({ seen: true }), load({ path: "/pricing" })]) {
      for (const type of [...INTRO_SKIP_EVENTS, "animationstart", "animationend"]) {
        expect(page.listening(type), type).toBe(0);
      }
      page.frame();
      expect(page.timers()).toEqual([]);
    }
  });

  it("plays nothing, and throws nothing, when storage cannot be read", () => {
    const page = load({ storage: "throws" });
    expect(page.state()).toBeUndefined();
    expect(page.listening("keydown")).toBe(0);
  });

  it("lifts the cover at once on a press, a key, the wheel or a moving finger", () => {
    expect(INTRO_SKIP_EVENTS).toEqual(["pointerdown", "keydown", "wheel", "touchmove"]);
    for (const type of INTRO_SKIP_EVENTS) {
      const page = load();
      expect(page.listening(type)).toBe(1);

      page.fire(type);
      expect(page.state(), type).toBe("skip");
      // One skip is all there is: the script stops listening for the others.
      for (const other of INTRO_SKIP_EVENTS) expect(page.listening(other), other).toBe(0);
    }
  });

  it("stops listening for a skip once the cover has begun to leave by itself", () => {
    const page = load();

    // A part of the cover starting to move is not the cover leaving.
    page.fire("animationstart", element(false));
    expect(page.listening("keydown")).toBe(1);

    page.fire("animationstart", element(true));
    for (const type of INTRO_SKIP_EVENTS) expect(page.listening(type), type).toBe(0);
    page.fire("keydown");
    expect(page.state()).toBe("play");
  });

  it("marks the cover as gone when its own animation ends, then takes the attribute off", async () => {
    const page = load();

    page.fire("animationend", element(false));
    expect(page.state()).toBe("play");

    page.fire("animationend", element(true));
    expect(page.state()).toBe("done");
    expect(page.listening("animationend")).toBe(0);
    expect(page.listening("animationstart")).toBe(0);

    await settle();
    expect(page.state()).toBeUndefined();
  });

  it("goes from a skip to gone the same way", async () => {
    const page = load();
    page.fire("wheel");
    page.fire("animationstart", element(true));
    page.fire("animationend", element(true));
    expect(page.state()).toBe("done");

    await settle();
    expect(page.state()).toBeUndefined();
  });

  it("keeps the attribute until the animations that were running have ended or been cancelled", async () => {
    let finish = () => {};
    let cancel = () => {};
    const page = load({
      animations: [
        { finished: Promise.resolve() },
        { finished: new Promise<void>((resolve) => (finish = resolve)) },
        { finished: new Promise<void>((_, reject) => (cancel = () => reject(new Error("gone")))) },
      ],
    });
    page.fire("animationend", element(true));

    await settle();
    expect(page.state()).toBe("done");
    finish();
    await settle();
    expect(page.state()).toBe("done");
    cancel();
    await settle();
    expect(page.state()).toBeUndefined();
  });

  it("has a backstop, counted from the first frame, for a cover whose events never arrive", () => {
    const page = load();
    expect(page.timers()).toEqual([]);

    page.frame();
    expect(page.timers().map((timer) => timer.after)).toEqual([INTRO_BACKSTOP_MS]);

    page.timers()[0]?.run();
    expect(page.state()).toBe("done");
    for (const type of INTRO_SKIP_EVENTS) expect(page.listening(type), type).toBe(0);
  });

  it("drops the backstop when the cover leaves in time", () => {
    const page = load();
    page.frame();
    page.fire("animationend", element(true));
    expect(page.timers()).toEqual([]);
  });

  it("is small and safe to print inside a script element", () => {
    expect(INTRO_SCRIPT.length).toBeLessThan(1500);
    expect(INTRO_SCRIPT).not.toMatch(/<\/script|<!--/i);
  });
});

describe("the inline script as printed", () => {
  it("is the HTML of a hidden wrapper, so React never makes a script element of its own", () => {
    // The parser runs it from the server's HTML all the same. On a document React builds in the
    // browser (a 404 answered at request time) a script element could not run and React would log
    // an error about it; HTML set on a wrapper is inert there.
    expect(renderToStaticMarkup(createElement(IntroScript))).toBe(
      `<div hidden=""><script>${INTRO_SCRIPT}</script></div>`,
    );
  });
});

describe("the timeline of the cover", () => {
  const tokens = readFileSync(
    fileURLToPath(new URL("../../app/globals.css", import.meta.url)),
    "utf8",
  );
  /** A time token of globals.css, in milliseconds. */
  const ms = (name: string) => {
    const found = new RegExp(`${name}:\\s*(\\d+)ms;`).exec(tokens);
    if (!found) throw new Error(`no ${name} in app/globals.css`);
    return Number(found[1]);
  };

  const beat = ms("--time-intro-beat");
  const cover = ms("--time-intro-cover");
  const lift = ms("--time-intro-lift");
  const hold = ms("--time-intro-hold");

  it("is counted in whole beats", () => {
    for (const time of [cover, lift, hold]) expect(time % beat).toBe(0);
  });

  it("has the cover off the screen within three seconds, and at once when it is skipped", () => {
    expect(cover + lift).toBeGreaterThan(2000);
    expect(cover + lift).toBeLessThanOrEqual(3000);
    expect(ms("--time-intro-skip")).toBeLessThanOrEqual(250);
  });

  it("never lets the backstop cut the lift short", () => {
    expect(INTRO_BACKSTOP_MS).toBeGreaterThan(cover + lift);
  });

  it("starts the hero sheet while the cover lifts", () => {
    expect(hold).toBeGreaterThanOrEqual(cover);
    expect(hold).toBeLessThan(cover + lift);
  });

  it("draws the window's scrollbar in ink only until the page comes into play", () => {
    // An animation that runs out, not a rule: it cannot outlast the cover if the script stops.
    expect(tokens).toMatch(
      /:root\[data-intro="play"\]\s*\{\s*animation:\s*intro-scrollbar var\(--time-intro-hold\) linear;\s*\}/,
    );
    expect(tokens).toMatch(/scrollbar-color:\s*var\(--ink\) var\(--ink\);/);
  });

  it("ends everything that moves by itself within five seconds of first paint", () => {
    const blinks = Number(/--intro-blinks:\s*(\d+);/.exec(tokens)?.[1]);
    expect(blinks).toBeGreaterThanOrEqual(1);
    expect(tokens).toMatch(/:root\[data-intro\]\s*\{\s*--intro-hold:\s*var\(--time-intro-hold\);/);

    // As tally.module.css and blank.module.css compute them: block i of ten starts i gaps after
    // the hold, and the caret starts twelve gaps after it.
    const gap = ms("--time-fill-gap");
    const tallyEnd = hold + 9 * gap + ms("--time-fill");
    const caretEnd = hold + 12 * gap + blinks * ms("--time-blink");
    expect(tallyEnd).toBeLessThanOrEqual(5000);
    expect(caretEnd).toBeLessThanOrEqual(5000);
  });
});

describe("the cover as drawn", () => {
  const html = renderToStaticMarkup(createElement(IntroCover));

  it("is one decoration over the page: hidden from assistive technology, nothing to focus", () => {
    expect(html.match(new RegExp(`${INTRO_COVER_ATTRIBUTE}=`, "g"))).toHaveLength(1);
    expect(html).toMatch(new RegExp(`^<div ${INTRO_COVER_ATTRIBUTE}="" aria-hidden="true"`));
    expect(html).not.toMatch(/<(a|button|input|select|textarea|dialog)\b|tabindex|role=/i);
  });

  it("writes the mark as three strokes, each one unit long: the tail under the two of the A", () => {
    expect(html).toContain('viewBox="0 0 32 24"');
    expect(html.match(/<path/g)).toHaveLength(3);
    expect(html.match(/pathLength="1"/g)).toHaveLength(3);
    expect(html.match(/stroke-width="4\.2"/g)).toHaveLength(3);
    expect(html.match(/stroke-linecap="round"/g)).toHaveLength(3);

    const tail = html.indexOf(`d="${MARK_TAIL_D}"`);
    const legs = html.indexOf(`d="${MARK_LEGS_D}"`);
    const bar = html.indexOf(`d="${MARK_BAR_D}"`);
    expect(tail).toBeGreaterThan(-1);
    expect(legs).toBeGreaterThan(tail);
    expect(bar).toBeGreaterThan(legs);
  });

  it("has ten blocks, numbered for their turn", () => {
    const turns = [...html.matchAll(/style="--i:(\d+)"/g)].map((match) => Number(match[1]));
    expect(turns).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("sets the name once, as one unbroken word in one element", () => {
    expect(SITE.name).toBe("Advanta365");
    expect(html.match(new RegExp(`>${SITE.name}</span>`, "g"))).toHaveLength(1);
    expect(html.match(new RegExp(SITE.name, "g"))).toHaveLength(1);
  });
});
