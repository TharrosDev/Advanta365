import {
  armTimeline,
  makeRandom,
  runTimeline,
  type SceneInk,
  SCENES,
  type Armed,
  type Scene,
  type SceneContext,
} from "../scenes";
import type {
  Ink,
  InkAmount,
  InkDrop,
  InkEvents,
  InkOptions,
  InkStats,
  InkStir,
  InkStream,
  PresetOverrides,
  Rect,
  Rgb,
  SceneName,
  Tier,
  Vec2,
  Vec3,
  Vec4,
  Zone,
  Zones,
} from "../types";
import {
  BUDGET,
  isTier,
  LOOK_DEFAULTS,
  MAX_CALM,
  MAX_SWELL,
  SIM_DEFAULTS,
  TIER_ORDER,
  TIERS,
  type Look,
  type Sim,
} from "./defaults";
import {
  bind as bindTexture,
  buildPrograms,
  deletePrograms,
  draw as drawInto,
  emptyTarget,
  freeTarget,
  makeDouble,
  makeTarget,
  pickFormats,
  type DoubleTarget,
  type Formats,
  type Programs,
  type Target,
} from "./gl";

/**
 * Real-time ink in water. WebGL2, no dependencies.
 *
 * A two-dimensional incompressible fluid (velocity, pressure) carries a four-channel dye field:
 * black ink and blue ink, each on a near and a far depth layer. Ink is heavier than water, so it
 * sinks, rolls up into caps and trails filaments. The picture is shaded per colour channel
 * (absorption that deepens with density, soft self-shadowing, a defocused far layer) and dithered.
 * The canvas is opaque: empty water is exactly the ground pigment.
 *
 * Time is fixed steps of 1/60s and every random number comes from one seeded generator, so a scene
 * stepped by hand (`step(n)`) draws the same picture every time.
 */

export { SCENES } from "../scenes";
export { TIERS } from "./defaults";

const CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  preserveDrawingBuffer: false,
  powerPreference: "default",
  failIfMajorPerformanceCaveat: true,
};

