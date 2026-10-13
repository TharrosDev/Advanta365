import { gzipSync } from "node:zlib";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IntroScript } from "@/components/intro/intro-script-tag";
import { BOOT_SCRIPT } from "@/lib/boot/boot-script";
import {
  INTRO_BACKSTOP_MS,
  INTRO_CLICK_GUARD_MS,
  INTRO_FLAG,
  INTRO_SEEN,
  INTRO_SKIP_EVENTS,
  shouldPlayIntro,
} from "@/lib/boot/state";

// The inline boot script, run here against stand-ins for the few globals it touches, and compared
// branch by branch with the pure decisions it mirrors.

type StandInEvent = {
  type: string;
  target: unknown;
  pointerType?: string;
  stopPropagation?: () => void;
  preventDefault?: () => void;
};
type Listener = (event: StandInEvent) => void;

type World = {
  path?: string;
  /** Media features that match, e.g. "prefers-reduced-motion: reduce". */
  media?: string[];
  stored?: Record<string, string>;
  storage?: "works" | "throws";
  timelines?: boolean;
  visibility?: "visible" | "hidden";
};

/** Runs the script the way a page load does and hands back what it did. */
function load(world: World = {}) {
  const {
    path = "/",
    media = [],
    stored = {},
    storage = "works",
    timelines = true,
    visibility = "visible",
  } = world;
  const attributes = new Map<string, string>();
  const store = new Map<string, string>(Object.entries(stored));
  const listeners = new Map<string, Set<Listener>>();
  const timers: ({ run: () => void; after: number } | undefined)[] = [];
  const queries: string[] = [];
  const denied = () => {
    throw new Error("storage is not available");
  };

  const documentStandIn = {
    documentElement: {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      getAttribute: (name: string) => attributes.get(name) ?? null,
      hasAttribute: (name: string) => attributes.has(name),
      removeAttribute: (name: string) => attributes.delete(name),
    },
    visibilityState: visibility,
  };

  const globals: Record<string, unknown> = {
    document: documentStandIn,
    location: { pathname: path },
    sessionStorage:
      storage === "throws"
        ? { getItem: denied, setItem: denied }
        : {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: string) => store.set(key, value),
          },
    matchMedia: (query: string) => {
      queries.push(query);
      return { matches: media.some((feature) => query === `(${feature})`) };
    },
    CSS: { supports: (rule: string) => timelines && rule === "animation-timeline: view()" },
    addEventListener: (type: string, listener: Listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(listener);
    },
    removeEventListener: (type: string, listener: Listener) =>
      listeners.get(type)?.delete(listener),
    setTimeout: (run: () => void, after: number) => timers.push({ run, after }),
    clearTimeout: (id: number) => {
      timers[id - 1] = undefined;
    },
  };

  new Function(...Object.keys(globals), BOOT_SCRIPT)(...Object.values(globals));

  const cover = { hasAttribute: (name: string) => name === "data-intro-cover" };
  const child = { hasAttribute: () => false };
  return {
    attribute: (name: string) => attributes.get(name) ?? null,
    attributes,
    store,
    queries,
    listening: () =>
      [...listeners.entries()].filter(([, set]) => set.size > 0).map(([type]) => type),
    send: (type: string, target: unknown = child, extra: Partial<StandInEvent> = {}) =>
      [...(listeners.get(type) ?? [])].forEach((listener) => listener({ type, target, ...extra })),
    timers: () => timers.flatMap((timer) => (timer ? [timer.after] : [])),
    runTimer: (after: number) => {
      const index = timers.findIndex((timer) => timer?.after === after);
      const timer = timers[index];
      timers[index] = undefined;
      timer?.run();
    },
    cover,
    child,
  };
}

describe("the names", () => {
  it("live in the site's own storage namespace", () => {
    expect(INTRO_FLAG).toBe("advanta365.intro.v1");
    expect(INTRO_SEEN).toBe("1");
  });
});

describe("reduced motion", () => {
  it("stops at once: no motion, no timelines, no cover, nothing stored", () => {
    const page = load({ media: ["prefers-reduced-motion: reduce"] });
    expect([...page.attributes]).toEqual([]);
    expect(page.store.size).toBe(0);
    expect(page.listening()).toEqual([]);
    expect(page.timers()).toEqual([]);
  });
});

describe("motion", () => {
  it("is switched on, with timelines where the browser has them", () => {
    expect(load().attribute("data-motion")).toBe("on");
    expect(load().attribute("data-timeline")).toBe("on");
    expect(load({ timelines: false }).attribute("data-motion")).toBe("on");
    expect(load({ timelines: false }).attribute("data-timeline")).toBeNull();
  });
});

