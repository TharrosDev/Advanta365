import { gzipSync } from "node:zlib";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IntroScript } from "@/components/intro/intro-script-tag";
import { BOOT_SCRIPT } from "@/lib/boot/boot-script";
import {
  INK_BACKSTOP_MS,
  INK_KEY,
  INK_OFF,
  INK_PAUSED,
  inkMode,
  INTRO_BACKSTOP_MS,
  INTRO_FLAG,
  INTRO_SEEN,
  INTRO_SKIP_EVENTS,
  INTRO_TAKEOVER_MS,
  isCalmRoute,
  isSoftwareRenderer,
  shouldPlayIntro,
} from "@/lib/boot/state";

// The inline boot script, run here against stand-ins for the few globals it touches, and compared
// branch by branch with the pure decisions it mirrors.

type Listener = (event: { type: string; target: unknown }) => void;

const RENDERER = 0x1f01;
const UNMASKED = 0x9246;
const HARDWARE = "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)";
const SOFTWARE = "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)";

type World = {
  path?: string;
  /** Media features that match, e.g. "prefers-reduced-motion: reduce". */
  media?: string[];
  stored?: Record<string, string>;
  storage?: "works" | "throws";
  /** Whether the GPU gives a hardware context, and whether that context has float targets. */
  /**
   * What the GPU gives: a hardware context with float targets, no context, one without float
   * targets, one drawn on the processor (under its plain name or its unmasked one), or an error.
   */
  gpu?: "able" | "none" | "no-float" | "software" | "software-masked" | "throws";
  saveData?: boolean;
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
    gpu = "able",
    saveData = false,
    timelines = true,
    visibility = "visible",
  } = world;
  const attributes = new Map<string, string>();
  const store = new Map<string, string>(Object.entries(stored));
  const listeners = new Map<string, Set<Listener>>();
  const timers: ({ run: () => void; after: number } | undefined)[] = [];
  const contexts: { lost: boolean; options: unknown }[] = [];
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
    createElement: (tag: string) => {
      expect(tag).toBe("canvas");
      return {
        getContext: (kind: string, options: unknown) => {
          expect(kind).toBe("webgl2");
          if (gpu === "throws") throw new Error("no context");
          if (gpu === "none") return null;
          const context = { lost: false, options };
          contexts.push(context);
          return {
            getExtension: (name: string) => {
              if (name === "WEBGL_lose_context") {
                return { loseContext: () => (context.lost = true) };
              }
              if (name === "EXT_color_buffer_half_float") return gpu === "no-float" ? null : {};
              if (name === "WEBGL_debug_renderer_info") {
                return gpu === "software-masked" ? null : { UNMASKED_RENDERER_WEBGL: UNMASKED };
              }
              return null;
            },
            RENDERER,
            getParameter: (name: number) => {
              const software = gpu === "software" || gpu === "software-masked";
              if (name === UNMASKED) return software ? SOFTWARE : HARDWARE;
              if (name === RENDERER)
                return software ? "llvmpipe (LLVM 15.0.7, 256 bits)" : "WebKit WebGL";
              return null;
            },
          };
        },
      };
    },
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
    navigator: saveData ? { connection: { saveData: true } } : {},
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
    contexts,
    queries,
    listening: () =>
      [...listeners.entries()].filter(([, set]) => set.size > 0).map(([type]) => type),
    send: (type: string, target: unknown = child) =>
      [...(listeners.get(type) ?? [])].forEach((listener) => listener({ type, target })),
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
    expect(INK_KEY).toBe("advanta365.ink.v1");
  });
});

describe("calm routes", () => {
  it("are the catalog and the pages under it", () => {
    for (const path of ["/catalog", "/catalog/", "/catalog/anything"]) {
      expect(isCalmRoute(path), path).toBe(true);
    }
  });

  it("are not the home page, the company pages, the purchase page or a phase", () => {
    for (const path of [
      "/",
      "/about",
      "/purchase",
      "/cart",
      "/bundles/launch-kit",
      "/templates/x",
      "/phases/prepare",
      "/catalogue",
      "/nope",
    ]) {
      expect(isCalmRoute(path), path).toBe(false);
    }
  });

  it("are marked by the script exactly where the rule says", () => {
    for (const path of ["/", "/catalog", "/catalog/x", "/purchase", "/templates/x", "/about"]) {
      expect(load({ path }).attribute("data-ink-route"), path).toBe(
        isCalmRoute(path) ? "calm" : null,
      );
    }
  });
});