/** Whether this browser can run the engine at all: WebGL2 on a real GPU, with float targets. */
export function isSupported(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2", CONTEXT_ATTRIBUTES);
    if (!gl) return false;
    const ok = !!(
      gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float")
    );
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

const srgbToLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const toLinear = (c: Rgb): Vec3 => [srgbToLinear(c[0]), srgbToLinear(c[1]), srgbToLinear(c[2])];

type Sizes = {
  cssW: number;
  cssH: number;
  canvasW: number;
  canvasH: number;
  simW: number;
  simH: number;
  dyeW: number;
  dyeH: number;
  dpr: number;
};

type Targets = {
  vel: DoubleTarget;
  pressure: DoubleTarget;
  divergence: Target;
  curl: Target;
  dye: DoubleTarget;
};

/** A calm zone in the shader's own space: uv with y up, the feather in canvas heights. */
type CalmZone = {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  feather: number;
  floor: number;
  hold: number;
  fade: number;
  cap: number;
};

type StreamEntry = {
  x: number;
  y: number;
  ink: InkAmount;
  rate: number;
  radius: number;
  velocity: Vec2;
  wobble: number;
  depth: number;
  fiber: number;
  turbulence: number;
  until: number;
  phase: number;
  seed: number;
};

type Swell = {
  x: number;
  y: number;
  radius: number;
  strength: number;
  until: number;
  from: number;
};

type CalmUniforms = {
  u: {
    uCalmCount: WebGLUniformLocation | null;
    uAspect: WebGLUniformLocation | null;
    uCalm: WebGLUniformLocation | null;
    uCalmP: WebGLUniformLocation | null;
    uCalmCap?: WebGLUniformLocation | null;
  };
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Listener = (detail: unknown) => void;
type Booted = { probeMs: number | null };

/** Never throws; `ink.supported` says at once whether it will draw. */
export function createInk(canvas: HTMLCanvasElement, userOptions: InkOptions): Ink {
  const options = {
    preset: null,
    quality: "auto" as const,
    maxDpr: 2,
    autoStart: false,
    autoResize: true,
    autoPause: true,
    interactive: false,
    scrollImpulse: false,
    seed: 365,
    stepsPerSecond: 60,
    adapt: true,
    ...userOptions,
  };

  const listeners = new Map<string, Set<Listener>>();
  const on = <K extends keyof InkEvents>(name: K, fn: (detail: InkEvents[K]) => void) => {
    let set = listeners.get(name);
    if (!set) listeners.set(name, (set = new Set()));
    set.add(fn as Listener);
    return () => off(name, fn);
  };
  const off = <K extends keyof InkEvents>(name: K, fn: (detail: InkEvents[K]) => void) => {
    listeners.get(name)?.delete(fn as Listener);
  };
  const emit = <K extends keyof InkEvents>(name: K, detail?: InkEvents[K]) => {
    listeners.get(name)?.forEach((fn) => {
      try {
        fn(detail);
      } catch (error) {
        // A listener's own fault: it surfaces as an uncaught error, and the water keeps moving.
        queueMicrotask(() => {
          throw error;
        });
      }
    });
  };

  const pigments = options.pigments;
  const dt = 1 / options.stepsPerSecond;
  let gl: WebGL2RenderingContext | null = null;
  let formats: Formats | null = null;
  let programs: Programs | null = null;
  let quad: WebGLBuffer | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let tierName: Tier = isTier(options.quality) ? options.quality : "medium";
  let tier = TIERS[tierName];
  let targets: Targets | null = null;
  let sizes: Sizes = {
    cssW: 0,
    cssH: 0,
    canvasW: 0,
    canvasH: 0,
    simW: 0,
    simH: 0,
    dyeW: 0,
    dyeH: 0,
    dpr: 1,
  };
  let sim: Sim = { ...SIM_DEFAULTS };
  let look: Look = { ...LOOK_DEFAULTS };
  let lit = {
    ground: toLinear(pigments.paper),
    black: toLinear(pigments.black),
    blue: toLinear(pigments.blue),
  };
  let calmZones: CalmZone[] = [];
  let swells: Swell[] = [];
  let streams: StreamEntry[] = [];
  let timeline: Armed[] = [];
  let presetName: string | null = null;
  let scene: Scene | null = null;
  let anchors: Readonly<Record<string, Rect>> = {};
  let random = makeRandom(options.seed);
  /** Simulated seconds (scaled by the water's speed): drives the ambient currents. */
  let simTime = 0;
  /** Real seconds of animation (steps over steps per second): drives durations. */
  let clock = 0;
  /** Seconds the script was held back while the water was coming to rest. */
  let held = 0;
  let stepCount = 0;
  let frameCount = 0;
  let clearing: { start: number; duration: number } | null = null;
  let resting: { elapsed: number; duration: number } | null = null;
  const fired = new Set<string>();
  const queued = new Set<string>();
  let mipsDirty = true;
  let running = false;
  /** `start()` was called; the loop may still be paused by visibility. */
  let wanted = false;
  let visible = true;
  let onScreen = true;
  let raf = 0;
  let lastNow = 0;
  let acc = 0;
  let lost = false;
  let destroyed = false;
  let ready = false;
  let endFired = false;
  /** The last scene asked for: applied when ready, and again after a context restore. */
  let wantedPreset: { name: SceneName; overrides: PresetOverrides } | null = null;
  let wantedCalm: Zones | undefined;
  const pointer = { x: 0.5, y: 0.5, has: false, px: 0, py: 0, t: 0 };
  const drift: [number, number] = [0, 0];
  let lastScrollY = 0;
  const frameTimes = new Float32Array(240);
  let frameIndex = 0;
  let frameFilled = 0;
  let slowFrames = 0;
  const cleanup: (() => void)[] = [];

  const usable = () => !!gl && !lost && !destroyed && !!targets && !!programs;
  const aspectOf = () => sizes.cssW / (sizes.cssH || 1);
  const sceneClock = () => clock - held;

  // ---------------------------------------------------------------------------------------------
  // Sizes and targets
  // ---------------------------------------------------------------------------------------------
  function measure(): Sizes {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(rect.width || canvas.clientWidth || canvas.width || 300));
    const cssH = Math.max(
      1,
      Math.round(rect.height || canvas.clientHeight || canvas.height || 150),
    );
    const aspect = cssW / cssH;
    let dpr = Math.min(
      typeof devicePixelRatio === "number" ? devicePixelRatio : 1,
      options.maxDpr,
      tier.dprCap,
    );
    if (cssW * cssH * dpr * dpr > tier.canvasPixels)
      dpr = Math.sqrt(tier.canvasPixels / (cssW * cssH));
    const canvasW = Math.max(2, Math.round(cssW * dpr));
    const canvasH = Math.max(2, Math.round(cssH * dpr));
    const simH = Math.max(24, Math.round(Math.sqrt(tier.simCells / aspect)));
    const simW = Math.max(24, Math.round(simH * aspect));
    const dyeBudget = Math.min(
      tier.dyePixels,
      cssW * cssH * tier.dyeScale * tier.dyeScale * Math.max(1, Math.min(dpr, 2)) ** 2,
    );
    const dyeH = Math.max(64, Math.round(Math.sqrt(dyeBudget / aspect)));
    const dyeW = Math.max(64, Math.round(dyeH * aspect));
    return { cssW, cssH, canvasW, canvasH, simW, simH, dyeW, dyeH, dpr };
  }

  function copyInto(g: WebGL2RenderingContext, p: Programs, source: Target, dest: Target) {
    g.useProgram(p.copy.program);
    g.uniform1i(p.copy.u.uTex, bindTexture(g, 0, source));
    g.uniform1f(p.copy.u.uScale, 1);
    drawInto(g, dest);
  }

  function allocate(next: Sizes) {
    if (!gl || !formats || !programs) return;
    const old = targets;
    const fresh: Targets = {
      vel: makeDouble(gl, next.simW, next.simH, formats.rg, false),
      pressure: makeDouble(gl, next.simW, next.simH, formats.r, false),
      divergence: makeTarget(gl, next.simW, next.simH, formats.r, false),
      curl: makeTarget(gl, next.simW, next.simH, formats.r, false),
      dye: makeDouble(gl, next.dyeW, next.dyeH, formats.rgba, true),
    };
    if (old) {
      // Keep the picture: resample the old fields into the new ones.
      copyInto(gl, programs, old.vel.read, fresh.vel.read);
      copyInto(gl, programs, old.pressure.read, fresh.pressure.read);
      copyInto(gl, programs, old.dye.read, fresh.dye.read);
      for (const target of Object.values(old)) freeTarget(gl, target);
    }
    targets = fresh;
    mipsDirty = true;
  }

  function resize(force = false) {
    if (!gl || lost || destroyed) return;
    if (!programs) {
      sizes = measure();
      return;
    }
    const next = measure();
    const canvasChanged = next.canvasW !== canvas.width || next.canvasH !== canvas.height;
    const fieldsChanged =
      force ||
      !targets ||
      next.simW !== sizes.simW ||
      next.simH !== sizes.simH ||
      next.dyeW !== sizes.dyeW ||
      next.dyeH !== sizes.dyeH;
    if (canvasChanged) {
      canvas.width = next.canvasW;
      canvas.height = next.canvasH;
    }
    const cssChanged = next.cssW !== sizes.cssW || next.cssH !== sizes.cssH;
    const turned = next.cssW / next.cssH < 0.8 !== sizes.cssW / (sizes.cssH || 1) < 0.8;
    sizes = next;
    if (fieldsChanged) allocate(next);
    if (cssChanged && typeof wantedCalm === "function") setCalmZone(wantedCalm);
    // A scene is laid out for a wide or a tall canvas: when that flips (a phone is turned), lay it
    // out again.
    if (turned && ready && wantedPreset && scene) preset(wantedPreset.name, wantedPreset.overrides);
    // Changing the size of a canvas empties it, so it is drawn again in the same task: also while
    // the loop is stopped.
    if ((canvasChanged || fieldsChanged) && ready) render();
  }

  // ---------------------------------------------------------------------------------------------
  // Adding things to the water
  // ---------------------------------------------------------------------------------------------
  function inkAmounts(ink: InkAmount | undefined, amount: number): Vec2 {
    let k = 0;
    let b = 0;
    if (ink === "blue") b = 1;
    else if (ink && typeof ink === "object") {
      k = ink.black ?? 0;
      b = ink.blue ?? 0;
    } else k = 1; // "black" and, on a dark ground, "pale"
    return [k * amount, b * amount];
  }

  function scissorFor(target: Target, x: number, yGl: number, radius: number, reach: number) {
    if (!gl) return false;
    const rx = (radius * reach) / aspectOf();
    const ry = radius * reach;
    const x0 = Math.max(0, Math.floor((x - rx) * target.w));
    const x1 = Math.min(target.w, Math.ceil((x + rx) * target.w));
    const y0 = Math.max(0, Math.floor((yGl - ry) * target.h));
    const y1 = Math.min(target.h, Math.ceil((yGl + ry) * target.h));
    if (x1 <= x0 || y1 <= y0) return false;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x0, y0, x1 - x0, y1 - y0);
    return true;
  }

  function addVelocity(
    x: number,
    yGl: number,
    radius: number,
    fx: number,
    fyGl: number,
    spin = 0,
    turbulence = 0,
    seed = 1,
  ) {
    if (!gl || !programs || !targets) return;
    const target = targets.vel.read;
    if (!scissorFor(target, x, yGl, radius, 3.2)) return;
    const p = programs.splatVel;
    gl.useProgram(p.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.uniform2f(p.u.uPoint, x, yGl);
    gl.uniform1f(p.u.uRadius, radius);
    gl.uniform2f(p.u.uForce, fx, fyGl);
    gl.uniform1f(p.u.uSpin, spin);
    gl.uniform1f(p.u.uTurb, turbulence);
    gl.uniform1f(p.u.uSeed, seed);
    gl.uniform1f(p.u.uAspect, aspectOf());
    drawInto(gl, target);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
  }

  function addDye(
    x: number,
    yGl: number,
    radius: number,
    amounts: Vec4,
    seed: number,
    grain: number,
    fiber: number,
    stretch: Vec2,
  ) {
    if (!gl || !programs || !targets) return;
    const target = targets.dye.read;
    const k = Math.hypot(stretch[0], stretch[1]);
    if (!scissorFor(target, x, yGl, radius * (1 + k), 3.6)) return;
    const p = programs.splatDye;
    gl.useProgram(p.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.uniform2f(p.u.uPoint, x, yGl);
    gl.uniform1f(p.u.uRadius, radius);
    gl.uniform4f(p.u.uAmount, amounts[0], amounts[1], amounts[2], amounts[3]);
    gl.uniform1f(p.u.uSeed, seed);
    gl.uniform1f(p.u.uGrain, grain);
    gl.uniform1f(p.u.uFiber, fiber);
    gl.uniform2f(p.u.uStretch, stretch[0], stretch[1]);
    gl.uniform1f(p.u.uAspect, aspectOf());
    drawInto(gl, target);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
    mipsDirty = true;
  }

  /** One drop of ink. */
  function drop(d: InkDrop = {}): Ink {
    if (!usable()) return api;
    const x = d.x ?? 0.5;
    const yGl = 1 - (d.y ?? 0.2);
    const radius = d.radius ?? 0.05;
    const [k, b] = inkAmounts(d.ink, d.amount ?? 2);
    const depth = d.depth ?? 0.5; // the share that goes to the far layer
    const v = d.velocity ?? [0, 0];
    const speed = Math.hypot(v[0], v[1]);
    const seed = Math.floor(random() * 60000) + 1;
    const pull = Math.min(1.2, speed * 0.7);
    const stretch: Vec2 = speed > 0.01 ? [(v[0] / speed) * pull, (-v[1] / speed) * pull] : [0, 0];
    addDye(x, yGl, radius, [k, b, k * depth, b * depth], seed, 2.6, d.fiber ?? 0.7, stretch);
    const turbulence = d.turbulence ?? 0.3 * speed;
    if (speed > 0 || d.spin || turbulence) {
      addVelocity(
        x,
        yGl,
        radius * (d.push ?? 1.25),
        v[0],
        -v[1],
        d.spin ?? 0,
        turbulence,
        seed + 7,
      );
    }
    if (d.swell) {
      swells.push({
        x,
        y: yGl,
        radius: radius * 1.2,
        strength: d.swell,
        until: clock + (d.swellTime ?? 0.5),
        from: clock,
      });
    }
    return api;
  }

  /** Stir the water: a push at a point. dx, dy in canvas heights per second. */
  function stir(s: InkStir = {}): Ink {
    if (!usable()) return api;
    addVelocity(
      s.x ?? 0.5,
      1 - (s.y ?? 0.5),
      s.radius ?? 0.06,
      s.dx ?? 0,
      -(s.dy ?? 0),
      s.spin ?? 0,
    );
    return api;
  }

  /** A continuous source of ink. Returns a handle with stop(). */
  function stream(s: InkStream = {}): { stop(): void } {
    const velocity = s.velocity ?? [0, 0.4];
    const entry: StreamEntry = {
      x: s.x ?? 0.5,
      y: s.y ?? 0,
      ink: s.ink ?? "black",
      rate: s.rate ?? 3, // density per second at the centre
      radius: s.radius ?? 0.03,
      velocity,
      wobble: s.wobble ?? 0.1,
      depth: 0.5,
      fiber: s.fiber ?? 0.75,
      turbulence: s.turbulence ?? 0.3 * Math.hypot(velocity[0], velocity[1]),
      until: s.duration ? clock + s.duration : Infinity,
      phase: random() * 100,
      seed: Math.floor(random() * 60000) + 1,
    };
    if (usable()) streams.push(entry);
    return {
      stop: () => {
        entry.until = -1;
      },
    };
  }

  /** A push on all the ink at once (a scroll, a shake). dx, dy in canvas heights per second. */
  function impulse(i: { dx?: number; dy?: number } = {}): Ink {
    if (!gl || !programs || !targets || !usable()) return api;
    const p = programs.impulse;
    gl.useProgram(p.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    if (mipsDirty) refreshMips();
    gl.uniform1i(p.u.uDye, bindTexture(gl, 0, targets.dye.read));
    gl.uniform2f(p.u.uForce, i.dx ?? 0, -(i.dy ?? 0));
    gl.uniform1f(p.u.uSeed, Math.floor(random() * 60000) + 1);
    gl.uniform1f(p.u.uAspect, aspectOf());
    drawInto(gl, targets.vel.read);
    gl.disable(gl.BLEND);
    return api;
  }

  /**
   * Keep rectangles calm so text stays readable; null removes them. See `Zone` for the units. A
   * function that returns the zones is called again after every resize.
   */
  function setCalmZone(zones: Zones): Ink {
    wantedCalm = zones;
    const value = typeof zones === "function" ? zones() : zones;
    const list: readonly Zone[] = value ? ("x" in value ? [value] : value) : [];
    const w = sizes.cssW || 1;
    const h = sizes.cssH || 1;
    calmZones = list.slice(0, MAX_CALM).map((r) => {
      const fraction = r.unit === "fraction";
      const x = fraction ? r.x : r.x / w;
      const y = fraction ? r.y : r.y / h;
      const rw = fraction ? r.width : r.width / w;
      const rh = fraction ? r.height : r.height / h;
      const feather = r.feather === undefined ? 90 / h : fraction ? r.feather : r.feather / h;
      return {
        x0: x,
        x1: x + rw,
        y0: 1 - (y + rh),
        y1: 1 - y,
        feather: Math.max(1e-4, feather),
        floor: r.floor ?? 0.1,
        hold: r.hold ?? 1,
        fade: r.fade ?? 1,
        cap: r.cap ?? -1,
      };
    });
    if (ready && !running) render();
    return api;
  }

  function setCalmUniforms(p: CalmUniforms) {
    if (!gl) return;
    const n = Math.min(calmZones.length, MAX_CALM);
    gl.uniform1i(p.u.uCalmCount, n);
    gl.uniform1f(p.u.uAspect, aspectOf());
    if (!n) return;
    const rects = new Float32Array(MAX_CALM * 4);
    const params = new Float32Array(MAX_CALM * 4);
    const caps = new Float32Array(MAX_CALM).fill(-1);
    calmZones.slice(0, n).forEach((z, i) => {
      rects.set([z.x0, z.y0, z.x1, z.y1], i * 4);
      params.set([z.feather, z.floor, z.hold, z.fade], i * 4);
      caps[i] = z.cap;
    });
    gl.uniform4fv(p.u.uCalm, rects);
    gl.uniform4fv(p.u.uCalmP, params);
    if (p.u.uCalmCap !== undefined) gl.uniform1fv(p.u.uCalmCap, caps);
  }

  /**
   * Thin the ink away over a duration (seconds), then leave a clean field. The scene's script ends
   * with it, unless the script itself asked (`keepScript`): a scene may clear its water and go on.
   */
  function clear(c: { duration?: number } = {}, keepScript = false): Ink {
    if (!usable()) return api;
    const duration = c.duration ?? 0;
    streams = [];
    if (!keepScript) timeline = [];
    fired.clear();
    queued.clear();
    if (duration <= 0) {
      drain();
      emit("cleared");
    } else {
      clearing = { start: clock, duration };
    }
    return api;
  }

  /** Empties every field at once. */
  function drain() {
    if (!gl || !targets) return;
    const { dye, vel, pressure } = targets;
    for (const t of [dye.read, dye.write, vel.read, vel.write, pressure.read, pressure.write]) {
      emptyTarget(gl, t);
    }
    mipsDirty = true;
    clearing = null;
  }

  /** Runs a named trigger of the scene: once, until the water is next cleared. */
  function fire(name: string): Ink {
    if (!usable() || !scene) return api;
    const entries = scene.triggers?.[name];
    if (!entries || fired.has(name)) return api;
    if (clearing) {
      // The water is still draining: the trigger waits for clean water.
      queued.add(name);
      return api;
    }
    fired.add(name);
    timeline.push(...armTimeline(entries, sceneClock()));
    return api;
  }

  // ---------------------------------------------------------------------------------------------
  // Scenes
  // ---------------------------------------------------------------------------------------------
  function context(): SceneContext {
    const aspect = aspectOf();
    return { aspect, portrait: aspect < 0.8, width: sizes.cssW, height: sizes.cssH, anchors };
  }

  function applyLook() {
    lit = {
      ground: toLinear(pigments[look.ground]),
      black: toLinear(pigments[look.blackPigment]),
      blue: toLinear(pigments[look.bluePigment]),
    };
  }

  /** Load a scene: clears the water, sets the physics and the look, arms the script. */
  function preset(name: SceneName, overrides: PresetOverrides = {}): Ink {
    const make = Object.hasOwn(SCENES, name) ? SCENES[name] : null;
    if (!make) return api;
    wantedPreset = { name, overrides };
    presetName = name;
    if (!usable()) return api;
    random = makeRandom(options.seed);
    anchors = overrides.anchors ?? {};
    scene = make(context());
    sim = { ...SIM_DEFAULTS, ...scene.sim, ...(overrides.sim as Partial<Sim> | undefined) };
    look = { ...LOOK_DEFAULTS, ...scene.look, ...(overrides.look as Partial<Look> | undefined) };
    applyLook();
    drain();
    streams = [];
    swells = [];
    fired.clear();
    queued.clear();
    resting = null;
    simTime = 0;
    clock = 0;
    held = 0;
    stepCount = 0;
    endFired = false;
    timeline = armTimeline(scene.timeline);
    if (ready && !running) render();
    return api;
  }

  /** Change physics or look values while it runs. */
  function set(values: { sim?: object; look?: object } = {}): Ink {
    if (values.sim) sim = { ...sim, ...(values.sim as Partial<Sim>) };
    if (values.look) {
      look = { ...look, ...(values.look as Partial<Look>) };
      applyLook();
    }
    if (ready && !running && usable()) render();
    return api;
  }

  function runStreams(stepDt: number, tickDt: number) {
    if (!streams.length) return;
    streams = streams.filter((s) => s.until >= clock);
    for (const s of streams) {
      const sway =
        Math.sin(simTime * 1.7 + s.phase) * 0.6 + Math.sin(simTime * 4.3 + s.phase * 1.3) * 0.4;
      const x = s.x + (sway * s.wobble * s.radius) / aspectOf();
      const yGl = 1 - s.y;
      const [k, b] = inkAmounts(s.ink, s.rate * tickDt);
      const v = s.velocity;
      addDye(x, yGl, s.radius, [k, b, k * s.depth, b * s.depth], s.seed, 2.6, s.fiber, [0, 0]);
      const gain = Math.min(1, stepDt * 3.5);
      addVelocity(
        x,
        yGl,
        s.radius * 1.3,
        (v[0] + sway * s.wobble * 0.3) * gain,
        -v[1] * gain,
        0,
        s.turbulence * gain,
        s.seed + Math.floor(simTime * 5),
      );
    }
  }

  // ---------------------------------------------------------------------------------------------
  // One simulation step
  // ---------------------------------------------------------------------------------------------
  function refreshMips() {
    if (!gl || !targets) return;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targets.dye.read.tex);
    gl.generateMipmap(gl.TEXTURE_2D);
    mipsDirty = false;
  }

  function simStep() {
    const sub = Math.max(1, Math.round(sim.substeps));
    for (let i = 0; i < sub; i++) physicsStep(1 / sub);
    stepCount++;
    clock = stepCount * dt; // no drift
    if (scene?.duration && !endFired && clock >= scene.duration) {
      endFired = true;
      emit("end", { preset: presetName ?? "" });
    }
    if (resting) {
      resting.elapsed += dt;
      if (resting.elapsed >= resting.duration) {
        resting = null;
        wanted = false;
        updateRunning();
        emit("rest");
      }
    }
  }

  function physicsStep(share: number) {
    if (!gl || !programs || !targets) return;
    const tickDt = dt * share; // real seconds covered by this pass
    // While the water comes to rest, time itself slows to a stop and the script waits.
    let ease = 1;
    if (resting) {
      const t = Math.min(1, resting.elapsed / resting.duration);
      ease = 1 - t * t * (3 - 2 * t);
      held += tickDt;
    }
    const stepDt = dt * sim.speed * ease;
    const aspect = aspectOf();
    const { vel, dye, pressure, divergence, curl } = targets;
    const texel: Vec2 = [1 / vel.w, 1 / vel.h];
    const walls = sim.walls;

    if (!resting) runTimeline(timeline, sceneClock(), script, random);
    runStreams(stepDt, tickDt);
    if (mipsDirty) refreshMips();

    // While clearing, the ink diffuses into mist and fades.
    let mist = 0;
    let fade = 1;
    if (clearing) {
      const t = (clock - clearing.start) / clearing.duration;
      if (t >= 1) {
        drain();
        emit("cleared");
        const waiting = [...queued];
        queued.clear();
        waiting.forEach(fire);
      } else {
        const k = t * t * (3 - 2 * t);
        mist = 0.1 + 0.3 * k;
        fade = Math.exp((-tickDt * (1.2 + 9.5 * k)) / clearing.duration);
      }
    }

    const c = programs.curl;
    gl.useProgram(c.program);
    gl.uniform1i(c.u.uVel, bindTexture(gl, 0, vel.read));
    gl.uniform2f(c.u.uTexel, texel[0], texel[1]);
    drawInto(gl, curl);

    const f = programs.force;
    gl.useProgram(f.program);
    gl.uniform1i(f.u.uVel, bindTexture(gl, 0, vel.read));
    gl.uniform1i(f.u.uCurl, bindTexture(gl, 1, curl));
    gl.uniform1i(f.u.uDye, bindTexture(gl, 2, dye.read));
    gl.uniform2f(f.u.uTexel, texel[0], texel[1]);
    gl.uniform1f(f.u.uDt, stepDt);
    gl.uniform1f(f.u.uConfine, sim.confinement);
    gl.uniform1f(
      f.u.uDyeLod,
      Math.max(0, Math.min(dye.read.levels - 1, Math.log2(dye.h / vel.h) + sim.massBlur)),
    );
    gl.uniform3f(f.u.uGravity, sim.gravity[0], sim.gravity[1], sim.farWeight);
    gl.uniform4f(
      f.u.uAmbient,
      sim.ambient,
      sim.ambientScale,
      simTime * sim.ambientSpeed * 4,
      options.seed % 1000,
    );
    gl.uniform1f(f.u.uCalmDrag, sim.calmDrag);
    setCalmUniforms(f);
    drawInto(gl, vel.write);
    vel.swap();

    const a = programs.advectVel;
    gl.useProgram(a.program);
    gl.uniform1i(a.u.uVel, bindTexture(gl, 0, vel.read));
    gl.uniform2f(a.u.uScale, 1 / aspect, 1);
    gl.uniform1f(a.u.uDt, stepDt);
    gl.uniform1f(a.u.uDamp, Math.exp(-stepDt * sim.velocityDamping));
    gl.uniform1f(a.u.uVisc, sim.viscosity);
    gl.uniform2f(a.u.uTexel, texel[0], texel[1]);
    drawInto(gl, vel.write);
    vel.swap();

    const d = programs.divergence;
    gl.useProgram(d.program);
    gl.uniform1i(d.u.uVel, bindTexture(gl, 0, vel.read));
    gl.uniform2f(d.u.uTexel, texel[0], texel[1]);
    gl.uniform4f(d.u.uWalls, walls[0], walls[1], walls[2], walls[3]);
    gl.uniform1f(d.u.uAspect, aspect);
    swells = swells.filter((s) => s.until > clock);
    const sw = new Float32Array(MAX_SWELL * 4);
    const count = Math.min(swells.length, MAX_SWELL);
    swells.slice(0, count).forEach((s, i) => {
      const life = Math.min(1, Math.max(0, (clock - s.from) / (s.until - s.from)));
      sw.set([s.x, s.y, s.radius, s.strength * Math.sin(Math.PI * life)], i * 4);
    });
    gl.uniform1i(d.u.uSwellCount, count);
    gl.uniform4fv(d.u.uSwell, sw);
    drawInto(gl, divergence);

    const j = programs.jacobi;
    gl.useProgram(j.program);
    gl.uniform1i(j.u.uDiv, bindTexture(gl, 1, divergence));
    gl.uniform2f(j.u.uTexel, texel[0], texel[1]);
    gl.uniform4f(j.u.uWalls, walls[0], walls[1], walls[2], walls[3]);
    for (let i = 0; i < tier.pressure; i++) {
      gl.uniform1i(j.u.uP, bindTexture(gl, 0, pressure.read));
      drawInto(gl, pressure.write);
      pressure.swap();
    }

    const pr = programs.project;
    gl.useProgram(pr.program);
    gl.uniform1i(pr.u.uP, bindTexture(gl, 0, pressure.read));
    gl.uniform1i(pr.u.uVel, bindTexture(gl, 1, vel.read));
    gl.uniform2f(pr.u.uTexel, texel[0], texel[1]);
    gl.uniform4f(pr.u.uWalls, walls[0], walls[1], walls[2], walls[3]);
    drawInto(gl, vel.write);
    vel.swap();

    const ad = programs.advectDye;
    gl.useProgram(ad.program);
    gl.uniform1i(ad.u.uVel, bindTexture(gl, 0, vel.read));
    gl.uniform1i(ad.u.uDye, bindTexture(gl, 1, dye.read));
    gl.uniform2f(ad.u.uSize, dye.w, dye.h);
    gl.uniform2f(ad.u.uScale, 1 / aspect, 1);
    gl.uniform1f(ad.u.uDt, stepDt);
    const dd = sim.dyeDecay;
    gl.uniform4f(
      ad.u.uDecay,
      Math.exp(-stepDt * dd[0]) * fade,
      Math.exp(-stepDt * dd[1]) * fade,
      Math.exp(-stepDt * dd[2]) * fade,
      Math.exp(-stepDt * dd[3]) * fade,
    );
    gl.uniform1f(ad.u.uFloor, sim.dyeFloor * stepDt * (clearing ? 6 : 1));
    gl.uniform1f(ad.u.uSharp, sim.sharpness);
    gl.uniform1f(ad.u.uCubic, tier.cubic ? 1 : 0);
    gl.uniform1f(ad.u.uCalmDecay, sim.calmDecay);
    gl.uniform1f(ad.u.uMist, mist);
    gl.uniform1f(ad.u.uFarLag, sim.farLag);
    gl.uniform1f(ad.u.uFarSharp, tier.farSharp && sim.farSharp ? 1 : 0);
    gl.uniform4f(ad.u.uWalls, walls[0], walls[1], walls[2], walls[3]);
    setCalmUniforms(ad);
    drawInto(gl, dye.write);
    dye.swap();
    refreshMips();

    simTime += stepDt;
    clock += tickDt;
  }

  // ---------------------------------------------------------------------------------------------
  // The picture
  // ---------------------------------------------------------------------------------------------
  function render() {
    if (!gl || !programs || !targets || !usable()) return;
    if (mipsDirty) refreshMips();
    const p = programs.composite;
    const dye = targets.dye.read;
    const aspect = aspectOf();
    gl.useProgram(p.program);
    gl.uniform1i(p.u.uDye, bindTexture(gl, 0, dye));
    gl.uniform2f(p.u.uDyeSize, dye.w, dye.h);
    gl.uniform1f(p.u.uFrame, running ? frameCount % 4096 : 0);
    gl.uniform3fv(p.u.uGround, lit.ground);
    gl.uniform3fv(p.u.uBlackTint, look.blackTint);
    gl.uniform3fv(p.u.uBlackColor, lit.black);
    gl.uniform1f(p.u.uBlackOpacity, look.blackOpacity);
    gl.uniform3fv(p.u.uBlueTint, look.blueTint);
    gl.uniform3fv(p.u.uBlueColor, lit.blue);
    gl.uniform1f(p.u.uBlueOpacity, look.blueOpacity);
    gl.uniform3fv(p.u.uBlueDeep, look.blueDeep);
    gl.uniform1f(p.u.uBlueDeepRate, look.blueDeepRate);
    gl.uniform1f(p.u.uBlueShade, look.blueShade);
    gl.uniform3fv(p.u.uBlueShadeTint, look.blueShadeTint);
    gl.uniform1f(p.u.uDensity, look.density);
    gl.uniform1f(p.u.uGamma, look.gamma);
    gl.uniform2f(p.u.uInkGain, look.blackGain, look.blueGain);
    gl.uniform4f(p.u.uFar, tier.far ? look.farDensity : 0, look.farLod, look.farScale, 0);
    gl.uniform2f(p.u.uFarShift, drift[0] * 0.012, drift[1] * 0.012);
    const len = Math.hypot(look.light[0], look.light[1]) || 1;
    const stepLen = look.shadowReach / tier.shadowSteps;
    gl.uniform2f(
      p.u.uLightStep,
      ((look.light[0] / len) * stepLen) / aspect,
      (look.light[1] / len) * stepLen,
    );
    gl.uniform4f(
      p.u.uShade,
      look.shadowStrength,
      look.ambientLight,
      tier.cubic ? look.limb : 0,
      look.groundShadow,
    );
    gl.uniform1f(p.u.uShadowDepth, look.shadowDepth);
    gl.uniform1f(p.u.uGrain, look.grain);
    gl.uniform1f(p.u.uUpsample, look.smooth ? 1 : 0);
    gl.uniform1f(p.u.uDark, look.dark ? 1 : 0);
    gl.uniform1i(p.u.uShadowSteps, tier.shadowSteps);
    setCalmUniforms(p);
    drawInto(gl, null);
    frameCount++;
  }

  // ---------------------------------------------------------------------------------------------
  // The loop
  // ---------------------------------------------------------------------------------------------
  function frame(now: number) {
    raf = 0;
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const stepMs = 1000 / options.stepsPerSecond;
    const elapsed = lastNow ? Math.min(100, now - lastNow) : stepMs;
    lastNow = now;
    frameTimes[frameIndex] = elapsed;
    frameIndex = (frameIndex + 1) % frameTimes.length;
    frameFilled = Math.min(frameTimes.length, frameFilled + 1);
    acc += elapsed;
    let n = Math.floor((acc + stepMs * 0.25) / stepMs);
    if (n > 2) {
      n = 2;
      acc = 2 * stepMs;
    }
    if (n <= 0) return;
    acc -= n * stepMs;
    updatePointerEase();
    for (let i = 0; i < n && running; i++) simStep();
    render();
    if (options.adapt) watch(elapsed);
  }

  /** Frames that stay slow cost a tier; at the lowest tier they are reported as "slow". */
  function watch(elapsed: number) {
    slowFrames = elapsed > 24 ? slowFrames + 1 : Math.max(0, slowFrames - 2);
    if (slowFrames <= 75) return;
    slowFrames = 0;
    const i = TIER_ORDER.indexOf(tierName);
    const lower = TIER_ORDER[i - 1];
    if (lower) setQuality(lower);
    else emit("slow");
  }

  function updateRunning() {
    const should = wanted && visible && onScreen && !lost && !destroyed && ready;
    if (should && !running) {
      running = true;
      lastNow = 0;
      acc = 0;
      slowFrames = 0;
      raf = requestAnimationFrame(frame);
    } else if (!should && running) {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function start(): Ink {
    wanted = true;
    resting = null;
    updateRunning();
    return api;
  }

  function stop(): Ink {
    wanted = false;
    resting = null;
    updateRunning();
    return api;
  }

  /** Ease the water to a standstill over a duration (seconds), then stop the loop. */
  function rest(o: { duration?: number } = {}): Ink {
    if (!usable() || !running) {
      stop();
      if (usable()) emit("rest");
      return api;
    }
    resting = { elapsed: 0, duration: Math.max(dt, o.duration ?? 2.5) };
    return api;
  }

  /** Advance n fixed steps and draw once. Deterministic: for tests and still frames. */
  function step(n = 1): Ink {
    if (!usable()) return api;
    for (let i = 0; i < n; i++) simStep();
    render();
    return api;
  }

  /**
   * Draw one settled frame of a scene and stop. Runs the steps in small batches so the page stays
   * responsive; a scene that waits for a trigger is fired first. Resolves when the frame is drawn.
   */
  async function still(name?: SceneName, steps?: number): Promise<Ink> {
    stop();
    await api.ready;
    const wantedName = name ?? wantedPreset?.name;
    if (!usable() || !wantedName) return api;
    preset(wantedName, wantedPreset?.name === wantedName ? wantedPreset.overrides : {});
    for (const trigger of Object.keys(scene?.triggers ?? {})) fire(trigger);
    const total = steps ?? scene?.still ?? 300;
    return new Promise((resolve) => {
      let done = 0;
      const batch = () => {
        if (!usable()) return resolve(api);
        const n = Math.min(24, total - done);
        for (let i = 0; i < n; i++) simStep();
        done += n;
        if (done < total) setTimeout(batch, 0);
        else {
          render();
          resolve(api);
        }
      };
      batch();
    });
  }

  // ---------------------------------------------------------------------------------------------
  // Quality
  // ---------------------------------------------------------------------------------------------
  /** Switch tier by hand. The picture is carried over into the new buffers. */
  function setQuality(name: Tier): Ink {
    if (!isTier(name) || !usable()) return api;
    const changed = name !== tierName;
    tierName = name;
    tier = TIERS[name];
    if (changed) {
      resize(true);
      emit("quality", { tier: tierName });
    }
    return api;
  }

  const pixel = new Uint8Array(4);
  function waitForGpu() {
    if (!gl) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  }

  /** How long one step and one draw take on this GPU, in milliseconds (mean). Blocks until done. */
  function measureCost(frames = 10, warm = 4): number {
    for (let i = 0; i < warm; i++) {
      simStep();
      render();
    }
    waitForGpu();
    const t0 = performance.now();
    for (let i = 0; i < frames; i++) {
      simStep();
      render();
    }
    waitForGpu();
    return (performance.now() - t0) / frames;
  }

  /**
   * The same for the probe: frame by frame, the median (first-use hiccups do not count), and it
   * gives up early on a GPU that is far too slow for the tier.
   */
  function probeCost(): number {
    for (let i = 0; i < 4; i++) {
      simStep();
      render();
    }
    waitForGpu();
    const times: number[] = [];
    let total = 0;
    while (times.length < 7 && total < 90) {
      const t = performance.now();
      simStep();
      render();
      waitForGpu();
      const took = performance.now() - t;
      times.push(took);
      total += took;
    }
    times.sort((x, y) => x - y);
    return times[Math.floor(times.length / 2)] ?? 0;
  }

  /** The frame-time probe: a few real frames at a tier, a step down while they cost too much. */
  function runProbe(): number {
    const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    let i = coarse ? 1 : 2; // phones and tablets start one tier lower
    const tryTier = (index: number) => {
      tierName = TIER_ORDER[index] ?? "low";
      tier = TIERS[tierName];
      resize(true);
      drain();
      seedProbe();
      return probeCost();
    };
    let cost = tryTier(i);
    if (cost > BUDGET[tierName]) {
      while (i > 0 && cost > BUDGET[tierName]) cost = tryTier(--i);
    } else if (i < 2 && cost < BUDGET[tierName] * 0.45) {
      const up = tryTier(i + 1);
      if (up <= BUDGET[tierName]) {
        i += 1;
        cost = up;
      } else {
        cost = tryTier(i);
      }
    }
    drain();
    simTime = 0;
    clock = 0;
    held = 0;
    stepCount = 0;
    return cost;
  }

  function seedProbe() {
    // Some ink in the water, so the probe pays for real work.
    sim = { ...SIM_DEFAULTS };
    look = { ...LOOK_DEFAULTS };
    applyLook();
    random = makeRandom(options.seed);
    drop({ x: 0.5, y: 0.4, amount: 2, radius: 0.12, velocity: [0, 0.3] });
    drop({ x: 0.3, y: 0.6, ink: "blue", amount: 2, radius: 0.12, velocity: [0.2, 0] });
  }

  /** Choose the tier by measuring. Clears the water; the scene, if any, is loaded afresh. */
  function probe(): number | null {
    if (!usable()) return null;
    const before = tierName;
    const cost = runProbe();
    if (wantedPreset) preset(wantedPreset.name, wantedPreset.overrides);
    else render();
    if (tierName !== before) emit("quality", { tier: tierName });
    return cost;
  }

  // ---------------------------------------------------------------------------------------------
  // Pointer and scroll
  // ---------------------------------------------------------------------------------------------
  function onPointerMove(event: Event) {
    if (!running || !(event instanceof MouseEvent)) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const now = performance.now();
    if (pointer.has && now - pointer.t < 120 && x > -0.1 && x < 1.1 && y > -0.1 && y < 1.1) {
      const dx = ((x - pointer.px) * rect.width) / rect.height;
      const dy = y - pointer.py;
      const speed = Math.hypot(dx, dy);
      if (speed > 0.0005) {
        const k = Math.min(1, 0.012 / speed) * 5.5;
        stir({ x, y, dx: dx * k, dy: dy * k, radius: 0.045 });
      }
    }
    pointer.px = x;
    pointer.py = y;
    pointer.x = Math.min(1, Math.max(0, x));
    pointer.y = Math.min(1, Math.max(0, y));
    pointer.t = now;
    pointer.has = true;
  }

  /** The far layer leans a little toward the pointer. */
  function updatePointerEase() {
    const tx = pointer.has ? pointer.x - 0.5 : 0;
    const ty = pointer.has ? 0.5 - pointer.y : 0;
    drift[0] += (tx - drift[0]) * 0.04;
    drift[1] += (ty - drift[1]) * 0.04;
  }

  function onScroll() {
    const y = window.scrollY;
    const delta = y - lastScrollY;
    lastScrollY = y;
    if (!running || !delta) return;
    const push = Math.max(-0.5, Math.min(0.5, (delta / (sizes.cssH || 1)) * 2.2));
    impulse({ dx: 0, dy: -push });
  }

  // ---------------------------------------------------------------------------------------------
  // Life cycle
  // ---------------------------------------------------------------------------------------------
  /** Everything that needs the GPU: programs, buffers, the probe. */
  async function boot(): Promise<Booted | null> {
    if (!gl) return null;
    const g = gl;
    const built = await buildPrograms(g, () => lost || destroyed);
    if (lost || destroyed) return null;
    programs = built;
    quad = g.createBuffer();
    vao = g.createVertexArray();
    g.bindVertexArray(vao);
    g.bindBuffer(g.ARRAY_BUFFER, quad);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    g.enableVertexAttribArray(0);
    g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
    g.disable(g.DEPTH_TEST);
    g.disable(g.BLEND);
    targets = null;
    sim = { ...SIM_DEFAULTS };
    look = { ...LOOK_DEFAULTS };
    applyLook();
    let probeMs: number | null = null;
    if (options.quality === "auto") {
      probeMs = runProbe();
    } else {
      tierName = isTier(options.quality) ? options.quality : "medium";
      tier = TIERS[tierName];
      resize(true);
    }
    return { probeMs };
  }

  async function bring(first: boolean): Promise<Ink> {
    let booted: Booted | null = null;
    try {
      booted = await boot();
    } catch {
      booted = null;
    }
    if (destroyed || lost) return api;
    if (!booted || !targets) {
      api.supported = false;
      emit("unsupported");
      return api;
    }
    ready = true;
    if (wantedPreset) preset(wantedPreset.name, wantedPreset.overrides);
    if (wantedCalm !== undefined) setCalmZone(wantedCalm);
    render();
    emit(first ? "ready" : "restored", { tier: tierName, probeMs: booted.probeMs });
    if (first && options.autoStart) wanted = true;
    updateRunning();
    return api;
  }

  function onLost(event: Event) {
    event.preventDefault();
    lost = true;
    ready = false;
    targets = null;
    programs = null;
    updateRunning();
    emit("lost");
  }

  function onRestored() {
    lost = false;
    formats = gl ? pickFormats(gl) : null;
    if (!formats) {
      api.supported = false;
      emit("unsupported");
      return;
    }
    void bring(false);
  }

  function destroy() {
    if (destroyed) return;
    stop();
    destroyed = true;
    cleanup.forEach((fn) => fn());
    cleanup.length = 0;
    if (gl && !lost) {
      if (targets) for (const target of Object.values(targets)) freeTarget(gl, target);
      deletePrograms(gl, programs);
      gl.deleteBuffer(quad);
      gl.deleteVertexArray(vao);
    }
    targets = null;
    programs = null;
    listeners.clear();
  }

  function stats(): InkStats {
    let sum = 0;
    let worst = 0;
    for (let i = 0; i < frameFilled; i++) {
      const t = frameTimes[i] ?? 0;
      sum += t;
      if (t > worst) worst = t;
    }
    const avg = frameFilled ? sum / frameFilled : 0;
    return {
      supported: !!gl,
      tier: tierName,
      running,
      lost,
      preset: presetName,
      steps: stepCount,
      time: clock,
      fps: avg ? 1000 / avg : 0,
      frameMs: avg,
      worstFrameMs: worst,
      canvas: [canvas.width, canvas.height],
      css: [sizes.cssW, sizes.cssH],
      dpr: sizes.dpr,
      velocity: [sizes.simW, sizes.simH],
      dye: [sizes.dyeW, sizes.dyeH],
      pressureIterations: tier.pressure,
    };
  }

  /** What a scene's script is handed: its own clear leaves the rest of the script armed. */
  const script: SceneInk = { drop, stream, clear: (o) => clear(o, true) };

  const api: Mutable<Ink> = {
    supported: false,
    ready: undefined as unknown as Promise<Ink>,
    canvas,
    preset,
    start,
    stop,
    rest,
    step,
    still,
    drop,
    stir,
    stream,
    impulse,
    fire,
    setCalmZone,
    clear,
    set,
    setQuality,
    probe,
    resize: () => {
      resize(false);
      return api;
    },
    render: () => {
      render();
      return api;
    },
    measureCost: (frames) => (usable() ? measureCost(frames) : null),
    stats,
    on,
    off,
    destroy,
  };

  // ---- create the context ----
  try {
    gl = canvas.getContext("webgl2", CONTEXT_ATTRIBUTES);
    formats = gl ? pickFormats(gl) : null;
  } catch {
    gl = null;
    formats = null;
  }

  if (!gl || !formats) {
    gl = null;
    api.ready = Promise.resolve().then(() => {
      emit("unsupported");
      return api;
    });
    return api;
  }
  api.supported = true;
  sizes = measure();

  canvas.addEventListener("webglcontextlost", onLost, false);
  canvas.addEventListener("webglcontextrestored", onRestored, false);
  cleanup.push(() => {
    canvas.removeEventListener("webglcontextlost", onLost, false);
    canvas.removeEventListener("webglcontextrestored", onRestored, false);
  });

  if (options.autoResize && typeof ResizeObserver === "function") {
    let pending = 0;
    const ro = new ResizeObserver(() => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        resize(false);
      });
    });
    ro.observe(canvas);
    cleanup.push(() => {
      ro.disconnect();
      if (pending) cancelAnimationFrame(pending);
    });
  }
  if (options.autoPause) {
    const onVisibility = () => {
      visible = document.visibilityState !== "hidden";
      updateRunning();
    };
    document.addEventListener("visibilitychange", onVisibility);
    cleanup.push(() => document.removeEventListener("visibilitychange", onVisibility));
    onVisibility();
    if (typeof IntersectionObserver === "function") {
      const io = new IntersectionObserver((entries) => {
        onScreen = entries[entries.length - 1]?.isIntersecting ?? true;
        updateRunning();
      });
      io.observe(canvas);
      cleanup.push(() => io.disconnect());
    }
  }
  if (options.interactive) {
    const target = options.pointerTarget ?? window;
    target.addEventListener("pointermove", onPointerMove, { passive: true });
    cleanup.push(() => target.removeEventListener("pointermove", onPointerMove));
  }
  if (options.scrollImpulse) {
    lastScrollY = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanup.push(() => window.removeEventListener("scroll", onScroll));
  }

  if (options.preset) wantedPreset = { name: options.preset, overrides: {} };
  api.ready = bring(true);
  return api;
}