describe("the cover", () => {
  it("plays exactly when the pure decision says so", () => {
    for (const path of ["/", "/purchase", "/catalog", "/phases/prepare"]) {
      for (const seen of [true, false]) {
        for (const reducedMotion of [true, false]) {
          for (const visible of [true, false]) {
            const page = load({
              path,
              stored: seen ? { [INTRO_FLAG]: INTRO_SEEN } : {},
              media: reducedMotion ? ["prefers-reduced-motion: reduce"] : [],
              visibility: visible ? "visible" : "hidden",
            });
            expect(
              page.attribute("data-intro") === "play",
              `${path} ${seen} ${reducedMotion}`,
            ).toBe(shouldPlayIntro({ path, seen, reducedMotion, visible }));
          }
        }
      }
    }
  });

  it("counts the first load of a session on whichever page it is", () => {
    const inner = load({ path: "/purchase" });
    expect(inner.attribute("data-intro")).toBeNull();
    expect(inner.store.get(INTRO_FLAG)).toBe(INTRO_SEEN);
    expect(
      load({ path: "/", stored: Object.fromEntries(inner.store) }).attribute("data-intro"),
    ).toBeNull();
  });

  it("never plays when storage cannot be read", () => {
    const page = load({ storage: "throws" });
    expect(page.attribute("data-intro")).toBeNull();
    expect(page.listening()).toEqual([]);
  });

  it("leaves at the first press, key, wheel turn or touch, and then stops listening for them", () => {
    for (const type of INTRO_SKIP_EVENTS) {
      const page = load();
      expect(page.listening()).toEqual(expect.arrayContaining([...INTRO_SKIP_EVENTS]));
      page.send(type);
      expect(page.attribute("data-intro")).toBe("leave");
      for (const other of INTRO_SKIP_EVENTS) expect(page.listening()).not.toContain(other);
    }
  });

  describe("the click guard", () => {
    /** A click, with what the script does to it recorded. */
    const click = () => {
      const calls: string[] = [];
      return {
        calls,
        extra: {
          stopPropagation: () => calls.push("stop"),
          preventDefault: () => calls.push("prevent"),
        },
      };
    };

    it("swallows the first click after a touch or a pen ended the cover, and only that one", () => {
      const presses = [
        ["pointerdown", { pointerType: "touch" }],
        ["pointerdown", { pointerType: "pen" }],
        ["touchstart", {}],
      ] as const;
      for (const [type, extra] of presses) {
        const page = load();
        expect(page.listening()).not.toContain("click");
        page.send(type, page.cover, extra);
        expect(page.attribute("data-intro")).toBe("leave");
        expect(page.listening()).toContain("click");
        expect(page.timers()).toContain(INTRO_CLICK_GUARD_MS);

        const first = click();
        page.send("click", page.child, first.extra);
        expect(first.calls).toEqual(["stop", "prevent"]);
        expect(page.listening()).not.toContain("click");
        expect(page.timers()).not.toContain(INTRO_CLICK_GUARD_MS);

        const second = click();
        page.send("click", page.child, second.extra);
        expect(second.calls).toEqual([]);
      }
    });

    it("is not set for a mouse, a key or the wheel, whose clicks go where they were aimed", () => {
      const inputs = [
        ["pointerdown", { pointerType: "mouse" }],
        ["pointerdown", {}],
        ["keydown", {}],
        ["wheel", {}],
      ] as const;
      for (const [type, extra] of inputs) {
        const page = load();
        page.send(type, page.cover, extra);
        expect(page.attribute("data-intro")).toBe("leave");
        expect(page.listening()).not.toContain("click");
        expect(page.timers()).not.toContain(INTRO_CLICK_GUARD_MS);
      }
    });

    it("lets go when its time is up, so a later click is the visitor's own", () => {
      const page = load();
      page.send("touchstart", page.cover);
      page.runTimer(INTRO_CLICK_GUARD_MS);
      expect(page.listening()).not.toContain("click");
      const later = click();
      page.send("click", page.child, later.extra);
      expect(later.calls).toEqual([]);
    });

    it("outlives the cover: a tap held past the 200ms skip still does not click what is under it", () => {
      const page = load();
      page.send("pointerdown", page.cover, { pointerType: "touch" });
      page.send("animationend", page.cover);
      expect(page.attribute("data-intro")).toBeNull();
      expect(page.listening()).toEqual(["click"]);
      const held = click();
      page.send("click", page.child, held.extra);
      expect(held.calls).toEqual(["stop", "prevent"]);
      expect(page.listening()).toEqual([]);
    });

    it("is longer than the skip itself and shorter than a long press", () => {
      expect(INTRO_CLICK_GUARD_MS).toBeGreaterThan(200);
      expect(INTRO_CLICK_GUARD_MS).toBeLessThanOrEqual(1000);
    });
  });

  it("is not restarted by an input once it has begun to leave by itself", () => {
    const page = load();
    page.send("animationstart", page.child); // a pen stroke: not the cover's own
    expect(page.listening()).toContain("keydown");
    page.send("animationstart", page.cover);
    expect(page.listening()).not.toContain("keydown");
    page.send("keydown");
    expect(page.attribute("data-intro")).toBe("play");
  });

  it("is taken off when the cover's own animation ends, and only then", () => {
    const page = load();
    page.send("animationend", page.child);
    expect(page.attribute("data-intro")).toBe("play");
    page.send("animationend", page.cover);
    expect(page.attribute("data-intro")).toBeNull();
    expect(page.listening()).toEqual([]);
    expect(page.timers()).not.toContain(INTRO_BACKSTOP_MS);
  });

  it("is taken off by the backstop, whatever else happened", () => {
    expect(INTRO_BACKSTOP_MS).toBe(5500);
    for (const state of ["play", "leave"]) {
      const page = load();
      page.attributes.set("data-intro", state);
      page.runTimer(INTRO_BACKSTOP_MS);
      expect(page.attribute("data-intro")).toBeNull();
      expect(page.listening()).toEqual([]);
    }
  });
});

describe("the script as shipped", () => {
  it("weighs at most 1.5KB gzipped", () => {
    expect(gzipSync(BOOT_SCRIPT, { level: 9 }).byteLength).toBeLessThanOrEqual(1536);
  });

  it("cannot end the script element it is printed in", () => {
    expect(BOOT_SCRIPT).not.toMatch(/<\/script/i);
    expect(BOOT_SCRIPT).not.toContain("<!--");
  });

  it("is printed as the HTML of a hidden wrapper, not as a script element of React's own", () => {
    const html = renderToStaticMarkup(createElement(IntroScript));
    expect(html.startsWith("<div hidden")).toBe(true);
    expect(html).toContain(`<script>${BOOT_SCRIPT}</script>`);
    expect(html.match(/<script>/g)).toHaveLength(1);
  });
});
