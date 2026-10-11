import { INK_KEY, INK_OFF, INK_PAUSED, INK_TIERS, isCalmRoute } from "@/lib/boot/state";
import { readPigments } from "@/lib/ink/pigments";
import {
  chooseStage,
  coverProgress,
  isScene,
  NINETY_FIRE,
  NINETY_REARM,
  REST_SECONDS,
  STAGES,
  visibleArea,
  WAKE_MS,
  type Candidate,
} from "@/lib/ink/stage";
import type { Ink, Rect, SceneName, Tier, Zone } from "@/lib/ink/types";
import {
  anchorRect,
  buildZones,
  capFor,
  isCalmKind,
  parseEdges,
  relativeRect,
  type CalmKind,
  type Measured,
} from "@/lib/ink/zones";

/**
 * The ink layer without React: it owns the one canvas of the document, moves it into the backdrop
 * that matters most on screen and runs that backdrop's scene there. `ink-layer.tsx` mounts it and
 * draws the pause button it asks for.
 *
 * The engine is a chunk of its own, fetched only when a backdrop comes near the viewport of a
 * visitor whose ink is live. Nothing here runs under reduced motion, on a calm route or on a device
 * the boot script found unable: there the stills of the backdrops stand in.
 */

type EngineModule = typeof import("@/lib/ink/engine");

/** Where the pause button goes, and what it offers. Null: there is no button. */
export type Control = { holder: Element; paused: boolean } | null;

export type Controller = {
  /** The pathname changed (or is told for the first time). */
  route(path: string): void;
  /** The pause button was pressed. */
  toggle(): void;
  destroy(): void;
};

/** What the test hook may ask of the layer. */
export type LayerHandle = {
  ink(): Ink | null;
  canvas(): HTMLCanvasElement | null;
  scene(): SceneName | null;
  /** Puts the canvas in the backdrop of a scene without starting the loop. */
  hold(scene: SceneName): Promise<Ink | null>;
  /** The calm rectangles of the current stage, in CSS pixels from the canvas's corner. */
  calm(): { kind: CalmKind; rect: Rect; cap: number; dark: boolean }[];
};

declare global {
  interface Window {
    __INK_TEST__?: boolean;
  }
}

let engine: Promise<EngineModule> | null = null;

/** Fetches the engine chunk, once. */
function loadEngine(): Promise<EngineModule> {
  engine ??= import("@/lib/ink/engine");
  return engine;
}

// A first visit opens under the cover, and the ink has about a second to join it: the fetch starts
// as soon as this module is evaluated, before hydration.
if (typeof document !== "undefined") {
  const root = document.documentElement;
  if (root.hasAttribute("data-intro") && root.getAttribute("data-ink") === "live") {
    loadEngine().catch(() => {
      engine = null;
    });
  }
}

const INTERACTIVE = "a, button, input, select, textarea, label, summary, [role='button']";

/** The latest moment of the cover's own timeline at which the ink may still take it over, in ms. */
const TAKE_OVER_BY = 1050;

const isTier = (value: unknown): value is Tier => (INK_TIERS as readonly unknown[]).includes(value);

function readStore(): string | null {
  try {
    return window.sessionStorage.getItem(INK_KEY);
  } catch {
    return null;
  }
}

function writeStore(value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(INK_KEY);
    else window.sessionStorage.setItem(INK_KEY, value);
  } catch {
    // No storage: the choice lasts for this page only.
  }
}

