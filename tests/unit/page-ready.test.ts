import { afterEach, describe, expect, test, vi } from "vitest";

/**
 * The module is a singleton with module-level state, so every case stubs a minimal `document` /
 * `window` on globalThis, resets the module registry and imports a fresh copy.
 */

type Listener = () => void;

type DomOptions = {
  /** `<html>` starts with data-entry + data-entry-brand, as after the inline script on "/". */
  entry?: boolean;
  readyState?: "loading" | "interactive" | "complete";
  /** `document.fonts.ready`; null removes `document.fonts` altogether. */
  fonts?: Promise<unknown> | null;
};

function stubDom({
  entry = false,
  readyState = "complete",
  fonts = Promise.resolve(),
}: DomOptions = {}) {
  const attributes = new Set<string>(entry ? ["data-entry", "data-entry-brand"] : []);
  const listeners = new Map<string, Set<Listener>>();
  const once = new WeakSet<Listener>();

  const documentStub = {
    readyState,
    fonts: fonts === null ? undefined : { ready: fonts },
    documentElement: {
      hasAttribute: (name: string) => attributes.has(name),
      setAttribute: (name: string) => {
        attributes.add(name);
      },
      removeAttribute: (name: string) => {
        attributes.delete(name);
      },
    },
  };

  const windowStub = {
    addEventListener(type: string, listener: Listener, options?: { once?: boolean }) {
      const set = listeners.get(type) ?? new Set<Listener>();
      set.add(listener);
      listeners.set(type, set);
      if (options?.once) once.add(listener);
    },
    removeEventListener(type: string, listener: Listener) {
      listeners.get(type)?.delete(listener);
    },
  };

  vi.stubGlobal("document", documentStub);
  vi.stubGlobal("window", windowStub);

  return {
    attributes,
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
    dispatch(type: string) {
      for (const listener of Array.from(listeners.get(type) ?? [])) {
        if (once.has(listener)) listeners.get(type)?.delete(listener);
        listener();
      }
    },
    finishLoading() {
      documentStub.readyState = "complete";
      this.dispatch("load");
    },
  };
}

async function load() {
  vi.resetModules();
  return import("@/lib/motion/page-ready");
}