describe("reduced motion", () => {
  it("sets the ink to still and stops: no motion, no timelines, no cover, nothing stored", () => {
    const page = load({ media: ["prefers-reduced-motion: reduce"] });
    expect([...page.attributes]).toEqual([["data-ink", "still"]]);
    expect(page.store.size).toBe(0);
    expect(page.contexts).toEqual([]);
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

describe("the ink", () => {
  const MEDIA = [
    [],
    ["prefers-contrast: more"],
    ["forced-colors: active"],
    ["prefers-reduced-data: reduce"],
  ];
  const STORED = [null, INK_OFF, INK_PAUSED, "high", "medium", "low", "something else"];
  const GPUS = ["able", "none", "no-float", "software", "software-masked", "throws"] as const;

  it("starts as the pure decision says, in every combination", () => {
    for (const media of MEDIA) {
      for (const stored of STORED) {
        for (const gpu of GPUS) {
          for (const saveData of [false, true]) {
            const page = load({
              path: "/purchase",
              media,
              gpu,
              saveData,
              stored: stored === null ? {} : { [INK_KEY]: stored },
            });
            const expected = inkMode({
              reducedMotion: false,
              contrast: media.some(
                (m) => m.startsWith("prefers-contrast") || m.startsWith("forced"),
              ),
              saveData: saveData || media.includes("prefers-reduced-data: reduce"),
              stored,
              capable: () => gpu === "able",
            });
            expect(
              page.attribute("data-ink"),
              JSON.stringify({ media, stored, gpu, saveData }),
            ).toBe(expected);
          }
        }
      }
    }
  });

  it("asks the GPU only when the session has no choice yet, and gives the context back", () => {
    const first = load({ path: "/about" });
    expect(first.attribute("data-ink")).toBe("live");
    expect(first.contexts).toHaveLength(1);
    expect(first.contexts[0]?.options).toEqual({ failIfMajorPerformanceCaveat: true });
    expect(first.contexts[0]?.lost).toBe(true);
    // A device that can is not stored: the layer stores the tier it settles on.
    expect(first.store.has(INK_KEY)).toBe(false);

    for (const stored of ["high", INK_PAUSED, INK_OFF]) {
      expect(load({ stored: { [INK_KEY]: stored } }).contexts).toEqual([]);
    }
    expect(load({ media: ["prefers-contrast: more"] }).contexts).toEqual([]);
  });

  it("remembers a device that cannot as off", () => {
    for (const gpu of ["none", "no-float", "software", "software-masked", "throws"] as const) {
      const page = load({ path: "/about", gpu });
      expect(page.attribute("data-ink")).toBe("still");
      expect(page.store.get(INK_KEY)).toBe(INK_OFF);
    }
    // A context that is turned down is still given back.
    expect(load({ gpu: "no-float" }).contexts[0]?.lost).toBe(true);
    expect(load({ gpu: "software" }).contexts[0]?.lost).toBe(true);
  });

  it("tells a software renderer by its name, as the pure rule does", () => {
    expect(isSoftwareRenderer(SOFTWARE)).toBe(true);
    expect(isSoftwareRenderer("llvmpipe (LLVM 15.0.7, 256 bits)")).toBe(true);
    expect(isSoftwareRenderer("Microsoft Basic Render Driver")).toBe(true);
    expect(isSoftwareRenderer(HARDWARE)).toBe(false);
    expect(isSoftwareRenderer("Apple M2")).toBe(false);
    expect(isSoftwareRenderer("")).toBe(false);
  });

  it("falls back to stills when no layer has claimed live ink after six seconds", () => {
    const unclaimed = load({ path: "/about" });
    expect(unclaimed.timers()).toContain(INK_BACKSTOP_MS);
    unclaimed.runTimer(INK_BACKSTOP_MS);
    expect(unclaimed.attribute("data-ink")).toBe("still");

    const claimed = load({ path: "/about" });
    claimed.attributes.set("data-ink-layer", "");
    claimed.runTimer(INK_BACKSTOP_MS);
    expect(claimed.attribute("data-ink")).toBe("live");

    const paused = load({ path: "/about", stored: { [INK_KEY]: INK_PAUSED } });
    expect(paused.timers()).not.toContain(INK_BACKSTOP_MS);
  });

  it("survives storage that throws: the device is asked, nothing is stored", () => {
    const page = load({ path: "/about", storage: "throws" });
    expect(page.attribute("data-ink")).toBe("live");
    expect(load({ path: "/about", storage: "throws", gpu: "none" }).attribute("data-ink")).toBe(
      "still",
    );
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

  it("can be left while the ink has it", () => {
    const page = load();
    page.attributes.set("data-intro", "ink");
    page.send("keydown");
    expect(page.attribute("data-intro")).toBe("leave");
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

  it("leaves the backstop room for the longest cover the ink can take over", () => {
    // The ink may take the cover over up to 1600ms in, and the cover then needs 3500ms more.
    expect(INTRO_TAKEOVER_MS).toBe(1600);
    expect(INTRO_TAKEOVER_MS + 3500).toBeLessThan(INTRO_BACKSTOP_MS);
  });

  it("is taken off by the backstop, whatever else happened", () => {
    expect(INTRO_BACKSTOP_MS).toBe(5500);
    for (const state of ["play", "ink", "leave"]) {
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
