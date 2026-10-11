import { describe, expect, it } from "vitest";
import { ENTRY_SCRIPT_SOURCE } from "@/components/entry/entry-script-source";
import {
  ENTRY_BRAND_ATTRIBUTE,
  ENTRY_FAILSAFE_EVENT,
  ENTRY_LOCK_ATTRIBUTE,
  ENTRY_OVERLAY_ATTRIBUTE,
  ENTRY_SCRIPT_FAILSAFE,
} from "@/lib/motion/page-ready";

/*
 * The inline entry script runs before anything else on the page and has no build step of its
 * own: if its text is not valid JavaScript the home intro silently never happens. These tests run
 * the exact text against hand-made stubs (no DOM library).
 */

const BACKSLASH = String.fromCharCode(92);

/** The script of the build brief (section 3.18), on one line. */
const EXPECTED_SOURCE =
  "(function(){try{" +
  "var d=document.documentElement;" +
  "if(location.pathname!=='/')return;" +
  "if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;" +
  "d.setAttribute('data-entry','');d.setAttribute('data-entry-brand','');" +
  "try{history.scrollRestoration='manual'}catch(e){}" +
  "setTimeout(function(){" +
  "if(!d.hasAttribute('data-entry')&&!d.hasAttribute('data-entry-brand'))return;" +
  "d.removeAttribute('data-entry');d.removeAttribute('data-entry-brand');d.removeAttribute('data-entry-lock');" +
  "try{history.scrollRestoration='auto'}catch(e){}" +
  "try{window.dispatchEvent(new Event('a365:entry-failsafe'))}catch(e){}" +
  "},16000);" +
  "}catch(e){}})()";

class StubEvent {
  constructor(readonly type: string) {}
}

type Timer = { callback: () => void; delay: number };

function run(options: {
  pathname: string;
  reducedMotion?: boolean;
  matchMedia?: boolean;
  lockedHistory?: boolean;
  source?: string;
}) {
  const attributes = new Map<string, string>();
  const documentElement = {
    setAttribute: (name: string, value: string) => void attributes.set(name, value),
    removeAttribute: (name: string) => void attributes.delete(name),
    hasAttribute: (name: string) => attributes.has(name),
  };
  const queries: string[] = [];
  const matchMedia = (query: string) => {
    queries.push(query);
    return { matches: options.reducedMotion === true };
  };
  const history: { scrollRestoration?: string } = options.lockedHistory
    ? Object.freeze({ scrollRestoration: "auto" })
    : {};
  const timers: Timer[] = [];
  const setTimeoutStub = (callback: () => void, delay: number) => {
    timers.push({ callback, delay });
    return timers.length;
  };
  const events: StubEvent[] = [];
  const windowStub = {
    matchMedia: options.matchMedia === false ? undefined : matchMedia,
    dispatchEvent: (event: StubEvent) => {
      events.push(event);
      return true;
    },
  };

  // Building the function is the parse check; calling it is the behaviour check.
  const script = new Function(
    "location",
    "document",
    "matchMedia",
    "history",
    "setTimeout",
    "window",
    "Event",
    `"use strict";${options.source ?? ENTRY_SCRIPT_SOURCE}`,
  );
  script(
    { pathname: options.pathname },
    { documentElement },
    matchMedia,
    history,
    setTimeoutStub,
    windowStub,
    StubEvent,
  );

  return { attributes, history, timers, events, queries };
}