/** Lets every pending promise reaction run (real timers). */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Tracks whether a promise has resolved without awaiting it. */
function track(promise: Promise<void>) {
  const state = { resolved: false };
  void promise.then(() => {
    state.resolved = true;
  });
  return state;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("constants", () => {
  test("carry the contract values", async () => {
    stubDom();
    const ready = await load();
    expect(ready.ENTRY_OVERLAY_ATTRIBUTE).toBe("data-entry");
    expect(ready.ENTRY_BRAND_ATTRIBUTE).toBe("data-entry-brand");
    expect(ready.ENTRY_LOCK_ATTRIBUTE).toBe("data-entry-lock");
    expect(ready.ENTRY_LOCK_FRAMES).toBe(3);
    expect(ready.ENTRY_OVERLAY_FAILSAFE).toBe(14000);
    expect(ready.ENTRY_SCRIPT_FAILSAFE).toBe(16000);
    expect(ready.ENTRY_FAILSAFE_EVENT).toBe("a365:entry-failsafe");
    expect(ready.ENTRY_SWAP_DURATION).toBe(200);
    expect(ready.PAGE_READY_TIMEOUT).toBe(8000);
  });

  test("nothing beyond the contract is exported", async () => {
    stubDom();
    const ready = await load();
    expect(Object.keys(ready).sort()).toEqual(
      [
        "ENTRY_BRAND_ATTRIBUTE",
        "ENTRY_FAILSAFE_EVENT",
        "ENTRY_LOCK_ATTRIBUTE",
        "ENTRY_LOCK_FRAMES",
        "ENTRY_OVERLAY_ATTRIBUTE",
        "ENTRY_OVERLAY_FAILSAFE",
        "ENTRY_SCRIPT_FAILSAFE",
        "ENTRY_SWAP_DURATION",
        "PAGE_READY_TIMEOUT",
        "claimReady",
        "clearEntryBrand",
        "clearEntryOverlay",
        "hasEntryOverlay",
        "isOverlayLifted",
        "liftOverlay",
        "onOverlayLifted",
        "whenPageReady",
      ].sort(),
    );
  });
});

describe("entry attributes", () => {
  test("hasEntryOverlay follows data-entry on <html>", async () => {
    const dom = stubDom({ entry: true });
    const ready = await load();
    expect(ready.hasEntryOverlay()).toBe(true);
    ready.clearEntryOverlay();
    expect(ready.hasEntryOverlay()).toBe(false);
    expect(dom.attributes.has("data-entry")).toBe(false);
    expect(dom.attributes.has("data-entry-brand")).toBe(true);
  });

  test("clearEntryBrand removes only data-entry-brand", async () => {
    const dom = stubDom({ entry: true });
    const ready = await load();
    ready.clearEntryBrand();
    expect(dom.attributes.has("data-entry-brand")).toBe(false);
    expect(dom.attributes.has("data-entry")).toBe(true);
  });
});

describe("overlay lift", () => {
  test("isOverlayLifted is true from the first call when the attribute is absent", async () => {
    stubDom();
    const ready = await load();
    expect(ready.isOverlayLifted()).toBe(true);
  });

  test("isOverlayLifted is false under the overlay and true forever after the lift", async () => {
    stubDom({ entry: true });
    const ready = await load();
    expect(ready.isOverlayLifted()).toBe(false);
    ready.liftOverlay();
    expect(ready.isOverlayLifted()).toBe(true);
    // The attribute is cleared separately; the lifted flag does not depend on it any more.
    expect(ready.hasEntryOverlay()).toBe(true);
    expect(ready.isOverlayLifted()).toBe(true);
  });

  test("removing the attribute alone does not lift (only liftOverlay does)", async () => {
    stubDom({ entry: true });
    const ready = await load();
    expect(ready.isOverlayLifted()).toBe(false);
    ready.clearEntryOverlay();
    expect(ready.isOverlayLifted()).toBe(false);
  });

  test("onOverlayLifted fires exactly once on liftOverlay", async () => {
    stubDom({ entry: true });
    const ready = await load();
    const listener = vi.fn();
    ready.onOverlayLifted(listener);
    expect(listener).not.toHaveBeenCalled();
    ready.liftOverlay();
    expect(listener).toHaveBeenCalledTimes(1);
    ready.liftOverlay();
    ready.liftOverlay();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("onOverlayLifted never fires when there was no overlay", async () => {
    stubDom();
    const ready = await load();
    const listener = vi.fn();
    const unsubscribe = ready.onOverlayLifted(listener);
    ready.liftOverlay();
    expect(listener).not.toHaveBeenCalled();
    expect(() => unsubscribe()).not.toThrow();
  });

  test("onOverlayLifted never fires for a subscriber that arrives after the lift", async () => {
    stubDom({ entry: true });
    const ready = await load();
    ready.liftOverlay();
    const listener = vi.fn();
    ready.onOverlayLifted(listener);
    ready.liftOverlay();
    expect(listener).not.toHaveBeenCalled();
  });

  test("an unsubscribed listener is not called", async () => {
    stubDom({ entry: true });
    const ready = await load();
    const kept = vi.fn();
    const dropped = vi.fn();
    ready.onOverlayLifted(kept);
    const unsubscribe = ready.onOverlayLifted(dropped);
    unsubscribe();
    unsubscribe();
    ready.liftOverlay();
    expect(kept).toHaveBeenCalledTimes(1);
    expect(dropped).not.toHaveBeenCalled();
  });

  test("a throwing listener does not keep the others behind the overlay", async () => {
    stubDom({ entry: true });
    const ready = await load();
    const after = vi.fn();
    ready.onOverlayLifted(() => {
      throw new Error("renderer went away");
    });
    ready.onOverlayLifted(after);
    expect(() => ready.liftOverlay()).not.toThrow();
    expect(after).toHaveBeenCalledTimes(1);
    expect(ready.isOverlayLifted()).toBe(true);
  });

  test("the inline script's failsafe event lifts the overlay, via one listener", async () => {
    const dom = stubDom({ entry: true });
    const ready = await load();
    const listener = vi.fn();
    ready.onOverlayLifted(listener);
    ready.isOverlayLifted();
    ready.claimReady()();
    expect(dom.listenerCount(ready.ENTRY_FAILSAFE_EVENT)).toBe(1);

    dom.dispatch(ready.ENTRY_FAILSAFE_EVENT);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(ready.isOverlayLifted()).toBe(true);
    expect(dom.listenerCount(ready.ENTRY_FAILSAFE_EVENT)).toBe(0);
  });
});

describe("ready claims", () => {
  test("whenPageReady resolves once the window has loaded and fonts are ready", async () => {
    stubDom();
    const ready = await load();
    await expect(ready.whenPageReady()).resolves.toBeUndefined();
  });

  test("whenPageReady is memoised", async () => {
    stubDom();
    const ready = await load();
    expect(ready.whenPageReady()).toBe(ready.whenPageReady());
  });

  test("whenPageReady waits for the window load event", async () => {
    const dom = stubDom({ readyState: "interactive" });
    const ready = await load();
    const state = track(ready.whenPageReady());
    await flush();
    expect(state.resolved).toBe(false);
    dom.finishLoading();
    await flush();
    expect(state.resolved).toBe(true);
  });

  test("whenPageReady waits for document.fonts.ready and survives its rejection", async () => {
    let failFonts: (reason: Error) => void = () => {};
    const fonts = new Promise<void>((_resolve, reject) => {
      failFonts = reject;
    });
    stubDom({ fonts });
    const ready = await load();
    const state = track(ready.whenPageReady());
    await flush();
    expect(state.resolved).toBe(false);
    failFonts(new Error("font load failed"));
    await flush();
    expect(state.resolved).toBe(true);
  });

  test("whenPageReady works without document.fonts", async () => {
    stubDom({ fonts: null });
    const ready = await load();
    await expect(ready.whenPageReady()).resolves.toBeUndefined();
  });

  test("whenPageReady waits for every claim; release is idempotent", async () => {
    stubDom({ entry: true });
    const ready = await load();
    const releaseHero = ready.claimReady();
    const releaseSwirl = ready.claimReady();
    const state = track(ready.whenPageReady());

    await flush();
    expect(state.resolved).toBe(false);

    releaseHero();
    releaseHero();
    releaseHero();
    await flush();
    // Releasing one claim three times must not stand in for the other claim.
    expect(state.resolved).toBe(false);

    releaseSwirl();
    await flush();
    expect(state.resolved).toBe(true);
    expect(() => {
      releaseHero();
      releaseSwirl();
    }).not.toThrow();
  });

  test("a claim made while the page is draining is awaited too", async () => {
    stubDom({ entry: true });
    const ready = await load();
    const releaseFirst = ready.claimReady();
    const state = track(ready.whenPageReady());
    await flush();

    const releaseLate = ready.claimReady();
    releaseFirst();
    await flush();
    expect(state.resolved).toBe(false);

    releaseLate();
    await flush();
    expect(state.resolved).toBe(true);
  });

  test("a claim made before the window load is still awaited after it", async () => {
    const dom = stubDom({ entry: true, readyState: "loading" });
    const ready = await load();
    const release = ready.claimReady();
    const state = track(ready.whenPageReady());
    dom.finishLoading();
    await flush();
    expect(state.resolved).toBe(false);
    release();
    await flush();
    expect(state.resolved).toBe(true);
  });

  test("an unreleased claim holds the page for at most 8000ms", async () => {
    vi.useFakeTimers();
    stubDom({ entry: true });
    const ready = await load();
    ready.claimReady();
    const state = track(ready.whenPageReady());

    await vi.advanceTimersByTimeAsync(ready.PAGE_READY_TIMEOUT - 1);
    expect(state.resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(state.resolved).toBe(true);
  });

  test("a window that never loads is capped by the same 8000ms", async () => {
    vi.useFakeTimers();
    stubDom({ readyState: "loading" });
    const ready = await load();
    const state = track(ready.whenPageReady());
    await vi.advanceTimersByTimeAsync(7999);
    expect(state.resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(state.resolved).toBe(true);
  });

  test("the cap leaves no timer behind once the page is ready", async () => {
    vi.useFakeTimers();
    stubDom();
    const ready = await load();
    const state = track(ready.whenPageReady());
    await vi.advanceTimersByTimeAsync(0);
    expect(state.resolved).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("once the page is ready, claimReady is a harmless no-op", async () => {
    stubDom();
    const ready = await load();
    await ready.whenPageReady();
    const release = ready.claimReady();
    expect(() => {
      release();
      release();
    }).not.toThrow();
    await expect(ready.whenPageReady()).resolves.toBeUndefined();
  });

  test("claims on a route without the overlay are harmless when nobody awaits them", async () => {
    stubDom();
    const ready = await load();
    const release = ready.claimReady();
    expect(ready.isOverlayLifted()).toBe(true);
    expect(() => release()).not.toThrow();
  });
});

describe("without a DOM (server render, worker)", () => {
  test("importing and calling page-ready does not throw", async () => {
    expect(typeof document).toBe("undefined");
    expect(typeof window).toBe("undefined");
    const ready = await load();
    expect(ready.hasEntryOverlay()).toBe(false);
    expect(ready.isOverlayLifted()).toBe(true);
    expect(() => {
      ready.clearEntryOverlay();
      ready.clearEntryBrand();
      ready.liftOverlay();
      ready.claimReady()();
      ready.onOverlayLifted(() => {})();
    }).not.toThrow();
    await expect(ready.whenPageReady()).resolves.toBeUndefined();
  });

  test("a server-side answer is not cached into the client state", async () => {
    const ready = await load();
    expect(ready.isOverlayLifted()).toBe(true);
    // Same module instance, now with a document that has the overlay.
    stubDom({ entry: true });
    expect(ready.isOverlayLifted()).toBe(false);
  });

  test("the shared GL helper imports without a DOM and exposes its pure parts", async () => {
    const program = await import("@/lib/gl/program");
    expect(program.FULLSCREEN_TRIANGLE_VS.startsWith("#version 300 es\n")).toBe(true);
    expect(program.FULLSCREEN_TRIANGLE_VS).toContain("out vec2 v_uv;");
    expect(program.FULLSCREEN_TRIANGLE_VS).toContain("gl_VertexID");

    expect(program.hexToRgba("#fff")).toEqual([1, 1, 1, 1]);
    expect(program.hexToRgba("#000")).toEqual([0, 0, 0, 1]);
    expect(program.hexToRgba("#f008")).toEqual([1, 0, 0, 136 / 255]);
    expect(program.hexToRgba("#181818")).toEqual([24 / 255, 24 / 255, 24 / 255, 1]);
    expect(program.hexToRgba("#ffffff00")).toEqual([1, 1, 1, 0]);
    expect(program.hexToRgba("#FFFFFFCC")).toEqual([1, 1, 1, 204 / 255]);
    expect(program.hexToRgba("18f")).toEqual([17 / 255, 136 / 255, 1, 1]);
    expect(program.hexToRgba("not a colour")).toEqual([0, 0, 0, 1]);
    expect(program.hexToRgba("#12345")).toEqual([0, 0, 0, 1]);
  });
});