export function createController(onControl: (control: Control) => void): Controller {
  const root = document.documentElement;
  const cleanups: (() => void)[] = [];
  let destroyed = false;
  let calm = isCalmRoute(window.location.pathname);
  let loaded: EngineModule | null = null;
  let loading = false;
  let ink: Ink | null = null;
  let canvas: HTMLCanvasElement | null = null;
  /** The backdrop that holds the canvas, and its scene. */
  let current: HTMLElement | null = null;
  let scene: SceneName | null = null;
  /** A backdrop the canvas is about to move to, once the old slot has faded. */
  let moving: HTMLElement | null = null;
  let moveTimer = 0;
  let windowTimer = 0;
  let running = false;
  let resting = false;
  let paused = false;
  let lostOnce = false;
  let tookOver = false;
  let fired = false;
  let idle = 0;
  let frame = 0;
  let observer: IntersectionObserver | null = null;
  let lastDrop = 0;
  let press: { x: number; y: number; t: number } | null = null;

  const mode = () => root.getAttribute("data-ink");
  const live = () => mode() === "live" && !calm && !destroyed;
  const backdrops = () => Array.from(document.querySelectorAll<HTMLElement>("[data-ink-backdrop]"));
  const sceneOf = (backdrop: HTMLElement): SceneName | null => {
    const name = backdrop.getAttribute("data-scene");
    return isScene(name) ? name : null;
  };
  const slotOf = (backdrop: HTMLElement) => backdrop.querySelector<HTMLElement>("[data-ink-slot]");
  const holderOf = (backdrop: HTMLElement) => {
    const next = backdrop.nextElementSibling;
    return next?.hasAttribute("data-ink-control") ? next : null;
  };
  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

  function setRunning(value: boolean) {
    running = value;
    if (!value) resting = false;
    // The attribute says what is true: nothing runs before the engine is ready.
    canvas?.setAttribute("data-ink-running", String(value && root.hasAttribute("data-ink-ready")));
  }

  function showControl() {
    const holder = current && scene !== "intro" ? holderOf(current) : null;
    onControl(holder && !destroyed ? { holder, paused } : null);
  }

  // -------------------------------------------------------------------------------------------
  // Measuring a stage: its calm rectangles, its edges, its anchors
  // -------------------------------------------------------------------------------------------
  function measured(backdrop: HTMLElement): { origin: DOMRect; calm: Measured[] } {
    const origin = backdrop.getBoundingClientRect();
    const stage = backdrop.parentElement ?? backdrop;
    const list: Measured[] = [];
    for (const element of stage.querySelectorAll("[data-ink-calm]")) {
      const kind = element.getAttribute("data-ink-calm");
      if (!isCalmKind(kind)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width && rect.height) list.push({ kind, rect: relativeRect(rect, origin) });
    }
    return { origin, calm: list };
  }

  function zonesOf(backdrop: HTMLElement, name: SceneName): Zone[] {
    const { origin, calm: list } = measured(backdrop);
    return buildZones({
      canvas: { width: origin.width, height: origin.height },
      viewportWidth: window.innerWidth,
      ground: STAGES[name].ground,
      calm: list,
      edges: parseEdges(backdrop.getAttribute("data-edges")),
    });
  }

  function anchorsOf(backdrop: HTMLElement): Record<string, Rect> {
    const origin = backdrop.getBoundingClientRect();
    const stage = backdrop.parentElement ?? backdrop;
    const anchors: Record<string, Rect> = {};
    for (const element of stage.querySelectorAll("[data-ink-anchor]")) {
      const name = element.getAttribute("data-ink-anchor");
      const rect = element.getBoundingClientRect();
      if (name && rect.width && rect.height) {
        anchors[name] = anchorRect(relativeRect(rect, origin), origin);
      }
    }
    return anchors;
  }

  // -------------------------------------------------------------------------------------------
  // Choosing the backdrop
  // -------------------------------------------------------------------------------------------
  function candidates(): Candidate<HTMLElement>[] {
    const view = viewport();
    const cover = root.hasAttribute("data-intro");
    const list: Candidate<HTMLElement>[] = [];
    for (const backdrop of backdrops()) {
      const name = sceneOf(backdrop);
      if (!name) continue;
      // While the cover is up, the canvas belongs to it or to nothing.
      if (cover && !backdrop.closest("[data-intro-cover]")) continue;
      const rect = backdrop.getBoundingClientRect();
      list.push({
        id: backdrop,
        scene: name,
        top: rect.top,
        area: rect.width * rect.height,
        visible: visibleArea(rect, view),
      });
    }
    return list;
  }

  function choose() {
    if (destroyed || calm) return;
    const state = mode();
    if (state !== "live" && state !== "paused") return;
    const pick = chooseStage(candidates(), moving ?? current);
    if (state === "paused") {
      // Stills, no engine: the same button, offering to play.
      const holder = pick ? holderOf(pick) : null;
      onControl(holder ? { holder, paused: true } : null);
      return;
    }
    if (!pick) return;
    if (!loaded) {
      if (!loading) load(true);
      return;
    }
    if (!ink) create(pick);
    else if (pick !== (moving ?? current)) moveTo(pick);
  }

  /** Rechosen at most once a frame while the page scrolls or resizes. */
  function chooseSoon() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      choose();
      watchNinety();
    });
  }

  // -------------------------------------------------------------------------------------------
  // Loading and creating the engine
  // -------------------------------------------------------------------------------------------
  function load(now: boolean) {
    if (loading || loaded || destroyed) return;
    loading = true;
    const go = () => {
      idle = 0;
      loadEngine().then(
        (got) => {
          loading = false;
          loaded = got;
          if (live()) choose();
        },
        () => {
          loading = false;
          engine = null;
          if (!destroyed) fail(false);
        },
      );
    };
    if (now) go();
    else if (typeof window.requestIdleCallback === "function") {
      idle = window.requestIdleCallback(go, { timeout: 1500 });
    } else {
      idle = window.setTimeout(go, 200);
    }
  }

  function create(backdrop: HTMLElement) {
    const slot = slotOf(backdrop);
    if (!loaded || !slot) return;
    const made = document.createElement("canvas");
    made.setAttribute("data-ink-canvas", "");
    made.setAttribute("aria-hidden", "true");
    made.setAttribute("data-ink-running", "false");
    slot.append(made);
    canvas = made;

    const stored = readStore();
    const cover = root.hasAttribute("data-intro");
    const created = loaded.createInk(made, {
      pigments: readPigments(),
      quality: isTier(stored) ? stored : cover ? "medium" : "auto",
      maxDpr: window.matchMedia("(pointer: coarse)").matches ? 1.5 : 2,
      interactive: true,
      scrollImpulse: true,
    });
    if (!created.supported) {
      created.destroy();
      made.remove();
      canvas = null;
      fail(true);
      return;
    }
    ink = created;
    created.on("unsupported", () => fail(true));
    created.on("slow", () => fail(true));
    created.on("quality", ({ tier }) => noteTier(tier));
    created.on("rest", () => setRunning(false));
    created.on("end", () => {
      created.stop();
      setRunning(false);
    });
    created.on("lost", onLost);
    created.on("restored", onRestored);
    created.on("ready", ({ tier }) => {
      root.setAttribute("data-ink-ready", "");
      setRunning(running);
      // During the cover the tier is a fixed one; the real choice is made when the cover has left.
      if (!root.hasAttribute("data-intro")) noteTier(tier);
      else made.setAttribute("data-ink-tier", tier);
      if (scene === "intro" && root.hasAttribute("data-intro")) takeOver();
    });
    void document.fonts?.ready.then(() => {
      // Text has its final measure now: the zones are asked again.
      if (ink === created && current && scene) {
        const at = current;
        const name = scene;
        created.setCalmZone(() => zonesOf(at, name));
      }
    });
    activate(backdrop, false);
  }

  function noteTier(tier: Tier) {
    canvas?.setAttribute("data-ink-tier", tier);
    if (!paused) writeStore(tier);
  }

  // -------------------------------------------------------------------------------------------
  // Moving the canvas and running a scene
  // -------------------------------------------------------------------------------------------
  function moveTo(backdrop: HTMLElement) {
    window.clearTimeout(moveTimer);
    moving = null;
    const shown =
      current && current.isConnected
        ? visibleArea(current.getBoundingClientRect(), viewport()) > 0
        : false;
    if (!shown) {
      activate(backdrop, false);
      return;
    }
    // The old slot fades out first; the canvas moves when it is clear.
    moving = backdrop;
    current?.setAttribute("data-ink-state", "idle");
    moveTimer = window.setTimeout(() => {
      moving = null;
      if (!destroyed && backdrop.isConnected) activate(backdrop, false);
    }, 200);
  }

  function activate(backdrop: HTMLElement, holdStill: boolean) {
    const name = sceneOf(backdrop);
    const slot = slotOf(backdrop);
    if (!ink || !canvas || !name || !slot) return;
    window.clearTimeout(windowTimer);
    if (current && current !== backdrop) current.setAttribute("data-ink-state", "idle");
    current = backdrop;
    scene = name;
    fired = false;
    tookOver = false;
    if (canvas.parentElement !== slot) slot.append(canvas);
    ink.stop();
    setRunning(false);
    ink.resize();
    ink.preset(name, { anchors: anchorsOf(backdrop) });
    ink.setCalmZone(() => zonesOf(backdrop, name));
    showControl();

    if (name === "intro" && root.hasAttribute("data-intro")) {
      // The cover's own slot: it stays clear until the ink takes the cover over.
      if (root.hasAttribute("data-ink-ready")) takeOver();
      return;
    }
    backdrop.setAttribute("data-ink-state", "live");
    if (holdStill) return;
    if (paused) {
      void ink.still(name);
      return;
    }
    if (STAGES[name].trigger) {
      // Empty water until the page fires the trigger.
      ink.render();
      watchNinety();
      return;
    }
    run(STAGES[name].runMs);
  }

  /** Starts the loop and opens a window after which the water comes to rest by itself. */
  function run(ms: number) {
    if (!ink) return;
    window.clearTimeout(windowTimer);
    ink.start();
    resting = false;
    setRunning(true);
    if (scene === "intro") return; // it ends by itself
    windowTimer = window.setTimeout(() => {
      resting = true;
      ink?.rest({ duration: REST_SECONDS });
    }, ms);
  }

  /** An input over a stage whose water has come to rest: it moves again, for a shorter while. */
  function wake() {
    if (!ink || !current || !scene || paused || !live()) return;
    if (scene === "intro" || (running && !resting)) return;
    if (current.getAttribute("data-ink-state") !== "live") return;
    if (STAGES[scene].trigger && !fired) return;
    run(Math.min(STAGES[scene].runMs, WAKE_MS));
  }

  // -------------------------------------------------------------------------------------------
  // The cover of a first visit
  // -------------------------------------------------------------------------------------------
  /**
   * The ink joins the cover only if it is ready in time: the cover's own exit must not have got
   * past its first second. Then the state `ink` cancels that exit and starts the longer one, and
   * the drop falls. An engine that is ready later leaves the cover alone.
   */
  function takeOver() {
    if (!ink || !canvas || tookOver || scene !== "intro" || !current) return;
    if (root.getAttribute("data-intro") !== "play") return;
    const cover = current.closest<HTMLElement>("[data-intro-cover]");
    const gl = canvas.getContext("webgl2");
    if (!cover || !gl?.getExtension("KHR_parallel_shader_compile")) return;
    const exit = cover
      .getAnimations()
      .find((animation) => (animation.effect as KeyframeEffect | null)?.target === cover);
    const time = exit ? Number(exit.currentTime ?? Infinity) : Infinity;
    if (!(time <= TAKE_OVER_BY)) return;
    tookOver = true;
    root.setAttribute("data-intro", "ink");
    current.setAttribute("data-ink-state", "live");
    ink.preset("intro");
    run(STAGES.intro.runMs);
  }

  function onIntroChange() {
    const state = root.getAttribute("data-intro");
    if (state === "leave" && ink && scene === "intro") {
      ink.clear();
      ink.stop();
      ink.render();
      setRunning(false);
    }
    if (state !== null) return;
    // The cover has left. The tier is chosen for real now, and the canvas goes to the page.
    if (ink && scene === "intro") {
      ink.stop();
      setRunning(false);
      current?.setAttribute("data-ink-state", "idle");
      current = null;
      scene = null;
      if (!isTier(readStore())) ink.probe();
      noteTier(ink.stats().tier);
    }
    choose();
  }

  // -------------------------------------------------------------------------------------------
  // The ninety: one drop when the tenth block turns
  // -------------------------------------------------------------------------------------------
  function watchNinety() {
    if (!ink || !current || scene !== "ninety" || paused || !live()) return;
    const band = current.closest<HTMLElement>("[data-ninety]") ?? current;
    const progress = coverProgress(band.getBoundingClientRect(), window.innerHeight);
    const timed = root.getAttribute("data-timeline") === "on";
    // Without view timelines the tally fills by itself and its last block fires (see below); the
    // scroll position is the fallback, a little later.
    if (!fired && progress >= (timed ? NINETY_FIRE : 0.6) && progress < 1) fireTenth();
    else if (fired && progress < NINETY_REARM) {
      fired = false;
      window.clearTimeout(windowTimer);
      ink.clear({ duration: 0.6 });
    }
  }

  function fireTenth() {
    if (!ink || fired || scene !== "ninety") return;
    fired = true;
    // The anchors may have moved since the scene was laid out: lay it out where they are now.
    if (!running && current) ink.preset("ninety", { anchors: anchorsOf(current) });
    ink.fire("tenth");
    run(STAGES.ninety.runMs);
  }

  function onAnimationEnd(event: AnimationEvent) {
    if (scene !== "ninety" || fired || paused || !current) return;
    if (root.getAttribute("data-timeline") === "on") return;
    const target = event.target;
    if (!(target instanceof Element) || target.getAttribute("data-ink-anchor") !== "tenth") return;
    if (current.parentElement?.contains(target)) fireTenth();
  }

  // -------------------------------------------------------------------------------------------
  // Failure
  // -------------------------------------------------------------------------------------------
  function dropEngine() {
    window.clearTimeout(windowTimer);
    window.clearTimeout(moveTimer);
    moving = null;
    ink?.destroy();
    ink = null;
    canvas?.remove();
    canvas = null;
    for (const backdrop of backdrops()) backdrop.setAttribute("data-ink-state", "idle");
    current = null;
    scene = null;
    running = false;
    resting = false;
    root.removeAttribute("data-ink-ready");
    root.removeAttribute("data-ink-paused");
    onControl(null);
  }

  /** The ink cannot run here: stills for the rest of the session (when `remember` is set). */
  function fail(remember: boolean) {
    dropEngine();
    if (destroyed) return;
    root.setAttribute("data-ink", "still");
    if (remember) writeStore(INK_OFF);
  }

  function onLost() {
    if (lostOnce) {
      fail(true);
      return;
    }
    lostOnce = true;
    window.clearTimeout(windowTimer);
    setRunning(false);
    current?.setAttribute("data-ink-state", "rest");
  }

  function onRestored() {
    if (!ink || !current || !scene) return;
    current.setAttribute("data-ink-state", "live");
    fired = false;
    if (paused) void ink.still(scene);
    else if (STAGES[scene].trigger) watchNinety();
    else run(STAGES[scene].runMs);
  }

  // -------------------------------------------------------------------------------------------
  // The visitor
  // -------------------------------------------------------------------------------------------
  function toggle() {
    if (destroyed) return;
    if (mode() === "paused") {
      // A session that was paused before this page loaded: back to live ink.
      writeStore(null);
      root.setAttribute("data-ink", "live");
      onControl(null);
      choose();
      return;
    }
    if (!ink || !current || !scene) return;
    if (!paused) {
      paused = true;
      window.clearTimeout(windowTimer);
      ink.stop();
      setRunning(false);
      root.setAttribute("data-ink-paused", "");
      writeStore(INK_PAUSED);
    } else {
      paused = false;
      root.removeAttribute("data-ink-paused");
      writeStore(ink.stats().tier);
      if (STAGES[scene].trigger && !fired) watchNinety();
      else run(STAGES[scene].runMs);
    }
    showControl();
  }

  function inside(backdrop: HTMLElement, x: number, y: number) {
    const rect = backdrop.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function onPointerMove(event: PointerEvent) {
    if (!current || (running && !resting)) return;
    if (inside(current, event.clientX, event.clientY)) wake();
  }

  function onPointerDown(event: PointerEvent) {
    press = { x: event.clientX, y: event.clientY, t: event.timeStamp };
  }

  /** A click on open water leaves a light-blue drop. A scroll on a touch screen never does. */
  function onPointerUp(event: PointerEvent) {
    const from = press;
    press = null;
    if (!ink || !current || !scene || scene === "intro" || paused || !live() || !from) return;
    if (current.getAttribute("data-ink-state") !== "live") return;
    const target = event.target;
    if (!(target instanceof Element) || target.closest(INTERACTIVE)) return;
    if (!inside(current, event.clientX, event.clientY)) return;
    const moved = Math.hypot(event.clientX - from.x, event.clientY - from.y);
    if (event.pointerType !== "mouse" && (moved >= 8 || event.timeStamp - from.t >= 300)) return;
    if (event.timeStamp - lastDrop < 250) return;
    lastDrop = event.timeStamp;
    const rect = current.getBoundingClientRect();
    if (!running || resting) run(Math.min(STAGES[scene].runMs, WAKE_MS));
    ink.drop({
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      ink: "blue",
      amount: 1.6,
      radius: 0.035,
    });
  }

  function onScroll() {
    chooseSoon();
    if (current && (!running || resting)) {
      if (visibleArea(current.getBoundingClientRect(), viewport()) > 0) wake();
    }
  }

  function onPageHide() {
    window.clearTimeout(windowTimer);
    ink?.stop();
    setRunning(false);
  }

  function onPageShow(event: PageTransitionEvent) {
    if (!event.persisted) return;
    choose();
    wake();
  }

  // -------------------------------------------------------------------------------------------
  // Routes
  // -------------------------------------------------------------------------------------------
  function observe() {
    observer?.disconnect();
    if (calm || typeof IntersectionObserver !== "function") return;
    observer = new IntersectionObserver(
      (entries) => {
        if (destroyed) return;
        if (mode() === "live" && !loaded && !loading && entries.some((e) => e.isIntersecting)) {
          const view = viewport();
          const near = backdrops().some(
            (backdrop) => visibleArea(backdrop.getBoundingClientRect(), view) > 0,
          );
          load(near);
        }
        choose();
      },
      { rootMargin: "150% 0px", threshold: [0, 0.15, 0.4, 0.75] },
    );
    for (const backdrop of backdrops()) observer.observe(backdrop);
  }

  function route(path: string) {
    if (destroyed) return;
    calm = isCalmRoute(path);
    if (calm) root.setAttribute("data-ink-route", "calm");
    else root.removeAttribute("data-ink-route");

    // The page under the canvas may be gone: a canvas whose backdrop left the document is homeless.
    if (current && (calm || !current.isConnected)) {
      window.clearTimeout(windowTimer);
      window.clearTimeout(moveTimer);
      moving = null;
      ink?.stop();
      setRunning(false);
      canvas?.remove();
      if (current.isConnected) current.setAttribute("data-ink-state", "idle");
      current = null;
      scene = null;
      onControl(null);
    }
    observe();
    choose();
  }

  const handle: LayerHandle = {
    ink: () => ink,
    canvas: () => canvas,
    scene: () => scene,
    hold: async (name) => {
      // The engine may still be on its way.
      for (let i = 0; i < 100 && !ink && !destroyed; i++) {
        await new Promise((resolve) => window.setTimeout(resolve, 50));
      }
      const backdrop = backdrops().find((candidate) => sceneOf(candidate) === name);
      if (!ink || !backdrop) return null;
      window.clearTimeout(moveTimer);
      moving = null;
      activate(backdrop, true);
      await ink.ready;
      return ink;
    },
    calm: () => {
      if (!current || !scene) return [];
      const ground = STAGES[scene].ground;
      return measured(current).calm.map(({ kind, rect }) => ({
        kind,
        rect,
        cap: capFor(kind, ground),
        dark: ground === "binder",
      }));
    },
  };

  // ---- listeners ----
  const passive = { passive: true } as const;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onMotion = () => {
    if (motion.matches) fail(false);
  };
  const intro = new MutationObserver(onIntroChange);
  intro.observe(root, { attributes: true, attributeFilter: ["data-intro"] });
  window.addEventListener("scroll", onScroll, passive);
  window.addEventListener("resize", chooseSoon, passive);
  window.addEventListener("pointermove", onPointerMove, passive);
  window.addEventListener("pointerdown", onPointerDown, passive);
  window.addEventListener("pointerup", onPointerUp, passive);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  document.addEventListener("animationend", onAnimationEnd);
  motion.addEventListener("change", onMotion);
  cleanups.push(() => {
    intro.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", chooseSoon);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    document.removeEventListener("animationend", onAnimationEnd);
    motion.removeEventListener("change", onMotion);
  });

  if (window.__INK_TEST__) {
    void import("@/lib/ink/test-hook").then((hook) => {
      if (!destroyed) cleanups.push(hook.installInkTest(handle));
    });
  }

  route(window.location.pathname);

  return {
    route,
    toggle,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      if (idle) {
        if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
        window.clearTimeout(idle);
      }
      dropEngine();
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
    },
  };
}