describe("ENTRY_SCRIPT_SOURCE", () => {
  it("parses as JavaScript", () => {
    expect(() => new Function(ENTRY_SCRIPT_SOURCE)).not.toThrow();
  });

  it("contains no backslash, so nothing can be lost to string escaping", () => {
    expect(ENTRY_SCRIPT_SOURCE.includes(BACKSLASH)).toBe(false);
    // The trace a lost regular-expression escape would leave behind.
    expect(ENTRY_SCRIPT_SOURCE.includes("//")).toBe(false);
    expect(ENTRY_SCRIPT_SOURCE.includes(".replace(")).toBe(false);
    expect(ENTRY_SCRIPT_SOURCE.includes("RegExp")).toBe(false);
  });

  it("is safe to inline in a script element", () => {
    expect(ENTRY_SCRIPT_SOURCE.includes("<")).toBe(false);
    expect(ENTRY_SCRIPT_SOURCE.includes("\n")).toBe(false);
  });

  it("is exactly the specified script, built from the page-ready constants", () => {
    expect(ENTRY_OVERLAY_ATTRIBUTE).toBe("data-entry");
    expect(ENTRY_BRAND_ATTRIBUTE).toBe("data-entry-brand");
    expect(ENTRY_LOCK_ATTRIBUTE).toBe("data-entry-lock");
    expect(ENTRY_FAILSAFE_EVENT).toBe("a365:entry-failsafe");
    expect(ENTRY_SCRIPT_FAILSAFE).toBe(16000);
    expect(ENTRY_SCRIPT_SOURCE).toBe(EXPECTED_SOURCE);
  });

  it("marks a hard load of the home page and arms the failsafe", () => {
    const result = run({ pathname: "/" });
    expect([...result.attributes.keys()]).toEqual(["data-entry", "data-entry-brand"]);
    expect(result.attributes.get("data-entry")).toBe("");
    expect(result.attributes.get("data-entry-brand")).toBe("");
    expect(result.history.scrollRestoration).toBe("manual");
    expect(result.queries).toEqual(["(prefers-reduced-motion: reduce)"]);
    expect(result.timers).toHaveLength(1);
    expect(result.timers[0]?.delay).toBe(16000);
    expect(result.events).toHaveLength(0);
  });

  it.each(["/catalog", "/catalog/", "/phases/prepare", "//", "", "/index.html"])(
    "does nothing on %j",
    (pathname) => {
      const result = run({ pathname });
      expect(result.attributes.size).toBe(0);
      expect(result.history.scrollRestoration).toBeUndefined();
      expect(result.timers).toHaveLength(0);
      expect(result.events).toHaveLength(0);
    },
  );

  it("does nothing on the home page when reduced motion is requested", () => {
    const result = run({ pathname: "/", reducedMotion: true });
    expect(result.attributes.size).toBe(0);
    expect(result.history.scrollRestoration).toBeUndefined();
    expect(result.timers).toHaveLength(0);
  });

  it("still plays without matchMedia", () => {
    const result = run({ pathname: "/", matchMedia: false });
    expect(result.attributes.has("data-entry")).toBe(true);
    expect(result.timers).toHaveLength(1);
  });

  it("still plays when scroll restoration cannot be changed", () => {
    const result = run({ pathname: "/", lockedHistory: true });
    expect(result.attributes.has("data-entry")).toBe(true);
    expect(result.attributes.has("data-entry-brand")).toBe(true);
    expect(result.history.scrollRestoration).toBe("auto");
    expect(result.timers).toHaveLength(1);
  });

  it("failsafe: clears every entry attribute, restores scrolling and announces itself", () => {
    const result = run({ pathname: "/" });
    result.attributes.set("data-entry-lock", "");
    result.attributes.set("lang", "en");

    result.timers[0]?.callback();

    expect([...result.attributes.keys()]).toEqual(["lang"]);
    expect(result.history.scrollRestoration).toBe("auto");
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.type).toBe("a365:entry-failsafe");
  });

  it("failsafe: also fires when only the brand attribute is left", () => {
    const result = run({ pathname: "/" });
    result.attributes.delete("data-entry");

    result.timers[0]?.callback();

    expect(result.attributes.size).toBe(0);
    expect(result.events).toHaveLength(1);
  });

  it("failsafe: stays silent once the overlay has lifted by itself", () => {
    const result = run({ pathname: "/" });
    result.attributes.delete("data-entry");
    result.attributes.delete("data-entry-brand");
    result.history.scrollRestoration = "auto";
    result.attributes.set("data-entry-lock", "");

    result.timers[0]?.callback();

    expect(result.attributes.has("data-entry-lock")).toBe(true);
    expect(result.events).toHaveLength(0);
  });

  it("never throws, whatever the page gives it", () => {
    const script = new Function("location", "document", "window", ENTRY_SCRIPT_SOURCE);
    expect(() => script(undefined, undefined, undefined)).not.toThrow();
    expect(() => script({ pathname: "/" }, {}, {})).not.toThrow();
  });
});
